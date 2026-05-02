export type Lane = "analyst" | "risk" | "executor";

export type AgentEvent = {
  ts: number;
  lane: Lane;
  text: string;
  hash?: string;
  inferenceReceipt?: string;
  storageRef?: string;
};

export type TradeProposal = {
  strategyId: string;
  fromToken: `0x${string}` | string;
  toToken: `0x${string}` | string;
  amountIn: string;
  rationale: string;
  expectedSlippageBps: number;
  inferenceReceipt: string;
};

export type RiskVerdict =
  | { ok: true; proposal: TradeProposal }
  | { ok: false; proposal: TradeProposal; reason: string };
