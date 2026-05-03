"use client";

import { useEffect, useState } from "react";

type Lane = "analyst" | "risk" | "executor";

type Event = {
  ts: number;
  lane: Lane;
  text: string;
  hash?: string;
  inferenceReceipt?: string;
};

const LANES: { id: Lane; label: string; color: string }[] = [
  { id: "analyst", label: "Analyst", color: "text-accent" },
  { id: "risk", label: "Risk Manager", color: "text-yellow-300" },
  { id: "executor", label: "Executor", color: "text-accent2" }
];

const EXPLORER =
  process.env.NEXT_PUBLIC_OG_EXPLORER_URL ?? "https://chainscan-galileo.0g.ai";

export function AgentConsole({ strategyId }: { strategyId: string }) {
  const [events, setEvents] = useState<Event[]>([]);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    const es = new EventSource(`/api/agent/stream?strategyId=${strategyId}`);
    es.onmessage = (m) => {
      try {
        const e = JSON.parse(m.data) as Event;
        setEvents((prev) => [...prev.slice(-100), e]);
      } catch {}
    };
    return () => es.close();
  }, [strategyId]);

  async function runAgent() {
    setRunning(true);
    try {
      await fetch("/api/agent/tick", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ strategyId })
      });
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <div className="text-xs uppercase tracking-widest text-muted">
          Agent Console — sealed inference on 0G Compute
        </div>
        <button
          onClick={runAgent}
          disabled={running}
          className="rounded-md bg-accent px-3 py-1 text-xs font-semibold text-bg transition hover:opacity-90 disabled:opacity-50"
        >
          {running ? "Running…" : "Run agent"}
        </button>
      </div>
      <div className="grid grid-cols-3 divide-x divide-border">
        {LANES.map((lane) => (
          <div key={lane.id} className="min-h-[280px] p-4">
            <div className={`text-xs font-semibold ${lane.color}`}>
              {lane.label}
            </div>
            <div className="mt-3 space-y-2 text-xs">
              {events
                .filter((e) => e.lane === lane.id)
                .slice(-12)
                .map((e, i) => (
                  <div
                    key={i}
                    className="rounded border border-border bg-bg p-2 leading-relaxed"
                  >
                    <div className="text-[10px] text-muted">
                      {new Date(e.ts).toLocaleTimeString()}
                    </div>
                    <div className="mt-1">{e.text}</div>
                    {e.inferenceReceipt && (
                      <div className="mt-1 text-[10px] text-accent">
                        receipt {e.inferenceReceipt.slice(0, 10)}…
                      </div>
                    )}
                    {e.hash && e.hash !== "0x0" && (
                      <a
                        href={`${EXPLORER}/tx/${e.hash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 block text-[10px] text-accent2 underline-offset-2 hover:underline"
                      >
                        tx {e.hash.slice(0, 10)}… ↗
                      </a>
                    )}
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
