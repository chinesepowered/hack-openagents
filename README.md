# AgentFund

A DeFi vault marketplace where AI trading strategies are minted as iNFTs (ERC-7857) on 0G. Users deposit into strategies they like, agents trade autonomously via Uniswap with execution guaranteed by KeeperHub, and creators earn royalties forever.

## Sponsors

- **0G** — strategies as iNFTs with embedded intelligence, persistent memory in 0G Storage, sealed inference on 0G Compute
- **Uniswap** — multi-agent coordination for trade decisions, swap execution via Uniswap API
- **KeeperHub** — reliable onchain execution, scheduled keepers for monitoring, x402 autonomous agent payments

See [`plan.md`](./plan.md) for the full build plan.

## Repo Layout

```
apps/web/          Next.js app (UI + agent runtime)
contracts/         Foundry contracts (StrategyINFT + StrategyVault)
plan.md            Build plan
hackathon.md       Hackathon brief
FEEDBACK.md        Sponsor feedback (Uniswap + KeeperHub tracks)
```

## Setup

```bash
pnpm install
cp .env.example .env
# fill in 0G, KeeperHub, and Uniswap credentials

# contracts
pnpm contracts:build
pnpm contracts:deploy

# web
pnpm dev
```

## Stack

Next.js 15 · TypeScript · Tailwind · shadcn/ui · viem · wagmi · Foundry · 0G SDK · Uniswap API · KeeperHub MCP
