"use client";

import { useState } from "react";
import type { Strategy } from "@/lib/strategies/seed";

export function DepositPanel({ strategy }: { strategy: Strategy }) {
  const [amount, setAmount] = useState("100");
  const [status, setStatus] = useState<"idle" | "submitting" | "done">("idle");

  async function onDeposit() {
    setStatus("submitting");
    await fetch("/api/agent/deposit", {
      method: "POST",
      body: JSON.stringify({ strategyId: strategy.id, amount })
    });
    setStatus("done");
  }

  return (
    <aside className="rounded-xl border border-border bg-surface p-5">
      <div className="text-xs uppercase tracking-widest text-muted">Deposit</div>
      <div className="mt-3 flex items-baseline gap-2">
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          inputMode="decimal"
          className="w-full bg-transparent text-3xl font-semibold outline-none"
        />
        <span className="text-muted">{strategy.pair.base}</span>
      </div>
      <button
        onClick={onDeposit}
        disabled={status === "submitting"}
        className="mt-4 w-full rounded-lg bg-accent py-2 text-sm font-semibold text-bg transition hover:opacity-90 disabled:opacity-50"
      >
        {status === "submitting"
          ? "Depositing…"
          : status === "done"
            ? "Deposited ✓"
            : `Deposit ${amount} ${strategy.pair.base}`}
      </button>
      <p className="mt-3 text-[10px] leading-relaxed text-muted">
        Agent reasoning is sealed on 0G Compute. Onchain settlement routes through
        KeeperHub. Creator receives {strategy.royaltyBps / 100}% of fees on every
        distribution.
      </p>
    </aside>
  );
}
