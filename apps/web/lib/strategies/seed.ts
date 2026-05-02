export type Strategy = {
  id: string;
  name: string;
  description: string;
  creator: `0x${string}`;
  royaltyBps: number;
  inftTokenId: number;
  pair: { base: string; quote: string };
  aumUsd: number;
  apy7d: number;
};

export const SEED_STRATEGIES: Strategy[] = [
  {
    id: "conservative-usdc",
    name: "Conservative USDC Yield",
    description:
      "Rotates USDC between USDT/USDC pools when spread > 5 bps. Sealed inference on 0G Compute decides timing.",
    creator: "0x1F4AaC0F8E3D7e1c2B0c2c8E0c1f0e0c0F0E0E0E",
    royaltyBps: 1000,
    inftTokenId: 1,
    pair: { base: "USDC", quote: "USDT" },
    aumUsd: 12_400,
    apy7d: 4.8
  },
  {
    id: "eth-trend",
    name: "ETH Trend Follower",
    description:
      "Multi-agent: analyst proposes regime, risk-manager checks drawdown, executor swaps WETH/USDC via Uniswap.",
    creator: "0x2C3DEef0aBcD12345678EfAB0c0c0F0E0E0E0E0E",
    royaltyBps: 1500,
    inftTokenId: 2,
    pair: { base: "WETH", quote: "USDC" },
    aumUsd: 47_900,
    apy7d: 18.2
  },
  {
    id: "stables-arb",
    name: "Stables Spread Arb",
    description:
      "Watches USDC/USDT/DAI cross-rates, fires when spread covers gas + slippage. KeeperHub schedules the watch.",
    creator: "0x9aFbE07091cD3eF45678eFaB0c0c0F0E0E0E1234",
    royaltyBps: 800,
    inftTokenId: 3,
    pair: { base: "USDC", quote: "DAI" },
    aumUsd: 8_200,
    apy7d: 6.1
  }
];
