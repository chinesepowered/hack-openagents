# Deploy & Demo Locally

Spin up AgentFund end-to-end on 0G Galileo testnet. ~15 minutes if you already have wallets and keys.

## Prerequisites

- **Node 20+** and **pnpm 9+**
- **Foundry** (`forge` + `cast`). On Windows: download `foundry_v*_win32_amd64.zip` from [foundry releases](https://github.com/foundry-rs/foundry/releases), extract to `~/.foundry/bin`, add to PATH. On macOS/Linux: `curl -L https://foundry.paradigm.xyz | bash && foundryup`.
- **MetaMask** with 0G Galileo testnet added:
  - Chain ID `16602`
  - RPC `https://evmrpc-testnet.0g.ai`
  - Currency `0G`
  - Explorer `https://chainscan-galileo.0g.ai`
- A burner deployer wallet with testnet 0G. Faucet: https://faucet.0g.ai.
- API keys for **0G Compute**, **Uniswap**, and **KeeperHub** (free signup at each).
- A **KeeperHub Para wallet** provisioned at app.keeperhub.com → Wallet Management.

## 1. Install

```bash
git clone <repo> hack-openagents
cd hack-openagents
pnpm install
```

## 2. Configure environment

Create `.env` at the repo root:

```bash
# ===== 0G Galileo testnet =====
OG_RPC_URL=https://evmrpc-testnet.0g.ai
OG_CHAIN_ID=16602
OG_FAUCET_URL=https://faucet.0g.ai
OG_EXPLORER_URL=https://chainscan-galileo.0g.ai
OG_STORAGE_INDEXER=https://indexer-storage-testnet-turbo.0g.ai

# 0G Compute (OpenAI-compatible)
OG_COMPUTE_ENDPOINT=https://compute-network-6.integratenetwork.work/v1/proxy
OG_COMPUTE_API_KEY=app-sk-...
OG_COMPUTE_MODEL=qwen/qwen-2.5-7b-instruct

# ===== Deployer (testnet burner) =====
DEPLOYER_PRIVATE_KEY=...                    # without 0x prefix is fine
DEPLOYER_ADDRESS=0x...
PROTOCOL_FEE_RECEIVER=0x...                  # often == DEPLOYER_ADDRESS

# ===== Contract addresses (filled after deploy in step 3) =====
NEXT_PUBLIC_DEMO_ASSET_ADDRESS=
NEXT_PUBLIC_DEMO_USDT_ADDRESS=
NEXT_PUBLIC_SETTLEMENT_ROUTER_ADDRESS=
NEXT_PUBLIC_STRATEGY_INFT_ADDRESS=
NEXT_PUBLIC_STRATEGY_VAULT_ADDRESS=
NEXT_PUBLIC_OG_CHAIN_ID=16602
NEXT_PUBLIC_OG_RPC_URL=https://evmrpc-testnet.0g.ai
NEXT_PUBLIC_OG_EXPLORER_URL=https://chainscan-galileo.0g.ai

# ===== Uniswap (mainnet routing intelligence) =====
UNISWAP_API_KEY=...
UNISWAP_API_BASE_URL=https://trade-api.gateway.uniswap.org/v1
UNISWAP_QUOTE_CHAIN_ID=1

# ===== KeeperHub =====
KEEPERHUB_API_KEY=kh_...
KEEPERHUB_API_BASE_URL=https://app.keeperhub.com/api
KEEPERHUB_NETWORK=16602
KEEPERHUB_PARA_WALLET_ADDRESS=0x...           # from app.keeperhub.com → Wallet Management
```

Next.js loads its env from the workspace, so mirror the file:

```bash
cp .env apps/web/.env
```

## 3. Deploy contracts to 0G

From the repo root:

```bash
cd contracts
forge install OpenZeppelin/openzeppelin-contracts foundry-rs/forge-std
forge build
```

Load env vars and run the deploy script. In **Git Bash**:

```bash
set -a; source ../.env; set +a
# Foundry's vm.envUint expects a 0x prefix for hex parsing
export DEPLOYER_PRIVATE_KEY=0x$DEPLOYER_PRIVATE_KEY
forge script script/Deploy.s.sol --rpc-url "$OG_RPC_URL" --broadcast
```

In **PowerShell**:

```powershell
Get-Content ..\.env | ForEach-Object { if ($_ -match "^([A-Z_][A-Z0-9_]*)=(.*)$") { Set-Item "env:$($matches[1])" $matches[2] } }
if ($env:DEPLOYER_PRIVATE_KEY -notmatch "^0x") { $env:DEPLOYER_PRIVATE_KEY = "0x$env:DEPLOYER_PRIVATE_KEY" }
forge script script/Deploy.s.sol --rpc-url $env:OG_RPC_URL --broadcast
```

The script prints five addresses at the end:

```
mUSDC                 0x...
mUSDT                 0x...
SettlementRouter      0x...
StrategyINFT          0x...
StrategyVault         0x...
```

Paste them into `.env` (root **and** `apps/web/.env`) under the contract addresses section.

## 4. Pre-fund the agent's runtime wallet

The agent's runtime wallet (KeeperHub Para) needs working capital, and the deployer wallet needs to approve the router. From the repo root, with env vars loaded:

```bash
USDC=$NEXT_PUBLIC_DEMO_ASSET_ADDRESS
ROUTER=$NEXT_PUBLIC_SETTLEMENT_ROUTER_ADDRESS
PARA=$KEEPERHUB_PARA_WALLET_ADDRESS
RPC=$OG_RPC_URL
KEY=$DEPLOYER_PRIVATE_KEY

# 100k mUSDC to the agent's runtime wallet
cast send $USDC "mint(address,uint256)" $PARA 100000000000 \
  --rpc-url $RPC --private-key $KEY --priority-gas-price 2000000000

# Approve the router to pull mUSDC from the deployer (settlement path)
cast send $USDC "approve(address,uint256)" $ROUTER 115792089237316195423570985008687907853269984665640564039457584007913129639935 \
  --rpc-url $RPC --private-key $KEY --priority-gas-price 2000000000
```

## 5. Run the app

From the repo root:

```bash
pnpm --filter web dev
```

Open http://localhost:3000.

## Demo walkthrough

1. **Marketplace** — three strategies are pre-listed. Click *"Conservative USDC Yield"*.
2. **Strategy page** — shows the iNFT token id, the vault address, and the agent's three-lane console (analyst · risk · executor).
3. **Trigger a tick** — click the **Run agent** button on the page, or hit the API directly:

   ```bash
   curl -s -X POST http://localhost:3000/api/agent/tick \
     -H "content-type: application/json" \
     -d '{"strategyId":"conservative-usdc"}'
   ```

4. **Watch the lanes light up:**
   - **Analyst** — pulls a live Uniswap quote, calls 0G Compute, surfaces the sealed inference receipt id.
   - **Risk** — checks slippage cap and position limit against state read from 0G Storage.
   - **Executor** — sends the swap to KeeperHub, captures the on-chain hash, links to chainscan-galileo.

5. **Click the hash** — verify the swap on the 0G block explorer. mUSDC went in, mUSDT came out.

## Quick verification (CLI)

```bash
# After a tick
cast call $NEXT_PUBLIC_DEMO_ASSET_ADDRESS "balanceOf(address)(uint256)" $DEPLOYER_ADDRESS --rpc-url $RPC
cast call $NEXT_PUBLIC_DEMO_USDT_ADDRESS  "balanceOf(address)(uint256)" $DEPLOYER_ADDRESS --rpc-url $RPC

# Read the iNFT strategy struct
cast call $NEXT_PUBLIC_STRATEGY_INFT_ADDRESS \
  "strategies(uint256)(address,uint96,string,bytes32,uint64,uint64)" 1 \
  --rpc-url $RPC
```

## Troubleshooting

- **`vm.envUint: missing hex prefix`** — Foundry's `envUint` needs `0x` on the private key. `export DEPLOYER_PRIVATE_KEY=0x$DEPLOYER_PRIVATE_KEY` first.
- **`gas tip cap 1, minimum needed 2000000000`** — 0G Galileo requires ≥ 2 gwei priority fee. Always pass `--priority-gas-price 2000000000` to `cast send`.
- **`forge install` looks stuck** — submodules clone deeply. Re-run if interrupted; it resumes.
- **Next.js says env vars are missing** — Next reads `apps/web/.env`, not the root. After editing the root `.env`, re-copy: `cp .env apps/web/.env`.
- **Agent says `skipped: true`** — the risk gate vetoed (slippage > 50 bps, or position > 30%). Run again; the LLM proposes a fresh decision each tick.
- **Port 3000 in use** — `pnpm --filter web dev -- -p 3001` to switch ports, or kill the existing process.
