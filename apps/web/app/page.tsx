import Link from "next/link";
import { SEED_STRATEGIES } from "@/lib/strategies/seed";
import { StrategyCard } from "@/components/strategy-card";

export default function Home() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <header className="mb-10">
        <div className="text-xs uppercase tracking-widest text-accent">
          AgentFund
        </div>
        <h1 className="mt-2 text-4xl font-semibold">Strategy iNFT Marketplace</h1>
        <p className="mt-3 max-w-2xl text-muted">
          Each strategy is an iNFT on 0G with persistent agent memory and a creator who earns royalties on every fee distribution. Deposit into any strategy. Agents reason on 0G Compute, trade via Uniswap, and execute through KeeperHub.
        </p>
        <div className="mt-6 flex gap-3 text-xs">
          <Pill label="0G — sealed inference + iNFT memory" />
          <Pill label="Uniswap — multi-agent swap routing" />
          <Pill label="KeeperHub — guaranteed execution + x402" />
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {SEED_STRATEGIES.map((s) => (
          <Link key={s.id} href={`/strategy/${s.id}`}>
            <StrategyCard strategy={s} />
          </Link>
        ))}
      </section>
    </main>
  );
}

function Pill({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-border bg-surface px-3 py-1 text-muted">
      {label}
    </span>
  );
}
