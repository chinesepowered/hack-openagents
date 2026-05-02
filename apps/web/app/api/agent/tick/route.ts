import { NextRequest } from "next/server";
import { runOnce } from "@/lib/agent/loop";

export const runtime = "nodejs";

/**
 * Endpoint hit by KeeperHub's scheduled keeper to drive the agent loop on
 * a cadence (e.g., every N blocks). Same handler as /deposit but framed as
 * an external trigger.
 */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { strategyId?: string };
  const strategyId = body.strategyId ?? req.nextUrl.searchParams.get("strategyId");
  if (!strategyId)
    return Response.json({ error: "missing strategyId" }, { status: 400 });

  const result = await runOnce(strategyId);
  return Response.json(result);
}
