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

export function AgentConsole({ strategyId }: { strategyId: string }) {
  const [events, setEvents] = useState<Event[]>([]);

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

  return (
    <div className="rounded-xl border border-border bg-surface">
      <div className="border-b border-border px-5 py-3 text-xs uppercase tracking-widest text-muted">
        Agent Console — sealed inference on 0G Compute
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
                    {e.hash && (
                      <div className="mt-1 text-[10px] text-accent2">
                        tx {e.hash.slice(0, 10)}…
                      </div>
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
