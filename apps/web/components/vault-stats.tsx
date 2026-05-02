import type { Strategy } from "@/lib/strategies/seed";
import { formatUsd } from "@/lib/utils";

export function VaultStats({ strategy }: { strategy: Strategy }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="grid grid-cols-4 gap-4">
        <Stat label="AUM" value={formatUsd(strategy.aumUsd)} />
        <Stat label="APY (7d)" value={`${strategy.apy7d.toFixed(1)}%`} accent />
        <Stat label="Pair" value={`${strategy.pair.base}/${strategy.pair.quote}`} />
        <Stat label="Creator royalty" value={`${strategy.royaltyBps / 100}%`} />
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-muted">
        {label}
      </div>
      <div className={accent ? "mt-1 text-lg text-accent" : "mt-1 text-lg"}>
        {value}
      </div>
    </div>
  );
}
