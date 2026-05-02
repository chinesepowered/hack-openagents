import { NextRequest } from "next/server";
import { runOnce } from "@/lib/agent/loop";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { strategyId: string; amount: string };
  if (!body?.strategyId)
    return Response.json({ error: "missing strategyId" }, { status: 400 });

  // Fire-and-forget: the agent loop publishes to the SSE bus.
  runOnce(body.strategyId).catch((err) => {
    console.error("[deposit] agent loop failed:", err);
  });

  return Response.json({ ok: true });
}
