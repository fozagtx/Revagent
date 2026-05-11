import Link from "next/link";
import { Card } from "@/components/ui/card";

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
    <div className="space-y-12">
      {/* Hero */}
      <section className="relative">
        <p className="font-serif text-sm text-blue-700 mb-3">The Founder Economy</p>
        <h1 className="font-serif text-5xl md:text-6xl leading-[1.05] text-navy tracking-tight">
          Sales intelligence,<br />floating in the cloud.
        </h1>
        <p className="mt-5 text-base text-neutral-700 max-w-2xl leading-relaxed">
          Three coordinated AI agents that fix the three most-broken parts of an early-stage founder's
          customer-facing motion: pitch decks, live discovery calls, and post-deal pattern extraction.
        </p>
        <div className="mt-7 flex gap-3">
          <Link
            href="/pitch"
            className="btn-cta rounded-2xl h-11 px-6 inline-flex items-center font-semibold text-sm tracking-ui transition"
          >
            Try a deck
          </Link>
          <Link
            href="/call"
            className="rounded-2xl h-11 px-6 inline-flex items-center font-semibold text-sm tracking-ui text-blue-700 bg-white border border-[rgba(0,37,97,0.06)] hover:bg-blue-100/40 transition"
          >
            Start a call
          </Link>
        </div>
      </section>

      {/* Three agents */}
      <section>
        <div className="flex items-baseline justify-between mb-5">
          <h2 className="font-serif text-3xl text-navy">Three agents</h2>
          <p className="text-sm tracking-ui text-neutral-600">One codebase · four sponsor stacks · MIT</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <AgentCard
            name="Pitch Surgeon"
            sponsor="Gemini"
            desc="Drop a deck. A 3-persona council scores Frame, Offer, Desire — and rewrites the weakest slide in three archetypes."
            href="/pitch"
            stat="$ 0.04 / deck"
          />
          <AgentCard
            name="Discovery Co-Pilot"
            sponsor="Speechmatics"
            desc="Live JTBD switch chart populates while you talk. Push · Pull · Anxiety · Habit — plus mid-call nudges."
            href="/call"
            stat="< 2s latency"
          />
          <AgentCard
            name="Win-Loss Auditor"
            sponsor="Featherless"
            desc="Async 4-stage pipeline: objections, JTBD patterns, classification, verbatim buyer language. Emailed as PDF."
            href="/audit"
            stat="~ 90s / deal"
          />
        </div>
      </section>

      {/* Integrations health */}
      <section>
        <h3 className="text-xs uppercase tracking-wider text-neutral-500 mb-3">Sponsor integrations</h3>
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

function AgentCard({
  name, sponsor, desc, href, stat,
}: { name: string; sponsor: string; desc: string; href: string; stat: string }) {
  return (
    <Link href={href} className="group block">
      <Card className="h-full transition duration-charms ease-charms group-hover:-translate-y-0.5">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-wider text-blue-700">{sponsor}</p>
            <h3 className="mt-1 text-xl font-semibold tracking-ui text-navy">{name}</h3>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-mono text-neutral-600">
            <span className="w-1.5 h-1.5 rounded-full bg-success" />
            {stat}
          </span>
        </div>
        <p className="mt-3 text-sm text-neutral-700 leading-relaxed">{desc}</p>
        <p className="mt-4 text-xs font-semibold tracking-ui text-blue-700 group-hover:text-blue-900">Open →</p>
      </Card>
    </Link>
  );
}

function HealthPill({ label, status }: { label: string; status: string | undefined }) {
  const dot = status === "ok" ? "bg-success" : status === "fail" ? "bg-error" : "bg-neutral-400";
  return (
    <div className="frosted rounded-2xl px-4 py-3 flex items-center justify-between">
      <span className="font-semibold tracking-ui text-navy">{label}</span>
      <span className="flex items-center gap-2 text-xs font-mono text-neutral-600">
        <span className={`w-2 h-2 rounded-full ${dot}`} />
        {status ?? "—"}
      </span>
    </div>
  );
}
