import { notFound } from "next/navigation";
import Link from "next/link";
import { SEED_STRATEGIES } from "@/lib/strategies/seed";
import { AgentConsole } from "@/components/agent-console";
import { DepositPanel } from "@/components/deposit-panel";
import { VaultStats } from "@/components/vault-stats";

export default async function StrategyPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const strategy = SEED_STRATEGIES.find((s) => s.id === id);
  if (!strategy) notFound();

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <Link
        href="/"
        className="text-xs uppercase tracking-widest text-muted hover:text-accent"
      >
        ← marketplace
      </Link>

      <header className="mt-4 flex items-baseline justify-between">
        <div>
          <h1 className="text-3xl font-semibold">{strategy.name}</h1>
          <p className="mt-1 text-muted">{strategy.description}</p>
        </div>
        <div className="text-right text-xs text-muted">
          <div>Creator</div>
          <div className="font-mono text-accent">
            {strategy.creator.slice(0, 6)}…{strategy.creator.slice(-4)}
          </div>
          <div className="mt-2">Royalty {strategy.royaltyBps / 100}%</div>
        </div>
      </header>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <VaultStats strategy={strategy} />
          <AgentConsole strategyId={strategy.id} />
        </div>
        <DepositPanel strategy={strategy} />
      </div>
    </main>
  );
}
