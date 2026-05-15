import Link from "next/link";
import { Presentation, Mic, FileSearch, ArrowRight } from "lucide-react";
import { Card, CardEyebrow } from "@/components/ui/card";
import { StatusBadge, type StatusTone } from "@/components/ui/statusBadge";

async function getIntegrationHealth() {
  try {
    const r = await fetch(
      `${process.env.API_BASE_URL ?? "http://localhost:4000"}/api/health/integrations`,
      { cache: "no-store" },
    );
    if (!r.ok) return null;
    return r.json() as Promise<Record<string, string>>;
  } catch {
    return null;
  }
}

export default async function Home() {
  const health = await getIntegrationHealth();

  return (
    <div className="space-y-16 md:space-y-20">
      {/* Hero */}
      <section className="relative rise-in">
        <p className="font-serif text-sm italic text-blue-700 mb-3">
          The Founder Economy
        </p>
        <h1 className="font-serif text-[40px] md:text-6xl leading-[1.05] text-navy tracking-tight max-w-3xl">
          Sales intelligence,
          <span className="block text-blue-700">floating in the cloud.</span>
        </h1>
        <p className="mt-5 max-w-2xl text-[15px] md:text-base leading-relaxed text-neutral-700">
          Three coordinated AI agents that fix the three most-broken parts of an
          early-stage founder&apos;s customer-facing motion: pitch decks, live
          discovery calls, and post-deal pattern extraction.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            href="/pitch"
            className="btn-cta inline-flex h-12 items-center gap-2 rounded-2xl px-6 text-sm font-semibold tracking-ui transition duration-charms ease-charms"
          >
            Try a deck
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link
            href="/call"
            className="inline-flex h-12 items-center rounded-2xl border border-[rgba(0,37,97,0.08)] bg-white px-6 text-sm font-semibold tracking-ui text-blue-700 transition duration-charms ease-charms hover:bg-blue-100/40"
          >
            Start a call
          </Link>
        </div>
      </section>

      {/* Three agents */}
      <section>
        <div className="mb-6 flex items-baseline justify-between gap-4 rise-in stagger-1">
          <h2 className="font-serif text-2xl text-navy md:text-3xl">
            Three agents
          </h2>
          <p className="text-sm tracking-ui text-neutral-600 hidden sm:block">
            One codebase · four sponsor stacks · MIT
          </p>
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <AgentCard
            icon={<Presentation />}
            name="Pitch Surgeon"
            sponsor="Gemini · multimodal"
            desc="Drop a deck. A 3-persona council scores Frame, Offer, Desire — then rewrites the weakest slide in three archetypes."
            href="/pitch"
            stat="$0.04 / deck"
            delay="stagger-1"
          />
          <AgentCard
            icon={<Mic />}
            name="Discovery Co-Pilot"
            sponsor="Speechmatics · real-time"
            desc="Live JTBD switch chart populates while you talk. Push · Pull · Anxiety · Habit — plus mid-call nudges."
            href="/call"
            stat="< 2s latency"
            delay="stagger-2"
          />
          <AgentCard
            icon={<FileSearch />}
            name="Win-Loss Auditor"
            sponsor="Featherless · async"
            desc="Async 4-stage pipeline: objections, JTBD patterns, classification, verbatim buyer language. Emailed as PDF."
            href="/audit"
            stat="~ 90s / deal"
            delay="stagger-3"
          />
        </div>
      </section>

      {/* Integrations health */}
      <section className="rise-in stagger-4">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h3 className="font-mono text-[11px] uppercase tracking-wider text-neutral-500">
            Sponsor integrations
          </h3>
          {health === null && (
            <p className="text-xs text-neutral-500 tracking-ui">
              Health check unavailable
            </p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
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
  icon,
  name,
  sponsor,
  desc,
  href,
  stat,
  delay,
}: {
  icon: React.ReactNode;
  name: string;
  sponsor: string;
  desc: string;
  href: string;
  stat: string;
  delay: string;
}) {
  return (
    <Link
      href={href}
      className={`group block rounded-2xl rise-in ${delay} focus-visible:outline-none`}
    >
      <Card className="h-full lift">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-700 [&_svg]:h-4 [&_svg]:w-4 group-hover:bg-blue-150 transition-colors">
              {icon}
            </div>
            <CardEyebrow className="mt-3 truncate">{sponsor}</CardEyebrow>
            <h3 className="mt-1 text-xl font-semibold tracking-ui text-navy">
              {name}
            </h3>
          </div>
          <span className="inline-flex items-center gap-1.5 shrink-0 rounded-full bg-white/60 px-2 py-1 font-mono text-[11px] text-neutral-600">
            <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />
            {stat}
          </span>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-neutral-700">{desc}</p>
        <p className="mt-5 inline-flex items-center gap-1 text-xs font-semibold tracking-ui text-blue-700 group-hover:text-blue-900 transition-colors">
          Open
          <ArrowRight
            className="h-3.5 w-3.5 transition-transform duration-charms ease-charms group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </p>
      </Card>
    </Link>
  );
}

function HealthPill({
  label,
  status,
}: {
  label: string;
  status: string | undefined;
}) {
  const tone: StatusTone =
    status === "ok" ? "success" : status === "fail" ? "error" : "neutral";
  const labelText =
    status === "ok" ? "Healthy" : status === "fail" ? "Down" : "Unknown";
  return (
    <div className="frosted flex items-center justify-between rounded-2xl px-4 py-3">
      <span className="font-semibold tracking-ui text-navy">{label}</span>
      <StatusBadge tone={tone}>{labelText}</StatusBadge>
    </div>
  );
}
