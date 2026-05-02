# AgentFund — Build Plan

## What We're Building

A DeFi vault marketplace where AI trading strategies are minted as iNFTs (ERC-7857) on 0G. Users browse strategies, deposit into the ones they like, and watch the agent trade autonomously via Uniswap with execution guaranteed by KeeperHub. Strategy creators earn royalties on every usage, forever.

**One-liner pitch:** "BlackRock for the agent era — strategies as composable, ownable, royalty-earning iNFTs."

## Sponsors (Locked, 3)

### 0G — Best Autonomous Agents track ($7,500 pool, ~$1,500 target)
- ERC-7857 iNFT per strategy with encrypted intelligence pointer to 0G Storage
- Persistent agent memory: 0G Storage KV (live state), 0G Storage Log (decision history)
- Sealed inference on 0G Compute for trade decisions — proves the agent really reasoned, didn't front-run
- Royalty splits on every fee distribution to original strategy creator

### Uniswap — Best API Integration ($5,000 pool)
- Uniswap API for quotes and swaps
- Multi-agent coordination as the differentiator: analyst proposes, risk-manager vetoes, executor swaps
- FEEDBACK.md required

### KeeperHub — Best Use ($4,500 pool) + Feedback Bounty ($250)
- All onchain actions submitted via KeeperHub MCP
- x402 autonomous payment: the agent has its own wallet and pays per-execution
- Scheduled keeper for periodic vault rebalancing / health monitoring
- Full audit trail tying agent decisions (logged on 0G) to onchain executions
- Honest FEEDBACK.md for the bounty

## Architecture

```
+----------------------------------------------------------+
|                    Next.js Web App                       |
|  Marketplace  |  Vault Dashboard  |  Agent Console       |
+--------------------------+-------------------------------+
                           |
                           v
+----------------------------------------------------------+
|                   Agent Runtime (Node)                   |
|  Analyst -> Risk Gate -> Executor                        |
|  Memory: 0G Storage  |  Inference: 0G Compute (sealed)   |
|  Pays for compute + execution via x402                   |
+--------------------------+-------------------------------+
                           |
            +--------------+--------------+
            v                             v
+--------------------+        +--------------------+
|  Uniswap API       |        |  KeeperHub MCP     |
|  quotes + swap     |        |  reliable submit   |
|  calldata          |        |  scheduled keepers |
+--------------------+        +--------------------+
                           |
                           v
+----------------------------------------------------------+
|                   0G Chain Contracts                     |
|  StrategyINFT (ERC-7857)  |  StrategyVault              |
+----------------------------------------------------------+
```

## Tech Stack

- **Frontend:** Next.js 15 (App Router), TypeScript, Tailwind, shadcn/ui
- **Contracts:** Foundry, Solidity ^0.8.24
- **Wallet:** wagmi + viem
- **Agent runtime:** Node.js inside Next.js API routes (keep it monolithic for hackathon speed)
- **LLM:** 0G Compute sealed inference (Qwen3.6-plus or GLM-5-FP8 per their docs)
- **Storage:** 0G Storage KV + Log via 0G SDK
- **DEX:** Uniswap API (quotes), router contract for swaps
- **Execution:** KeeperHub MCP server, x402 for agent payments

## Build Phases (rough hour budget)

### Phase 0: Setup [1h]
- pnpm workspace + Next.js + Tailwind + shadcn
- Foundry init in `contracts/`
- Install: `@0glabs/0g-ts-sdk`, `viem`, `wagmi`, `ethers`
- `.env.example` with all required keys
- KeeperHub MCP installed and connected

### Phase 1: Contracts [3h]
- `StrategyINFT.sol` — ERC-7857; mint with metadata URI pointing to 0G Storage; royalty receiver baked in
- `StrategyVault.sol` — single-asset deposit, share tokens, fee distribution with royalty split (e.g., 70% LPs / 20% protocol / 10% strategy creator)
- Deploy to 0G testnet
- Verify on 0G explorer
- Mint 2-3 seed strategies as iNFTs

### Phase 2: Agent Runtime [4h]
- `analyst.ts` — generates trade proposal from market data
- `risk.ts` — checks proposal against limits (slippage, position size, drawdown)
- `executor.ts` — assembles tx, submits via KeeperHub
- 0G Compute integration for sealed inference (mock-then-real pattern)
- 0G Storage writes for every decision (Log) + position state (KV)

### Phase 3: Uniswap Integration [2h]
- Quote fetcher
- Swap calldata builder
- Wire into executor
- Stable pair (USDC/USDT or USDC/WETH) to reduce slippage in demo

### Phase 4: KeeperHub Integration [2h]
- Route every onchain write through KeeperHub MCP
- Configure scheduled keeper for vault rebalance check (every N blocks)
- Wire x402 payment so agent's wallet pays per-execution
- Verify audit trail visible

### Phase 5: Frontend [4h]
- `/` Marketplace — grid of strategy cards (name, creator, AUM, APY, royalty %)
- `/strategy/[id]` Vault page — deposit form, position chart, agent console (live reasoning feed)
- `/agent/[id]` Agent detail — full memory log, sealed inference receipts
- Polish with shadcn components, framer-motion for live updates

### Phase 6: Demo Polish [3h]
- Pre-fund vault on testnet
- Pre-mint iNFTs
- Cache one sealed-inference response as fallback
- Pre-record fallback clips for: deposit, swap, royalty distribution
- Demo script (90 seconds)
- Architecture diagram (already drafted above)
- README + setup instructions
- FEEDBACK.md (Uniswap track requirement + KeeperHub bounty)
- 3-minute demo video

### Phase 7: Submission
- Public GitHub repo
- Contract addresses (StrategyINFT + StrategyVault)
- iNFT links on 0G explorer with proof of embedded intelligence
- Live demo URL (Vercel deploy)
- Team contact info (Telegram + X)

## Demo Script (90 seconds)

1. **(0:00–0:15)** Open marketplace. Three strategy iNFTs visible. "Each strategy is an iNFT with persistent memory and a creator who earns royalties forever."
2. **(0:15–0:35)** Click into "Conservative USDC Yield" strategy. Show creator's address (royalty recipient), live AUM, current positions. Click Deposit, deposit 100 USDC.
3. **(0:35–1:00)** Switch to Agent Console. Watch sealed inference receipt arrive ("Agent reasoned: USDC > USDT spread is X bps, swap"). See risk-manager approve. See KeeperHub execute. Show 0G explorer link for the inference receipt.
4. **(1:00–1:20)** Trade settles via Uniswap. Vault NAV updates. "And here's the royalty hit." Show creator's wallet receiving their cut.
5. **(1:20–1:30)** "Anyone can mint a strategy iNFT. Anyone can deposit into anyone's strategy. Creators earn forever. That's AgentFund."

## What I Need From You

- [ ] 0G testnet RPC URL + chain ID (from build.0g.ai)
- [ ] 0G testnet faucet tokens
- [ ] Testnet wallet private key (NEVER mainnet — use a burner)
- [ ] KeeperHub account + MCP credentials (sign up at app.keeperhub.com)
- [ ] Telegram handle + X handle for submission
- [ ] Vercel account (or alternative) for deploy
- [ ] Optional: OpenAI/Anthropic key for offline development if 0G Compute is rate-limited

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Live testnet swap fails on stage | Pre-recorded clip cued + secondary recorded demo |
| 0G Compute too slow for live demo | Cache the inference response, replay on demo |
| Multi-agent coordination is invisible to judges | Show analyst/risk/executor as three lanes in the console UI |
| iNFT minting fails | Pre-mint all demo iNFTs hours before |
| Vercel + 0G testnet flake | Have local dev server as backup |
| KeeperHub MCP connection drops | Test 24h before, have CLI fallback |

## File Layout (target)

```
hack-openagents/
├── apps/
│   └── web/                 # Next.js app
│       ├── app/             # routes
│       ├── components/      # UI
│       ├── lib/
│       │   ├── agent/       # analyst, risk, executor
│       │   ├── og/          # 0G Storage + Compute clients
│       │   ├── uniswap/     # quote + swap helpers
│       │   └── keeperhub/   # MCP wrappers + x402
│       └── api/             # agent runtime endpoints
├── contracts/               # Foundry
│   ├── src/
│   │   ├── StrategyINFT.sol
│   │   └── StrategyVault.sol
│   ├── script/
│   └── test/
├── plan.md
├── hackathon.md             # leave as-is
├── README.md
├── FEEDBACK.md              # for Uniswap + KeeperHub
└── .env.example
```

## Out of Scope (resist scope creep)

- AXL / ENS integration (not chosen sponsors)
- Multi-chain (0G testnet only)
- Real cross-strategy composability beyond what the demo shows
- Mainnet anything
- Mobile responsive beyond basics
- Auth / user accounts (just connect wallet)
- Agent breeding / merging (defer)
- More than 3 seed strategies
