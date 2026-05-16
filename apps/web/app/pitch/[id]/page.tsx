"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeft, Star } from "lucide-react";
import { Card, CardTitle, CardDescription, CardEyebrow } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/pageHeader";
import { StatusBadge } from "@/components/ui/statusBadge";
import { Skeleton, SkeletonText } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/emptyState";
import { authedFetch } from "@/lib/utils";
import type { ArchetypeRewrite, SlideCritique } from "@revagent/shared";

type Archetype = "frame_control" | "grand_slam" | "desire_amp";

interface PitchRow {
  id: string;
  status: string;
  frame_score: number | null;
  offer_score: number | null;
  desire_score: number | null;
  weakest_slide_idx: number | null;
  slide_critiques: SlideCritique[];
  rewrites: Record<Archetype, ArchetypeRewrite[]> | null;
  strongest_archetype: Archetype | null;
  narration_audio_url: string | null;
  gemini_request_id: string | null;
  deck_filename: string;
  num_slides: number | null;
}

const ARCHETYPE_LABEL: Record<Archetype, string> = {
  frame_control: "Frame Control",
  grand_slam: "Grand Slam Offer",
  desire_amp: "Desire Amp",
};

export default function PitchAnalysisPage() {
  const params = useParams<{ id: string }>();
  const [row, setRow] = useState<PitchRow | null>(null);
  const [tab, setTab] = useState<Archetype>("frame_control");

  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setInterval> | null = null;

    const fetchIt = async () => {
      try {
        const r = await authedFetch(`/api/pitch/${params.id}`);
        if (r.ok && alive) {
          const j = (await r.json()) as PitchRow;
          setRow(j);
          if (j.strongest_archetype) setTab(j.strongest_archetype);
          // Stop polling on terminal states
          if (
            (j.status === "complete" || j.status === "failed") &&
            timer !== null
          ) {
            clearInterval(timer);
            timer = null;
          }
        }
      } catch {
        /* retry on next tick */
      }
    };

    void fetchIt();
    timer = setInterval(fetchIt, 3000);
    return () => {
      alive = false;
      if (timer) clearInterval(timer);
    };
  }, [params.id]);

  if (!row) return <LoadingState />;

  const rewrites = row.rewrites?.[tab] ?? [];
  const isProcessing = row.status !== "complete" && row.status !== "failed";

  return (
    <div className="container-page pt-10 pb-8 md:pt-14 md:pb-12 space-y-8">
      <Link
        href="/pitch"
        className="inline-flex items-center gap-1 text-xs font-semibold tracking-ui text-neutral-600 hover:text-navy transition"
      >
        <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
        All decks
      </Link>

      <PageHeader
        eyebrow={
          <span className="inline-flex items-center gap-2">
            {row.num_slides ?? "?"} slides
            <span className="text-neutral-400">·</span>
            {isProcessing ? (
              <StatusBadge tone="pending" pulse>
                {row.status}
              </StatusBadge>
            ) : row.status === "failed" ? (
              <StatusBadge tone="error">failed</StatusBadge>
            ) : (
              <StatusBadge tone="success">complete</StatusBadge>
            )}
          </span>
        }
        title={row.deck_filename}
      />

      <section
        className="grid grid-cols-1 gap-4 sm:grid-cols-3 rise-in stagger-1"
        aria-label="Scores"
      >
        <ScoreCard
          label="Frame"
          persona="Oren Klaff"
          initials="OK"
          tint="from-blue-600 to-blue-800"
          score={row.frame_score}
        />
        <ScoreCard
          label="Offer"
          persona="Alex Hormozi"
          initials="AH"
          tint="from-amber-500 to-amber-700"
          score={row.offer_score}
        />
        <ScoreCard
          label="Desire"
          persona="Eugene Schwartz"
          initials="ES"
          tint="from-emerald-500 to-emerald-700"
          score={row.desire_score}
        />
      </section>

      {row.weakest_slide_idx != null && (
        <Card
          variant="white"
          className="rise-in stagger-2 border-l-4 border-l-blue-700"
        >
          <CardEyebrow>Weakest slide</CardEyebrow>
          <CardTitle className="mt-1">Slide #{row.weakest_slide_idx + 1}</CardTitle>
          <CardDescription className="mt-2 text-neutral-700">
            {row.slide_critiques?.[row.weakest_slide_idx]?.notes ??
              "Critique not yet available."}
          </CardDescription>
        </Card>
      )}

      <section className="rise-in stagger-3" aria-label="Slide rewrites">
        <div
          role="tablist"
          aria-label="Rewrite archetype"
          className="mb-4 flex flex-wrap gap-2"
        >
          {(["frame_control", "grand_slam", "desire_amp"] as Archetype[]).map(
            (a) => {
              const active = tab === a;
              const strongest = row.strongest_archetype === a;
              return (
                <button
                  key={a}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(a)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold tracking-ui transition duration-charms ease-charms ${
                    active
                      ? "bg-blue-150 text-navy border border-blue-200"
                      : "bg-white text-neutral-700 border border-[rgba(0,37,97,0.08)] hover:bg-blue-100/50 hover:text-navy"
                  }`}
                >
                  {ARCHETYPE_LABEL[a]}
                  {strongest && (
                    <Star
                      className="h-3.5 w-3.5 fill-blue-700 text-blue-700"
                      aria-label="strongest"
                    />
                  )}
                </button>
              );
            },
          )}
        </div>

        <div className="space-y-3">
          {rewrites.length === 0 && isProcessing && (
            <Card className="fade-in">
              <SkeletonText lines={3} />
            </Card>
          )}
          {rewrites.length === 0 && !isProcessing && (
            <EmptyState
              title="No rewrites for this archetype"
              description="Switch to another archetype to see suggested rewrites."
            />
          )}
          {rewrites.map((r, i) => (
            <Card key={i} className="rise-in" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="flex items-center justify-between gap-3">
                <CardTitle as="h3">Slide {r.slide_idx + 1}</CardTitle>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-neutral-500">
                    Original
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-neutral-700">
                    {r.original_text}
                  </p>
                </div>
                <div className="border-l border-[rgba(189,215,255,0.5)] pl-4 sm:border-l">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-blue-700">
                    Rewritten
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-navy font-medium">
                    {r.rewritten_text}
                  </p>
                </div>
              </div>
              {r.rationale && (
                <p className="mt-4 border-t border-[rgba(189,215,255,0.4)] pt-3 text-xs italic text-neutral-600 leading-relaxed">
                  {r.rationale}
                </p>
              )}
            </Card>
          ))}
        </div>
      </section>

      {row.narration_audio_url && (
        <Card className="rise-in">
          <CardTitle as="h3">30-second narrated pitch</CardTitle>
          <CardDescription className="mt-1">
            AI-generated voiceover of the rewritten deck opening.
          </CardDescription>
          <audio
            className="mt-4 w-full"
            controls
            preload="metadata"
            src={row.narration_audio_url}
          >
            Your browser does not support audio playback.
          </audio>
        </Card>
      )}

      {row.gemini_request_id && (
        <p className="font-mono text-[11px] tracking-wider text-neutral-500 break-all">
          gemini_request_id · {row.gemini_request_id}
        </p>
      )}
    </div>
  );
}

function ScoreCard({
  label,
  persona,
  initials,
  tint,
  score,
}: {
  label: string;
  persona: string;
  initials: string;
  tint: string;
  score: number | null;
}) {
  const tone =
    score === null
      ? "text-neutral-400"
      : score >= 8
        ? "text-success"
        : score >= 5
          ? "text-navy"
          : "text-error";
  return (
    <Card
      role="group"
      aria-label={`${label} score - analysed by ${persona}`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <span
          aria-hidden="true"
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${tint} text-white text-[12px] font-bold tracking-wider shadow-sm ring-2 ring-white`}
        >
          {initials}
        </span>
        <div className="min-w-0">
          <CardEyebrow>{label}</CardEyebrow>
          <p className="font-mono text-[10px] uppercase tracking-wider text-navy font-bold truncate">
            {persona}
          </p>
        </div>
      </div>
      {score === null ? (
        <Skeleton className="mt-5 h-12 w-24" aria-label={`Awaiting ${label.toLowerCase()} score`} />
      ) : (
        <p
          className={`mt-5 font-serif text-5xl sm:text-[56px] tabular-nums leading-none ${tone}`}
          aria-live="polite"
        >
          <span aria-label={`Score ${score} out of 10`}>{score}</span>
          <span aria-hidden="true" className="ml-1 text-xl sm:text-2xl font-semibold text-navy/60">
            /10
          </span>
        </p>
      )}
    </Card>
  );
}

function LoadingState() {
  return (
    <div className="container-page pt-10 pb-8 md:pt-14 md:pb-12 space-y-8">
      <div className="space-y-3">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-9 w-72" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Card key={i}>
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-3 h-12 w-24" />
          </Card>
        ))}
      </div>
      <Card>
        <SkeletonText lines={4} />
      </Card>
    </div>
  );
}
