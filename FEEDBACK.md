# Builder Feedback

Notes from integrating Uniswap and KeeperHub into AgentFund — an iNFT strategy marketplace deployed on 0G Galileo testnet.

## Uniswap Trade API

**What worked**

- The quote endpoint (`POST /v1/quote`) was the cleanest part of the build. Single call, sensible response shape (`amountOut`, `priceImpact`, `route`, `gasFeeUsd`), and the response was rich enough to feed directly into our LLM prompt as routing context.
- `x-api-key` auth is straightforward — no signed nonces, no per-request handshakes. Got us live in minutes.
- Including the `route` array in the quote response is surprisingly useful for non-trivial pairs. We surface it in the agent console as part of the "analyst" lane evidence; users see which pools the routing engine would actually use.
- Fee data being denominated in USD (`gasFeeUsd`) — much more useful for an LLM prompt than gwei. Saved us a conversion step.

**Friction**

- **Discovering supported chains.** We're settling on 0G Galileo (chainId 16602), which Uniswap doesn't deploy on. Took a couple of attempts to land on the right pattern: query Uniswap with `chainId: 1` for routing intelligence, then settle on a Uniswap-V2-shaped router we deploy ourselves on 0G. A `GET /v1/chains` endpoint returning the supported chain IDs would have shortened that cycle.
- **No explicit indicator that a pair has thin liquidity** other than reading the `priceImpact` value. For our $100 stable swaps it didn't matter, but for the ETH-trend strategy a "this route is acceptable for size X" hint would let the analyst skip the LLM call entirely on obvious nopes.

**Documentation gaps**

- The `slippageTolerance` parameter format wasn't immediately obvious — is it a percentage (`0.5`) or basis points (`50`)? We ended up testing both. Showing the unit in the parameter name (`slippageTolerancePct` or `slippageToleranceBps`) would help.
- No worked example of consuming the `route` field. We figured it out from the response, but a "what to do with the route in your UI" snippet in the docs would be a nice DX touch.

**Feature requests**

- A `/v1/quote/explain` variant that returns a short natural-language description of the chosen route ("USDC → WETH on 0.05% pool, then WETH → USDT on 0.3% pool"). We're regenerating that string ourselves for the agent console; it would be useful primitive shared infra.
- Webhook or SSE for "this quote is now stale" — for agents that quote-then-decide-then-execute, knowing when a cached quote crossed a refresh threshold would tighten the loop.

## KeeperHub Direct Execution API

**What worked**

- The Direct Execution API model (`POST /api/execute/contract-call`) maps cleanly onto the agent's mental model: "here is a contract, here is the function, here are the args, here is the network — go." We didn't have to think about wallet management, nonces, or gas pricing for the writes that *did* succeed. That's the right level of abstraction.
- `/api/execute/check-and-execute` is a powerful primitive — read state, compare against a condition, conditionally execute — and it lines up perfectly with how a risk-gated trading agent thinks. We wired it for a downstream "rebalance if drawdown exceeds X" check and the request shape was intuitive.
- Bearer auth + an obvious `kh_…` key prefix made the API key easy to identify in code review.
- `/api/user/wallet` returning a clear `{ hasWallet, walletAddress, organizationId }` made onboarding diagnosable. Knowing whether a Para wallet was provisioned was one `curl` away.

**Friction**

- **0G Galileo (chainId 16602) acceptance vs. broadcast.** This is the single biggest issue. The Direct Execution API accepts `network: "16602"` — request validates, returns an `executionId`, status endpoint responds — but the Para wallet's nonce on 0G stays at zero. The signing pipeline acknowledges the request but doesn't actually broadcast to 0G's RPC. There is no error surfaced anywhere in the response chain; it just silently never lands. Reproduction:
  1. `POST /api/execute/contract-call` with `network: "16602"`, any valid contract on Galileo (we used a deployed `MockERC20.approve`), valid `functionArgs`, valid `abi`.
  2. Response: 200 with `{ executionId: "...", status: "..." }`.
  3. Poll `/api/execute/{executionId}/status`: returns without a `transactionHash`, status sometimes pending, sometimes completed.
  4. Query `cast nonce <para_wallet> --rpc-url https://evmrpc-testnet.0g.ai`: still 0.
  5. No errors anywhere.
- **524 Cloudflare timeouts** on a non-trivial fraction of `contract-call` requests. The backend either holds the connection past Cloudflare's 100s ceiling or has a slow path on this route. We ended up adding a 15s client-side abort and treating timeouts as "no hash, assume not landed."
- **Network slug list in docs.** The named-slug list on `docs.keeperhub.com` doesn't include 0G. We discovered chainId-as-string was accepted by trial and error; a `GET /api/chains` (or even just an explicit table in the docs of "named slugs vs. chainId-as-string fallback") would have saved an hour.
- **`docs.keeperhub.com` 403s on WebFetch / curl.** Cloudflare seems to block non-browser User-Agents on the docs subdomain. Minor, but annoying when wiring up an LLM-assisted research loop.

**Reproducible bugs**

- **Silent failure on unsupported-chain broadcast** (covered above). The fix is either: (a) reject the contract-call with a clear "chain X is not supported for signing yet" error at submission time; or (b) surface a `failed` status with a reason string when the broadcast attempt times out internally. Right now the only way to detect failure is to poll the chain RPC ourselves.
- **`/api/executions` endpoint returns 404** when called directly, even though docs reference an executions listing. We had to fall back to per-execution `/api/execute/{id}/status` polling. Either the docs are out of date or the endpoint is at a different path.

**Documentation gaps**

- No mention of which chains have working Para signing vs. which are accepted-but-not-yet-broadcasting. A simple support matrix would have changed our integration approach on day one.
- Spending cap docs explain the cap exists but don't show what the API response looks like when a request exceeds the cap. We never hit ours, so we never saw the failure mode — meaning we couldn't UX-handle it. A worked example would help.
- No example for setting metadata on a `contract-call` execution — useful for tying a KeeperHub job ID back to the strategy iNFT in our case.

**Feature requests**

- **Per-chain support indicator on the dashboard and API.** A simple `GET /api/chains` returning `[{ chainId, slug, signingSupported, conditionalExecSupported }]` would let integrators avoid the silent-fail trap.
- **Webhook on execution state change** so we don't have to poll `/status`. We'd subscribe per-strategy and feed events directly into the SSE bus driving our agent console.
- **Dry-run mode** on `contract-call` — submit the call, get back the encoded calldata KeeperHub *would* sign, without spending a slot in the spending cap. Useful for previewing what the agent is about to do in a UI.
- **MCP endpoint for KeeperHub** — we'd love to expose KeeperHub directly to LLM-based agents as a tool. The Direct Execution API is already the right shape; an MCP wrapper would let any MCP-aware agent call it without hand-rolled glue.

**x402 angle**

We treated the org-level **spending cap** as the per-execution autonomous-payment ceiling — this is the role x402 is reaching for, and it's already implementable today via KeeperHub's existing primitives. The narrative writes itself: every agent decision is a `contract-call` whose execution is bounded by a cap the org sets, and exceeding the cap is a deterministic, declarative fail-closed. If KeeperHub wants to publicly position around x402, the spending cap is the headline.
