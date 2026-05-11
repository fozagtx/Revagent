import Link from "next/link";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";

async function getIntegrationHealth() {
  try {
    const r = await fetch(`${process.env.API_BASE_URL ?? "http://localhost:4000"}/api/health/integrations`, {
      cache: "no-store",
    });
    if (!r.ok) return null;
    return r.json() as Promise<Record<string, string>>;
  } catch { return null; }
}

export default async function Home() {
  const health = await getIntegrationHealth();

  return (
    <div className="space-y-10">
      <section>
        <h1 className="text-4xl font-bold tracking-tight">
          Sales intelligence <span className="text-brand-accent">for founders</span>.
        </h1>
        <p className="mt-3 text-slate-400 max-w-2xl">
          Three coordinated AI agents that fix the three most-broken parts of an early-stage founder's
          customer-facing motion: pitch decks, live discovery calls, and post-deal pattern extraction.
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <AgentCard
          title="Pitch Surgeon"
          desc="Drop a deck → 3-persona Gemini council scores Frame, Offer, Desire. Get archetype rewrites and a 30-sec narrated pitch."
          href="/pitch"
          color="from-cyan-500/20 to-cyan-500/0"
        />
        <AgentCard
          title="Discovery Co-Pilot"
          desc="Live JTBD switch chart populates while you talk. Speechmatics diarization + nudges when you miss a quadrant."
          href="/call"
          color="from-amber-500/20 to-amber-500/0"
        />
        <AgentCard
          title="Win-Loss Auditor"
          desc="Async 4-stage Featherless pipeline extracts objections, JTBD patterns, classification, and verbatim buyer language."
          href="/audit"
          color="from-emerald-500/20 to-emerald-500/0"
        />
      </section>

      <section>
        <h3 className="text-sm uppercase tracking-wide text-slate-500 mb-3">Sponsor integrations</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <HealthPill label="Gemini" status={health?.gemini} />
          <HealthPill label="Speechmatics" status={health?.speechmatics} />
          <HealthPill label="Featherless" status={health?.featherless} />
          <HealthPill label="Vultr" status={health?.vultr_object_storage} />
        </div>
      </section>
    </div>
  );
}

function AgentCard(props: { title: string; desc: string; href: string; color: string }) {
  return (
    <Link href={props.href}>
      <Card className={`bg-gradient-to-br ${props.color} hover:border-brand-accent transition`}>
        <CardTitle>{props.title}</CardTitle>
        <CardDescription className="mt-2">{props.desc}</CardDescription>
        <p className="mt-4 text-xs text-brand-accent">Open →</p>
      </Card>
    </Link>
  );
}

function HealthPill({ label, status }: { label: string; status: string | undefined }) {
  const color = status === "ok" ? "bg-brand-ok/20 text-brand-ok"
    : status === "fail" ? "bg-brand-danger/20 text-brand-danger"
    : "bg-slate-700/40 text-slate-400";
  return (
    <div className={`rounded-md px-3 py-2 ${color} flex items-center justify-between font-mono`}>
      <span>{label}</span>
      <span className="text-xs">{status ?? "—"}</span>
    </div>
  );
}
