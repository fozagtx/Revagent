import Link from "next/link";
import { Presentation, Mic, FileSearch, ArrowRight } from "lucide-react";
import { Card, CardEyebrow } from "@/components/ui/card";

export default function Home() {
  return (
    <>
      {/* Hero — full-bleed band */}
      <section className="hero-band">
        <div className="container-page pt-28 pb-12 sm:pt-32 sm:pb-16 md:pt-36 md:pb-24 rise-in">
          <p className="font-serif text-sm italic text-blue-700 mb-3">
            The Founder Economy
          </p>
          <h1 className="font-serif text-[34px] sm:text-[44px] md:text-6xl leading-[1.05] text-navy tracking-tight max-w-3xl break-words">
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
        </div>
      </section>

      <div className="container-page py-12 md:py-16 space-y-16 md:space-y-20">
        {/* Three agents */}
        <section>
          <div className="mb-6 rise-in stagger-1">
            <h2 className="font-serif text-2xl text-navy md:text-3xl">
              Three agents
            </h2>
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

        {/* Powered by */}
        <section className="rise-in stagger-4">
          <h3 className="mb-4 font-mono text-[11px] uppercase tracking-wider text-neutral-500">
            Powered by
          </h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <BrandChip label="Gemini" logo={<GeminiMark />} />
            <BrandChip label="Speechmatics" logo={<SpeechmaticsMark />} />
            <BrandChip label="Featherless" logo={<FeatherlessMark />} />
            <BrandChip label="Vultr" logo={<VultrMark />} />
          </div>
        </section>
      </div>
    </>
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

function BrandChip({ label, logo }: { label: string; logo: React.ReactNode }) {
  return (
    <div className="frosted flex items-center gap-3 rounded-2xl px-4 py-3">
      <span
        aria-hidden="true"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white border border-[rgba(189,215,255,0.6)]"
      >
        {logo}
      </span>
      <span className="font-semibold tracking-ui text-navy truncate">{label}</span>
    </div>
  );
}

function GeminiMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <defs>
        <linearGradient id="gemini-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1C7CFF" />
          <stop offset="50%" stopColor="#7E57FF" />
          <stop offset="100%" stopColor="#E94BA8" />
        </linearGradient>
      </defs>
      <path
        fill="url(#gemini-g)"
        d="M12 0c.18 5.51 2.06 9.45 5.64 11.84.59.4.59 1.27 0 1.66C14.06 15.89 12.18 19.83 12 24c-.18-4.17-2.06-8.11-5.64-10.5a.998.998 0 010-1.66C9.94 9.45 11.82 5.51 12 0z"
      />
    </svg>
  );
}

function SpeechmaticsMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <g fill="#FF4A1C">
        <rect x="3" y="10" width="2" height="4" rx="1" />
        <rect x="7" y="7" width="2" height="10" rx="1" />
        <rect x="11" y="4" width="2" height="16" rx="1" />
        <rect x="15" y="7" width="2" height="10" rx="1" />
        <rect x="19" y="10" width="2" height="4" rx="1" />
      </g>
    </svg>
  );
}

function FeatherlessMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="#0F172A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z" />
      <line x1="16" y1="8" x2="2" y2="22" />
      <line x1="17.5" y1="15" x2="9" y2="15" />
    </svg>
  );
}

function VultrMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        fill="#007BFC"
        d="M2.5 5h5L12 13.2 16.5 5h5L13 21h-2L2.5 5z"
      />
    </svg>
  );
}
