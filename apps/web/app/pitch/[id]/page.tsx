"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { DEMO_FOUNDER_ID } from "@/lib/utils";
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

export default function PitchAnalysisPage() {
  const params = useParams<{ id: string }>();
  const [row, setRow] = useState<PitchRow | null>(null);
  const [tab, setTab] = useState<Archetype>("frame_control");

  useEffect(() => {
    let alive = true;
    const fetchIt = async () => {
      const r = await fetch(`/api/pitch/${params.id}`, { headers: { "x-founder-id": DEMO_FOUNDER_ID } });
      if (r.ok && alive) {
        const j = await r.json() as PitchRow;
        setRow(j);
        if (j.strongest_archetype) setTab(j.strongest_archetype);
      }
    };
    void fetchIt();
    const t = setInterval(fetchIt, 3000);
    return () => { alive = false; clearInterval(t); };
  }, [params.id]);

  if (!row) return <p className="text-neutral-600">Loading…</p>;

  const rewrites = row.rewrites?.[tab] ?? [];

  return (
    <div className="space-y-8">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-wider text-blue-700">{row.num_slides ?? "?"} slides · {row.status}</p>
        <h1 className="mt-1 font-serif text-3xl text-navy">{row.deck_filename}</h1>
      </header>

      <div className="grid grid-cols-3 gap-5">
        <ScoreCard label="Frame · Klaff" score={row.frame_score} />
        <ScoreCard label="Offer · Hormozi" score={row.offer_score} />
        <ScoreCard label="Desire · Schwartz" score={row.desire_score} />
      </div>

      {row.weakest_slide_idx !== null && (
        <Card variant="white" className="border-l-4 border-l-blue-700">
          <CardTitle>
            <span className="font-mono text-xs uppercase tracking-wider text-blue-700">Weakest slide</span>
            <span className="block mt-1">Slide #{row.weakest_slide_idx + 1}</span>
          </CardTitle>
          <CardDescription className="mt-2 text-neutral-700">
            {row.slide_critiques[row.weakest_slide_idx]?.notes ?? "—"}
          </CardDescription>
        </Card>
      )}

      <div>
        <div className="flex gap-2 mb-4">
          {(["frame_control", "grand_slam", "desire_amp"] as Archetype[]).map((a) => (
            <button
              key={a}
              onClick={() => setTab(a)}
              className={`rounded-full px-4 py-2 text-sm tracking-ui font-semibold transition ${
                tab === a
                  ? "bg-blue-150 text-navy border border-blue-200"
                  : "bg-neutral-50 text-navy border border-neutral-200 hover:bg-blue-100"
              }`}
            >
              {labelFor(a)}{row.strongest_archetype === a && " ★"}
            </button>
          ))}
        </div>
        <div className="space-y-3">
          {rewrites.length === 0 && <p className="text-neutral-600 text-sm">Rewrites still processing…</p>}
          {rewrites.map((r, i) => (
            <Card key={i}>
              <CardTitle>Slide {r.slide_idx + 1}</CardTitle>
              <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs font-mono uppercase tracking-wider text-neutral-500 mb-1">Original</p>
                  <p className="text-neutral-700">{r.original_text}</p>
                </div>
                <div>
                  <p className="text-xs font-mono uppercase tracking-wider text-blue-700 mb-1">Rewritten</p>
                  <p className="text-navy font-medium">{r.rewritten_text}</p>
                </div>
              </div>
              <p className="mt-3 text-xs text-neutral-600 italic">{r.rationale}</p>
            </Card>
          ))}
        </div>
      </div>

      {row.narration_audio_url && (
        <Card>
          <CardTitle>30-second narrated pitch</CardTitle>
          <audio className="mt-3 w-full" controls src={row.narration_audio_url} />
        </Card>
      )}

      <p className="text-xs font-mono text-neutral-500">
        gemini_request_id: {row.gemini_request_id ?? "—"}
      </p>
    </div>
  );
}

function ScoreCard({ label, score }: { label: string; score: number | null }) {
  return (
    <Card>
      <p className="font-mono text-[11px] uppercase tracking-wider text-blue-700">{label}</p>
      <p className="mt-3 font-serif text-5xl text-navy tabular-nums leading-none">
        {score ?? "—"}<span className="text-2xl text-neutral-500">/10</span>
      </p>
    </Card>
  );
}

function labelFor(a: Archetype): string {
  return a === "frame_control" ? "Frame Control" : a === "grand_slam" ? "Grand Slam Offer" : "Desire Amp";
}
