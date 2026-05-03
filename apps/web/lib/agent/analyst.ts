import { ogCompute } from "@/lib/og/compute";
import { ogStorage } from "@/lib/og/storage";
import { uniswap } from "@/lib/uniswap/client";
import type { TradeProposal } from "./types";
import { SEED_STRATEGIES } from "@/lib/strategies/seed";

// Mainnet token addresses we feed to Uniswap for routing intelligence,
// regardless of where settlement happens. These are USDC, WETH, USDT, DAI.
const ROUTING_TOKENS: Record<string, `0x${string}`> = {
  USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
  DAI: "0x6B175474E89094C44Da98b954EedeAC495271d0F"
};

export async function runAnalyst(strategyId: string): Promise<TradeProposal> {
  const strategy = SEED_STRATEGIES.find((s) => s.id === strategyId);
  if (!strategy) throw new Error(`unknown strategy ${strategyId}`);

  const memory = await ogStorage.readLog(`strategy/${strategyId}/decisions`);
  const recentDecisions = memory.slice(-5);

  const tokenIn = ROUTING_TOKENS[strategy.pair.base];
  const tokenOut = ROUTING_TOKENS[strategy.pair.quote];
  let liveQuote = null as Awaited<ReturnType<typeof uniswap.getQuote>> | null;
  if (tokenIn && tokenOut) {
    liveQuote = await uniswap.getQuote({
      tokenIn,
      tokenOut,
      amountIn: "1000000"
    });
  }

  const isStablePair =
    ["USDC", "USDT", "DAI"].includes(strategy.pair.base) &&
    ["USDC", "USDT", "DAI"].includes(strategy.pair.quote);

  const prompt = [
    `You are the analyst for a small ($100 size) on-chain trading strategy.`,
    `Strategy: "${strategy.name}". Pair: ${strategy.pair.base}/${strategy.pair.quote}.`,
    `Recent decisions (most recent last): ${JSON.stringify(recentDecisions)}.`,
    liveQuote
      ? `Live Uniswap quote (1.0 ${strategy.pair.base} -> ${strategy.pair.quote}): amountOut=${liveQuote.amountOut}, priceImpact=${liveQuote.priceImpact}, route=${liveQuote.route}, gasFeeUsd=${liveQuote.gasFeeUsd}.`
      : `No live quote available; reason from memory.`,
    isStablePair
      ? `Pair is stable-to-stable. Realistic slippage for $100 size is 1-10 bps. Risk gate rejects trades above 30 bps, so set expectedSlippageBps in the 3-15 range.`
      : `Realistic slippage for $100 in this pair is typically 5-30 bps; risk gate rejects above 50 bps.`,
    `Bias toward executing small trades to keep the strategy active. Only output "hold" if there is a clear reason from recent decisions.`,
    `Return only this JSON, no prose:`,
    `{"side":"buy"|"sell"|"hold","rationale":string,"expectedSlippageBps":number}`
  ].join("\n");

  const inference = await ogCompute.sealedInference({ prompt });

  const decision = safeParse(inference.text) ?? {
    side: "hold",
    rationale: "fallback: insufficient signal",
    expectedSlippageBps: 0
  };

  // 100 units in token's smallest denomination. Stables here are 6 decimals
  // (mUSDC/mUSDT), so 100 * 1e6.
  const TRADE_AMOUNT = "100000000";
  const proposal: TradeProposal = {
    strategyId,
    fromToken: strategy.pair.base,
    toToken: strategy.pair.quote,
    amountIn: decision.side === "hold" ? "0" : TRADE_AMOUNT,
    rationale: decision.rationale,
    expectedSlippageBps: decision.expectedSlippageBps ?? 5,
    inferenceReceipt: inference.receipt
  };

  await ogStorage.appendLog(`strategy/${strategyId}/decisions`, {
    ts: Date.now(),
    lane: "analyst",
    proposal,
    quote: liveQuote
  });

  return proposal;
}

function safeParse(s: string): any | null {
  try {
    const m = s.match(/\{[\s\S]*\}/);
    return m ? JSON.parse(m[0]) : null;
  } catch {
    return null;
  }
}
