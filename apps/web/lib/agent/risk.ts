import type { RiskVerdict, TradeProposal } from "./types";
import { ogStorage } from "@/lib/og/storage";

const MAX_SLIPPAGE_BPS = 50;
const MAX_POSITION_PCT = 30;

export async function runRisk(proposal: TradeProposal): Promise<RiskVerdict> {
  if (proposal.amountIn === "0") {
    return { ok: false, proposal, reason: "hold — no trade to execute" };
  }

  if (proposal.expectedSlippageBps > MAX_SLIPPAGE_BPS) {
    return {
      ok: false,
      proposal,
      reason: `slippage ${proposal.expectedSlippageBps}bps > ${MAX_SLIPPAGE_BPS}bps cap`
    };
  }

  const state = await ogStorage.readKv(
    `strategy/${proposal.strategyId}/state`
  );
  const positionPct = (state?.positionPct as number) ?? 0;
  if (positionPct > MAX_POSITION_PCT) {
    return {
      ok: false,
      proposal,
      reason: `position ${positionPct}% > ${MAX_POSITION_PCT}% cap`
    };
  }

  return { ok: true, proposal };
}
