"use client";
import { useState, useRef } from "react";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { DEMO_FOUNDER_ID } from "@/lib/utils";

type Status = "idle" | "uploading" | "processing" | "ready" | "error";

export default function PitchPage() {
  const [status, setStatus] = useState<Status>("idle");
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
    <div className="space-y-8">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-wider text-blue-700">Gemini · multimodal</p>
        <h1 className="mt-1 font-serif text-4xl text-navy">Pitch Surgeon</h1>
        <p className="mt-3 text-neutral-700 max-w-2xl leading-relaxed">
          Drop a .pptx or .pdf deck. A 3-persona council scores Frame, Offer, and Desire — and rewrites the
          weakest slide in three archetypes with a 30-second narrated pitch.
        </p>
      </header>

      <Card
        variant="hero"
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files[0];
          if (f) void handleUpload(f);
        }}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileRef.current?.click()}
        className="cursor-pointer p-10 text-center bg-sky"
      >
        <input
          ref={fileRef}
          type="file"
          accept=".pptx,.pdf"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleUpload(f); }}
        />
        <CardTitle className="font-serif text-2xl">Drop a pitch deck</CardTitle>
        <CardDescription className="mt-2">.pptx or .pdf · ≤25MB · single deck per upload</CardDescription>
        <StatusPill status={status} error={error} className="mt-5" />
      </Card>

      {analysisId && status === "ready" && (
        <a className="font-semibold text-blue-700 hover:text-blue-900" href={`/pitch/${analysisId}`}>
          Open analysis →
        </a>
      )}

      {analysisId && (
        <p className="text-xs font-mono text-neutral-500">analysis_id: {analysisId}</p>
      )}
    </div>
  );
}

function StatusPill({ status, error, className }: { status: Status; error: string | null; className?: string }) {
  const tone =
    status === "ready" ? "bg-success/15 text-success"
    : status === "error" ? "bg-error/15 text-error"
    : status === "idle" ? "bg-white text-neutral-600"
    : "bg-blue-100 text-blue-700";
  return (
    <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold tracking-ui ${tone} ${className ?? ""}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {status}{error && ` — ${error}`}
    </div>
  );
}
