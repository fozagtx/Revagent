"use client";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { DEMO_FOUNDER_ID } from "@/lib/utils";

export default function PitchPage() {
  const [status, setStatus] = useState<"idle" | "uploading" | "processing" | "ready" | "error">("idle");
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleUpload(file: File) {
    setStatus("uploading");
    setError(null);
    try {
      const fd = new FormData();
      fd.append("deck", file);
      const r = await fetch("/api/pitch", {
        method: "POST",
        body: fd,
        headers: { "x-founder-id": DEMO_FOUNDER_ID },
      });
      if (!r.ok) throw new Error(await r.text());
      const json = await r.json() as { analysis_id: string };
      setAnalysisId(json.analysis_id);
      setStatus("processing");
      void pollUntilReady(json.analysis_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStatus("error");
    }
  }

  async function pollUntilReady(id: string) {
    for (let i = 0; i < 60; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      try {
        const r = await fetch(`/api/pitch/${id}`, { headers: { "x-founder-id": DEMO_FOUNDER_ID } });
        if (!r.ok) continue;
        const row = await r.json() as { status: string };
        if (row.status === "complete") { setStatus("ready"); return; }
        if (row.status === "failed") { setStatus("error"); setError("Analysis failed"); return; }
      } catch { /* keep polling */ }
    }
    setStatus("error");
    setError("Timed out waiting for analysis");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Pitch Surgeon</h1>
        <p className="text-slate-400 mt-2">
          Drop a .pptx or .pdf deck. Get 3 scores, a weakest-slide rewrite in 3 archetypes, and a 30-sec narrated pitch.
        </p>
      </div>

      <Card
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files[0];
          if (f) void handleUpload(f);
        }}
        onDragOver={(e) => e.preventDefault()}
        className="border-dashed cursor-pointer hover:border-brand-accent"
        onClick={() => fileRef.current?.click()}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".pptx,.pdf"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleUpload(f); }}
        />
        <CardTitle>Drop a pitch deck</CardTitle>
        <CardDescription className="mt-2">.pptx or .pdf · ≤25MB · single deck per upload</CardDescription>
        <p className="mt-4 text-xs text-slate-500">Status: {status}{error && ` — ${error}`}</p>
      </Card>

      {analysisId && status === "ready" && (
        <a className="text-brand-accent" href={`/pitch/${analysisId}`}>Open analysis →</a>
      )}

      {analysisId && (
        <p className="text-xs font-mono text-slate-500">analysis_id: {analysisId}</p>
      )}
    </div>
  );
}
