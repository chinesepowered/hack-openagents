import { runAnalyst } from "./analyst";
import { runRisk } from "./risk";
import { runExecutor } from "./executor";
import { publish } from "./bus";

export async function runOnce(strategyId: string) {
  publish(strategyId, {
    ts: Date.now(),
    lane: "analyst",
    text: "Pulling market state and recent decisions from 0G Storage…"
  });

  const proposal = await runAnalyst(strategyId);
  publish(strategyId, {
    ts: Date.now(),
    lane: "analyst",
    text: `Proposal: ${proposal.rationale}`,
    inferenceReceipt: proposal.inferenceReceipt
  });

  publish(strategyId, {
    ts: Date.now(),
    lane: "risk",
    text: "Checking slippage cap and position limits…"
  });

  const verdict = await runRisk(proposal);
  if (!verdict.ok) {
    publish(strategyId, {
      ts: Date.now(),
      lane: "risk",
      text: `Vetoed: ${verdict.reason}`
    });
    return { skipped: true as const, reason: verdict.reason };
  }
  publish(strategyId, {
    ts: Date.now(),
    lane: "risk",
    text: "Approved."
  });

  publish(strategyId, {
    ts: Date.now(),
    lane: "executor",
    text: `Quoting ${proposal.amountIn} ${proposal.fromToken} → ${proposal.toToken} on Uniswap…`
  });

  const tx = await runExecutor(verdict.proposal);
  publish(strategyId, {
    ts: Date.now(),
    lane: "executor",
    text: `Submitted via KeeperHub (x402 paid). tx ${tx.hash}`,
    hash: tx.hash
  });

  return { skipped: false as const, hash: tx.hash };
}
