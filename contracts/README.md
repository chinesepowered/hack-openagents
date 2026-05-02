# AgentFund Contracts

Foundry project. Two contracts:

- `StrategyINFT.sol` — ERC-7857 style iNFT for trading strategies. Stores creator, royalty bps, 0G Storage URI for the encrypted intelligence, and a hash of that intelligence for tamper detection.
- `StrategyVault.sol` — single-asset vault bound to a strategy iNFT. Depositors get shares, the agent trades on their behalf, and `distributeFees` splits realized profits between the iNFT creator (royalty), protocol, and LPs.

## Setup

```bash
# install foundry: https://book.getfoundry.sh/getting-started/installation
forge install OpenZeppelin/openzeppelin-contracts --no-commit
forge install foundry-rs/forge-std --no-commit

forge build
forge test -vv
```

## Deploy

```bash
export DEPLOYER_PRIVATE_KEY=0x...
export DEMO_ASSET_ADDRESS=0x...      # testnet USDC on 0G
export PROTOCOL_FEE_RECEIVER=0x...
forge script script/Deploy.s.sol --rpc-url $OG_RPC_URL --broadcast
```

After deploy, copy the printed `StrategyINFT` and `StrategyVault` addresses into the root `.env` under `NEXT_PUBLIC_STRATEGY_INFT_ADDRESS` and `NEXT_PUBLIC_STRATEGY_VAULT_ADDRESS`.
