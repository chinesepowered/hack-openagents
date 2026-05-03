# AgentFund — Pitch Narration

_Target length: ~3 minutes at a normal speaking pace (~150 wpm). Section 1 covers the README pitch (~1.5 min). Section 2 narrates the live demo (~1.5 min)._

## Section 1 — The pitch

Crypto needs more than chatbots. It needs autonomous agents that can hold capital, trade safely, and earn revenue for the people who built them. AgentFund makes that real.

Each strategy is an intelligent NFT — an iNFT, on 0G — encoding the agent's prompt, its model pointer, and a royalty cut for its creator. Mint a strategy, and every dollar that flows through it pays you a share. Forever.

The agent itself runs across three live systems. Its decisions come from sealed inference on 0G Compute, executed inside a trusted enclave so the receipt proves what the model actually said. Its memory — every past decision, every outcome — lives append-only in 0G Storage, so the agent learns over time without forgetting. Its routing intelligence comes from Uniswap's Trade API, which means even though we settle on 0G, every decision is informed by live mainnet liquidity. And every move the agent makes hits the chain through KeeperHub's Direct Execution API, which enforces a per-execution spending cap. That cap is the autonomous-payment ceiling the x402 standard is reaching for.

So you get a marketplace. Creators mint strategies. Capital flows in through ERC-4626 vaults. Agents trade. Fees split between liquidity providers, the protocol, and the creator. And every iNFT is a portable asset — sell it, lease it, upgrade it. Its intelligence travels with it.

## Section 2 — The live demo

Here's the running app. Three strategies sit on the marketplace — each one an iNFT minted on 0G Galileo testnet. We click "Conservative USDC Yield" — the strategy backed by token ID one in our registry contract.

The vault page loads with the agent's three-lane console. We trigger a tick.

Lane one — analyst — pulls a live Uniswap quote. You can see the route, the price impact, the gas estimate. That goes into a prompt for 0G Compute, which runs Qwen 2.5 inside a trusted enclave. The reply comes back as a sealed inference receipt. That receipt id is what proves to anyone watching that this decision came from the model we said it came from.

Lane two — risk — reads the strategy's recent state from 0G Storage and checks the proposal against slippage caps and position limits. If anything's outside policy, the trade is vetoed before it ever touches the chain.

Lane three — executor — packages the decision into Uniswap-V2-shaped swap calldata and sends it through KeeperHub's Direct Execution API. KeeperHub enforces the spending cap, signs, and broadcasts to 0G. There's the transaction hash. We click it — that's the real swap, on the 0G block explorer. One hundred mUSDC went in. Ninety-nine point nine-five mUSDT came out. Routing intelligence from Uniswap. Decision from 0G Compute. Memory in 0G Storage. Settlement on 0G. Execution by KeeperHub. End to end, in five seconds.

That's AgentFund.
