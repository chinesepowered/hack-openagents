import type { TradeProposal } from "./types";
import { uniswap } from "@/lib/uniswap/client";
import { keeperhub } from "@/lib/keeperhub/client";
import { ogStorage } from "@/lib/og/storage";

const ROUTING_TOKENS: Record<string, `0x${string}`> = {
  USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
  DAI: "0x6B175474E89094C44Da98b954EedeAC495271d0F"
};

const SETTLEMENT_ROUTER = (process.env.NEXT_PUBLIC_SETTLEMENT_ROUTER_ADDRESS ??
  "0x0000000000000000000000000000000000000000") as `0x${string}`;

const DEMO_USDC = (process.env.NEXT_PUBLIC_DEMO_ASSET_ADDRESS ??
  "0x0000000000000000000000000000000000000000") as `0x${string}`;
const DEMO_USDT = (process.env.NEXT_PUBLIC_DEMO_USDT_ADDRESS ??
  "0x0000000000000000000000000000000000000000") as `0x${string}`;

const SWAP_ABI = [
  {
    type: "function",
    name: "swapExactTokensForTokens",
    stateMutability: "nonpayable",
    inputs: [
      { name: "amountIn", type: "uint256" },
      { name: "amountOutMin", type: "uint256" },
      { name: "path", type: "address[]" },
      { name: "to", type: "address" },
      { name: "deadline", type: "uint256" }
    ],
    outputs: [{ name: "amounts", type: "uint256[]" }]
  }
] as const;

export async function runExecutor(proposal: TradeProposal) {
  const tokenIn = ROUTING_TOKENS[proposal.fromToken];
  const tokenOut = ROUTING_TOKENS[proposal.toToken];
  if (!tokenIn || !tokenOut) throw new Error("unknown token symbol");

  // 1) Pull a real Uniswap quote for routing intelligence.
  const quote = await uniswap.getQuote({
    tokenIn,
    tokenOut,
    amountIn: proposal.amountIn
  });

  // 2) Settle on 0G via KeeperHub's Direct Execution API. The path uses our
  //    on-0G demo tokens, but the routing decision was informed by Uniswap.
  const onChainPath = [DEMO_USDC, DEMO_USDT];
  const submission = await keeperhub.contractCall({
    contractAddress: SETTLEMENT_ROUTER,
    functionName: "swapExactTokensForTokens",
    functionArgs: [
      proposal.amountIn,
      "0",
      onChainPath,
      SETTLEMENT_ROUTER,
      Math.floor(Date.now() / 1000) + 300
    ],
    abi: SWAP_ABI as unknown as unknown[]
  });

  await ogStorage.appendLog(`strategy/${proposal.strategyId}/executions`, {
    ts: Date.now(),
    proposal,
    quote: { amountOut: quote.amountOut, route: quote.route, quoteId: quote.quoteId },
    txHash: submission.hash,
    keeperHubJobId: submission.jobId,
    statusUrl: submission.rawStatusUrl
  });

  return submission;
}
