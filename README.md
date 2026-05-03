# AgentFund 🤖💸

**A marketplace where AI trading strategies are NFTs.**
Mint your agent. Earn royalties on every dollar it manages. Forever.

---

## ✨ The Idea

For DeFi to feel like a real product, capital has to be put to work without anyone babysitting it. AgentFund is the marketplace for that.

- 🎨 **Creators** mint a strategy as an intelligent NFT — an *iNFT*. The agent's prompt, its model pointer, and a royalty cut all live on-chain.
- 💰 **Depositors** browse the marketplace, pick a strategy, and deposit USDC into its ERC-4626 vault. The agent trades on their behalf.
- 🔁 **Royalties flow forever.** 70% of fees to LPs, 20% to the protocol, 10% to the iNFT creator. The strategy is a portable asset — transfer it, lease it, upgrade it. Its intelligence travels with it.

The agent itself is the interesting part. Its **brain** runs on 0G Compute (sealed inference, TEE-attested). Its **memory** lives on 0G Storage (append-only decision logs). Its **routing intelligence** comes from Uniswap (live mainnet liquidity). Its **execution** lands on-chain through KeeperHub (with a per-trade spending cap as the autonomous-payment ceiling).

---

## 🧠 How It Works

```
                user deposits USDC
                       │
                       ▼
          ┌────────────────────────┐
          │ StrategyVault (ERC-4626) │
          └───────────┬────────────┘
                      │
       ┌──────────────▼──────────────┐
       │     Agent Loop on 0G        │
       │                             │
       │  📊 Analyst                 │
       │     🦄 Uniswap quote        │
       │     🟦 0G Compute (TEE)     │
       │                             │
       │  🛡️ Risk gate                │
       │     🟦 0G Storage memory     │
       │                             │
       │  ⚡ Executor                 │
       │     🦊 KeeperHub exec        │
       │     🟦 Settle on 0G          │
       └─────────────┬───────────────┘
                     │
        fees split → LPs + protocol + creator
```

Every tick is a real, end-to-end on-chain swap on 0G Galileo.

---

## 🤝 How We Use Each Sponsor

### 🟦 0G — agents as on-chain assets

Four primitives, all live on Galileo testnet:

| What                  | Where it lives                                                                                                                                                                |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **iNFT registry**     | [`StrategyINFT`](https://chainscan-galileo.0g.ai/address/0xa71a26a93F318F82a7DbA6aAf8aef9cD2c5B7E15) — token #1 minted with on-chain `intelligenceHash` and 10% creator royalty |
| **Vault**             | [`StrategyVault`](https://chainscan-galileo.0g.ai/address/0x0C9955428da76AD04539AbFF63f6Abe76441aca2) — ERC-4626, royalty-aware fee distribution                              |
| **Settlement router** | [`SettlementRouter`](https://chainscan-galileo.0g.ai/address/0x3AF5B121dE056755d8D751b21f7885dE03A87efE) — Uniswap-V2-shaped router native to 0G                              |
| **Sealed inference**  | 0G Compute via `qwen/qwen-2.5-7b-instruct` — every analyst tick returns a TEE-attested receipt id stored alongside the decision                                               |
| **Append-only memory** | 0G Storage at `strategy/<id>/decisions` and `strategy/<id>/executions` — the agent learns over time without forgetting                                                       |

🔗 **Live agent-driven swap on 0G:** [`0x37ace19...819dde`](https://chainscan-galileo.0g.ai/tx/0x37ace190b10902790f4ebb9bb1f883a0d1f3c371cf2f12972c45384afa819dde) — 100 mUSDC in, 99.95 mUSDT out, executed end-to-end by the agent.

### 🦄 Uniswap — routing intelligence

The agent doesn't pretend to know markets. On every tick it calls Uniswap's **Trade API** on mainnet:

1. `POST /v1/quote` with the strategy's pair, size, and slippage tolerance
2. Pulls back `amountOut`, `priceImpact`, the full `route` across pools, and `gasFeeUsd`
3. Feeds those numbers directly into the 0G Compute prompt

So even though settlement happens on 0G, every decision is grounded in real mainnet liquidity. The LLM is never asked to guess prices it can't see.

📁 **Code:** [`apps/web/lib/uniswap/client.ts`](./apps/web/lib/uniswap/client.ts) · [`apps/web/lib/agent/analyst.ts`](./apps/web/lib/agent/analyst.ts)

### 🦊 KeeperHub — autonomous execution with a spending cap

Every executor decision flows through KeeperHub's **Direct Execution API**:

- The agent's runtime wallet is the org's [Para wallet `0xb62b...f250`](https://chainscan-galileo.0g.ai/address/0xb62b29BfA8A23fc13Fa1301F0c75ca7cDDF9f250) provisioned at app.keeperhub.com
- Each call: `POST /api/execute/contract-call` with the swap calldata and `network: "16602"` (0G Galileo)
- The **org-level spending cap** is the per-execution autonomous-payment ceiling — exactly the role the x402 standard is reaching for
- KeeperHub job IDs are recorded in 0G Storage alongside every settlement, so the audit trail is complete

📁 **Code:** [`apps/web/lib/keeperhub/client.ts`](./apps/web/lib/keeperhub/client.ts)

---

## 🌐 Live Deployment

**Network:** 0G Galileo testnet · **Chain ID:** `16602` · **Explorer:** https://chainscan-galileo.0g.ai

| Contract                  | Address                                                                                                                          |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| StrategyINFT (registry)   | [`0xa71a26a93F318F82a7DbA6aAf8aef9cD2c5B7E15`](https://chainscan-galileo.0g.ai/address/0xa71a26a93F318F82a7DbA6aAf8aef9cD2c5B7E15) |
| StrategyVault             | [`0x0C9955428da76AD04539AbFF63f6Abe76441aca2`](https://chainscan-galileo.0g.ai/address/0x0C9955428da76AD04539AbFF63f6Abe76441aca2) |
| SettlementRouter          | [`0x3AF5B121dE056755d8D751b21f7885dE03A87efE`](https://chainscan-galileo.0g.ai/address/0x3AF5B121dE056755d8D751b21f7885dE03A87efE) |
| Mock USDC (mUSDC)         | [`0xb38124095d7Dce2483A449f7555f457f936B9c47`](https://chainscan-galileo.0g.ai/address/0xb38124095d7Dce2483A449f7555f457f936B9c47) |
| Mock USDT (mUSDT)         | [`0x15B934832E1E15072441AE7815F996F636fd1D42`](https://chainscan-galileo.0g.ai/address/0x15B934832E1E15072441AE7815F996F636fd1D42) |

**Strategy iNFT #1** — *"Conservative USDC Yield"* — minted with `intelligenceHash = 0x036c6d4555cf0634fd6e2284372c7a95fd8ef2130352fa67f58765d596a24c75`, royalty `1000` bps to creator.

---

## 🛠️ Stack

Next.js 15 · TypeScript · Tailwind · viem · wagmi · Foundry · 0G Compute + Storage · Uniswap Trade API · KeeperHub Direct Execution

## 🚀 Run It Yourself

See [`DEPLOY.md`](./DEPLOY.md) for local setup and the demo walkthrough.
