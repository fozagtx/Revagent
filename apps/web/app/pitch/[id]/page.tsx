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

  if (!row) return <p className="text-slate-400">Loading…</p>;

  const rewrites = row.rewrites?.[tab] ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{row.deck_filename}</h1>
        <p className="text-sm text-slate-500">
          {row.num_slides ?? "?"} slides · status: {row.status}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <ScoreCard label="Frame · Klaff" score={row.frame_score} />
        <ScoreCard label="Offer · Hormozi" score={row.offer_score} />
        <ScoreCard label="Desire · Schwartz" score={row.desire_score} />
      </div>

      {row.weakest_slide_idx !== null && (
        <Card>
          <CardTitle>Weakest slide: #{row.weakest_slide_idx + 1}</CardTitle>
          <CardDescription className="mt-2">
            {row.slide_critiques[row.weakest_slide_idx]?.notes ?? "—"}
          </CardDescription>
        </Card>
      )}

      <div>
        <div className="flex gap-2 mb-3">
          {(["frame_control", "grand_slam", "desire_amp"] as Archetype[]).map((a) => (
            <button
              key={a}
              onClick={() => setTab(a)}
              className={`px-3 py-1.5 rounded-md text-sm ${
                tab === a ? "bg-brand-accent text-brand-ink" : "bg-slate-800 text-slate-300"
              }`}
            >
              {labelFor(a)}{row.strongest_archetype === a && " ★"}
            </button>
          ))}
        </div>
        <div className="space-y-3">
          {rewrites.length === 0 && <p className="text-slate-500 text-sm">Rewrites still processing…</p>}
          {rewrites.map((r, i) => (
            <Card key={i}>
              <CardTitle>Slide {r.slide_idx + 1}</CardTitle>
              <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Original</p>
                  <p className="text-slate-300">{r.original_text}</p>
                </div>
                <div>
                  <p className="text-xs text-brand-accent mb-1">Rewritten</p>
                  <p className="text-slate-100">{r.rewritten_text}</p>
                </div>
              </div>
              <p className="mt-3 text-xs text-slate-500">{r.rationale}</p>
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

      <p className="text-xs font-mono text-slate-600">
        gemini_request_id: {row.gemini_request_id ?? "—"}
      </p>
    </div>
  );
}

function ScoreCard({ label, score }: { label: string; score: number | null }) {
  return (
    <Card>
      <CardDescription>{label}</CardDescription>
      <p className="mt-2 text-4xl font-bold tabular-nums">
        {score ?? "—"}<span className="text-base text-slate-500">/10</span>
      </p>
    </Card>
  );
}

function labelFor(a: Archetype): string {
  return a === "frame_control" ? "Frame Control" : a === "grand_slam" ? "Grand Slam Offer" : "Desire Amp";
}
