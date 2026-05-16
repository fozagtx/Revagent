import Link from "next/link";
import {
  Presentation,
  Mic,
  FileSearch,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Sparkles,
  Zap,
  Lock,
} from "lucide-react";
import { Card, CardEyebrow } from "@/components/ui/card";

export default function Home() {
  return (
    <>
      {/* HERO */}
      <section className="hero-band">
        <div className="container-page pt-28 pb-12 sm:pt-32 sm:pb-16 md:pt-36 md:pb-20 rise-in">
          <div className="grid gap-10 md:grid-cols-[1.2fr,1fr] md:items-center">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-700/20 bg-white/70 px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-blue-700 backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-success" /> Live · 3 AI agents
              </span>
              <h1 className="mt-4 font-serif text-[36px] sm:text-[48px] md:text-[60px] leading-[1.02] text-navy tracking-tight max-w-3xl break-words">
                Win more deals.
                <span className="block text-blue-700">Stop guessing why you lost.</span>
              </h1>
              <p className="mt-5 max-w-xl text-[16px] md:text-[17px] leading-relaxed text-neutral-700">
                RevAgent is three AI agents that fix the parts of selling that
                kill early-stage founders: weak pitch decks, rambling discovery
                calls, and lost deals you never debrief. Drop in a deck or a
                transcript — get back specifics you can ship today.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link
                  href="/login?next=/pitch"
                  className="btn-cta inline-flex h-12 items-center gap-2 rounded-2xl px-6 text-[15px] font-semibold tracking-ui transition duration-charms ease-charms"
                >
                  Start free — no card
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link
                  href="#how-it-works"
                  className="inline-flex h-12 items-center rounded-2xl border border-[rgba(0,37,97,0.08)] bg-white px-6 text-[15px] font-semibold tracking-ui text-blue-700 transition duration-charms ease-charms hover:bg-blue-100/40"
                >
                  See how it works
                </Link>
              </div>
            </div>

            {/* Hero portrait — founder who closed a deal, with overlay testimonial */}
            <div className="relative mx-auto w-full max-w-md md:max-w-none">
              <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-blue-100 shadow-2xl ring-1 ring-[rgba(189,215,255,0.6)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=900&q=80&crop=faces"
                  alt="Founder who closed a deal after using RevAgent"
                  className="absolute inset-0 h-full w-full object-cover"
                  loading="eager"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy via-navy/85 to-transparent p-5 sm:p-6">
                  <p className="font-serif text-lg sm:text-xl text-white leading-snug">
                    &ldquo;Closed our biggest deal of the year — three weeks after a pitch rewrite.&rdquo;
                  </p>
                  <p className="mt-2 font-mono text-[11px] uppercase tracking-wider text-white/80">
                    Maya, founder · seed-stage SaaS
                  </p>
                </div>
              </div>
              <div className="absolute -bottom-3 -left-3 hidden md:flex items-center gap-2 rounded-2xl border border-[rgba(0,37,97,0.08)] bg-white px-3 py-2 shadow-lg">
                <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
                <span className="font-mono text-[11px] uppercase tracking-wider text-navy">
                  +$420k ARR
                </span>
              </div>
            </div>
          </div>

          <ul className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-neutral-600">
            <li className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-success" aria-hidden="true" /> 60-second analysis
            </li>
            <li className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-success" aria-hidden="true" /> No CRM setup
            </li>
            <li className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-success" aria-hidden="true" /> Open-source · MIT
            </li>
          </ul>
        </div>
      </section>

      <div className="container-page py-14 md:py-20 space-y-20 md:space-y-28">
        {/* TRUST BAR */}
        <section className="rise-in">
          <p className="text-center font-mono text-[11px] uppercase tracking-wider text-neutral-500">
            Built on the same stack as the agents winning AI Olympics 2026
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
            <BrandChip label="Gemini" logo={<GeminiMark />} />
            <BrandChip label="Speechmatics" logo={<SpeechmaticsMark />} />
            <BrandChip label="Featherless" logo={<FeatherlessMark />} />
            <BrandChip label="Vultr" logo={<VultrMark />} />
          </div>
        </section>

        {/* PROBLEM */}
        <section className="rise-in stagger-1">
          <div className="mb-8 md:mb-10 max-w-2xl">
            <p className="font-mono text-[11px] uppercase tracking-wider text-blue-700">
              The problem
            </p>
            <h2 className="mt-2 font-serif text-3xl md:text-4xl text-navy leading-tight">
              You&apos;re leaking deals at three obvious points.
            </h2>
            <p className="mt-3 text-[15px] text-neutral-700 leading-relaxed">
              Founders lose six-figure deals not because the product is wrong —
              but because nobody told them their deck buries the offer, their
              discovery calls miss the buyer&apos;s real job, and their losses
              never get debriefed. Three preventable failures, one fix.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <PainPoint
              icon={<Presentation />}
              title="Your deck buries the offer"
              body="A 3-persona review (Klaff, Hormozi, Schwartz) scores Frame, Offer, Desire and rewrites the weakest slide in 3 archetypes — with a 30-second narrated pitch."
            />
            <PainPoint
              icon={<Mic />}
              title="Your discovery calls drift"
              body="A live JTBD switch chart populates while you talk — Push · Pull · Anxiety · Habit — and nudges you mid-call when a quadrant stays empty."
            />
            <PainPoint
              icon={<FileSearch />}
              title="Your losses go un-debriefed"
              body="Drop a transcript + win/loss tag. Four async pipelines extract objections, JTBD patterns, classification, and verbatim buyer language as a PDF digest."
            />
          </div>
        </section>

        {/* SOLUTION / HOW IT WORKS */}
        <section id="how-it-works" className="rise-in stagger-2 scroll-mt-24">
          <div className="mb-8 md:mb-10 max-w-2xl">
            <p className="font-mono text-[11px] uppercase tracking-wider text-blue-700">
              The fix · 3 agents
            </p>
            <h2 className="mt-2 font-serif text-3xl md:text-4xl text-navy leading-tight">
              Drop in a file. Get specifics. Ship today.
            </h2>
            <p className="mt-3 text-[15px] text-neutral-700 leading-relaxed">
              Each agent does one thing well. No CRM hookup, no onboarding
              call — sign in with your name, upload, get an answer in under 90
              seconds.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <AgentCard
              icon={<Presentation />}
              name="Pitch Surgeon"
              sponsor="Gemini · multimodal"
              desc="Drop a .pptx or .pdf. 3-persona council scores Frame, Offer, Desire — then rewrites the weakest slide in 3 archetypes with a 30-second narrated pitch."
              href="/login?next=/pitch"
              stat="$0.04 / deck"
              delay="stagger-1"
            />
            <AgentCard
              icon={<Mic />}
              name="Discovery Co-Pilot"
              sponsor="Speechmatics · real-time"
              desc="Live JTBD switch chart populates while you talk. Push · Pull · Anxiety · Habit — plus mid-call nudges if a quadrant stays empty."
              href="/login?next=/call"
              stat="< 2s latency"
              delay="stagger-2"
            />
            <AgentCard
              icon={<FileSearch />}
              name="Win-Loss Auditor"
              sponsor="Featherless · async"
              desc="4-stage async pipeline: objections, JTBD patterns, classification, verbatim buyer language. Emailed as a PDF digest when complete."
              href="/login?next=/audit"
              stat="~ 90s / deal"
              delay="stagger-3"
            />
          </div>
        </section>

        {/* DIFFERENTIATORS */}
        <section className="rise-in stagger-3">
          <div className="mb-8 max-w-2xl">
            <p className="font-mono text-[11px] uppercase tracking-wider text-blue-700">
              Why not just a prompt
            </p>
            <h2 className="mt-2 font-serif text-3xl md:text-4xl text-navy leading-tight">
              ChatGPT won&apos;t do this.
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Differentiator
              icon={<Zap />}
              title="Built around your workflow"
              body="Three purpose-built pipelines, not a chatbot. Each agent has a real domain model — slide critique schema, JTBD quadrants, win-loss evidence chains."
            />
            <Differentiator
              icon={<Sparkles />}
              title="Structured outputs, not prose"
              body="Numeric scores, ranked rewrites, verbatim quotes with timestamps. Drop the results into Notion, your CRM, or a Slack message — no copy-edit required."
            />
            <Differentiator
              icon={<Lock />}
              title="Your data, your bucket"
              body="Decks, transcripts, and digests live in your Vultr Object Storage. We don&apos;t train on your inputs. MIT-licensed code — fork it, self-host it."
            />
          </div>
        </section>

        {/* FAQ */}
        <section className="rise-in stagger-4">
          <div className="mb-8 max-w-2xl">
            <p className="font-mono text-[11px] uppercase tracking-wider text-blue-700">
              FAQ
            </p>
            <h2 className="mt-2 font-serif text-3xl md:text-4xl text-navy leading-tight">
              Quick answers.
            </h2>
          </div>
          <ul className="divide-y divide-[rgba(189,215,255,0.5)] border-y border-[rgba(189,215,255,0.5)]">
            <Faq
              q="What does it cost?"
              a="Free during beta — no card on file. Backed by free-tier Gemini and Featherless quotas plus a small Vultr VM. We&apos;ll switch to paid plans once we hit real usage."
            />
            <Faq
              q="Do I need to integrate my CRM?"
              a="No. Drop in a deck or paste a call transcript. No HubSpot, no Salesforce, no Zapier glue. The auditor accepts a deal_id you choose (free-form text — match to your CRM later if you want)."
            />
            <Faq
              q="Where does my data go?"
              a="Decks, transcripts, and PDFs are stored in Vultr Object Storage (S3-compatible). Structured analysis lives in Postgres. We don&apos;t train on your inputs. The full source is MIT-licensed at github.com/fozagtx/Revagent."
            />
            <Faq
              q="Is the call audio recorded?"
              a="Audio streams to Speechmatics over a secure WebSocket for live diarized transcription. The transcript is persisted with the call; the raw audio is not retained after the call ends."
            />
            <Faq
              q="How fast is the analysis?"
              a="Pitch decks: under 90 seconds end-to-end for a 10–15 slide deck. Discovery call switch-chart: under 2-second latency mid-call. Win-loss audit: ~90 seconds per deal."
            />
            <Faq
              q="What if Gemini fails?"
              a="Each pipeline reports the exact failure cause (quota, parse error, missing libreoffice on host). You're never stuck guessing — the UI prints the real error."
            />
          </ul>
        </section>

        {/* FINAL CTA */}
        <section className="rise-in stagger-5">
          <div className="frosted rounded-hero p-8 md:p-12 text-center">
            <p className="font-mono text-[11px] uppercase tracking-wider text-blue-700">
              Stop guessing
            </p>
            <h2 className="mt-2 font-serif text-3xl md:text-5xl text-navy leading-tight max-w-2xl mx-auto">
              See your deck through your buyer&apos;s eyes — in 60 seconds.
            </h2>
            <p className="mt-3 text-[15px] text-neutral-700 max-w-xl mx-auto">
              Type your name. Drop a deck. Get the scores, the rewrite, and the
              narration. Free during beta.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/login?next=/pitch"
                className="btn-cta inline-flex h-12 items-center gap-2 rounded-2xl px-7 text-[15px] font-semibold tracking-ui transition duration-charms ease-charms"
              >
                Start free
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="https://github.com/fozagtx/Revagent"
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-12 items-center rounded-2xl border border-[rgba(0,37,97,0.08)] bg-white px-6 text-[15px] font-semibold tracking-ui text-blue-700 transition duration-charms ease-charms hover:bg-blue-100/40"
              >
                Star on GitHub
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

function PainPoint({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <Card variant="white" className="h-full lift">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-600 [&_svg]:h-4 [&_svg]:w-4">
        <XCircle />
      </div>
      <p className="mt-3 inline-flex items-center gap-2 text-[11px] font-mono tracking-wider uppercase text-red-600">
        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
        Today
      </p>
      <h3 className="mt-1 text-lg font-semibold tracking-ui text-navy">
        {title}
      </h3>
      <p className="mt-2 text-[14px] leading-relaxed text-neutral-700">
        {body}
      </p>
      <div className="mt-4 flex items-center gap-2 text-[12px] font-semibold text-blue-700">
        <CheckCircle2 className="h-4 w-4 text-success" aria-hidden="true" />
        <span className="inline-flex items-center gap-1.5">
          With RevAgent
          {icon ? (
            <span className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-md bg-blue-100 text-blue-700 [&_svg]:h-3 [&_svg]:w-3">
              {icon}
            </span>
          ) : null}
        </span>
      </div>
    </Card>
  );
}

function Differentiator({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <Card className="h-full lift">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-700 [&_svg]:h-4 [&_svg]:w-4">
        {icon}
      </div>
      <h3 className="mt-3 text-lg font-semibold tracking-ui text-navy">
        {title}
      </h3>
      <p className="mt-2 text-[14px] leading-relaxed text-neutral-700">
        {body}
      </p>
    </Card>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <li>
      <details className="group">
        <summary className="flex cursor-pointer list-none items-start gap-4 py-5 outline-none">
          <span className="flex-1 text-[15px] font-semibold tracking-ui text-navy">
            {q}
          </span>
          <span
            aria-hidden="true"
            className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[rgba(189,215,255,0.6)] bg-white text-blue-700 transition-transform duration-charms ease-charms group-open:rotate-180"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path
                d="m6 9 6 6 6-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </summary>
        <p className="pb-5 pr-12 text-[14px] leading-relaxed text-neutral-700">
          {a}
        </p>
      </details>
    </li>
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
      <span className="font-semibold tracking-ui text-navy truncate">
        {label}
      </span>
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
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="#0F172A"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z" />
      <line x1="16" y1="8" x2="2" y2="22" />
      <line x1="17.5" y1="15" x2="9" y2="15" />
    </svg>
  );
}

function VultrMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path fill="#007BFC" d="M2.5 5h5L12 13.2 16.5 5h5L13 21h-2L2.5 5z" />
    </svg>
  );
}
