import type { Strategy } from "@/lib/strategies/seed";
import { formatUsd, shortAddr } from "@/lib/utils";

export function StrategyCard({ strategy }: { strategy: Strategy }) {
  return (
    <div className="group rounded-xl border border-border bg-surface p-5 transition hover:border-accent">
      <div className="flex items-start justify-between">
        <div className="text-xs uppercase tracking-widest text-muted">
          iNFT #{strategy.inftTokenId}
        </div>
        <div className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted">
          {strategy.pair.base}/{strategy.pair.quote}
        </div>
      </div>
      <h3 className="mt-3 text-lg font-semibold group-hover:text-accent">
        {strategy.name}
      </h3>
      <p className="mt-2 line-clamp-2 text-sm text-muted">
        {strategy.description}
      </p>
      <div className="mt-5 grid grid-cols-3 gap-3 text-xs">
        <Stat label="AUM" value={formatUsd(strategy.aumUsd)} />
        <Stat label="APY 7d" value={`${strategy.apy7d.toFixed(1)}%`} accent />
        <Stat label="Royalty" value={`${strategy.royaltyBps / 100}%`} />
      </div>
      <div className="mt-4 text-[10px] text-muted">
        creator {shortAddr(strategy.creator)}
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
      <div className={accent ? "mt-1 text-accent" : "mt-1"}>{value}</div>
    </div>
  );
}
