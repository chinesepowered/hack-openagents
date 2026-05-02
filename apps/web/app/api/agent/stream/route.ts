import { NextRequest } from "next/server";
import { subscribe } from "@/lib/agent/bus";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const strategyId = req.nextUrl.searchParams.get("strategyId");
  if (!strategyId) return new Response("missing strategyId", { status: 400 });

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      const send = (e: unknown) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(e)}\n\n`));

      const unsub = subscribe(strategyId, send);

      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(`: ping\n\n`));
      }, 15_000);

      const close = () => {
        clearInterval(heartbeat);
        unsub();
        try {
          controller.close();
        } catch {}
      };

      req.signal.addEventListener("abort", close);
    }
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive"
    }
  });
}
