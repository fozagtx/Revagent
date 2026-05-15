"use client";
import { useState } from "react";
import Link from "next/link";
import { UploadCloud, FileText, ArrowRight, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/pageHeader";
import { StatusBadge } from "@/components/ui/statusBadge";
import { FileDrop } from "@/components/ui/field";
import { DEMO_FOUNDER_ID } from "@/lib/utils";

type Status = "idle" | "uploading" | "processing" | "ready" | "error";

const MAX_BYTES = 25 * 1024 * 1024;

export default function PitchPage() {
  const [status, setStatus] = useState<Status>("idle");
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  async function handleUpload(file: File) {
    if (file.size > MAX_BYTES) {
      setError("File too large. Max 25MB.");
      setStatus("error");
      return;
    }
    const lower = file.name.toLowerCase();
    if (!lower.endsWith(".pdf") && !lower.endsWith(".pptx")) {
      setError("Unsupported file type. Use .pdf or .pptx.");
      setStatus("error");
      return;
    }

    setFileName(file.name);
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
      if (!r.ok) throw new Error((await r.text()) || `Upload failed (${r.status})`);
      const json = (await r.json()) as { analysis_id: string };
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
        const r = await fetch(`/api/pitch/${id}`, {
          headers: { "x-founder-id": DEMO_FOUNDER_ID },
        });
        if (!r.ok) continue;
        const row = (await r.json()) as { status: string };
        if (row.status === "complete") {
          setStatus("ready");
          return;
        }
        if (row.status === "failed") {
          setStatus("error");
          setError("Analysis failed. Try a different deck.");
          return;
        }
      } catch {
        /* keep polling */
      }
    }
    setStatus("error");
    setError("Timed out waiting for analysis.");
  }

  function reset() {
    setStatus("idle");
    setAnalysisId(null);
    setError(null);
    setFileName(null);
  }

  const busy = status === "uploading" || status === "processing";

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Gemini · multimodal"
        title="Pitch Surgeon"
        description="Drop a .pptx or .pdf deck. A 3-persona council scores Frame, Offer, and Desire — then rewrites the weakest slide in three archetypes with a 30-second narrated pitch."
      />

      <div className="rise-in stagger-1">
        <FileDrop
          accept=".pptx,.pdf"
          onFile={handleUpload}
          disabled={busy}
          className="bg-sky"
        >
          <div className="flex flex-col items-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-neu-card border border-[rgba(189,215,255,0.5)] text-blue-700">
              <UploadCloud className="h-6 w-6" aria-hidden="true" />
            </div>
            <h2 className="mt-5 font-serif text-2xl text-navy">
              {fileName ?? "Drop a pitch deck"}
            </h2>
            <p className="mt-2 text-sm text-neutral-600 tracking-ui">
              .pptx or .pdf · up to 25MB · single deck per upload
            </p>
            <div className="mt-5">
              <StatusPill status={status} />
            </div>
          </div>
        </FileDrop>
      </div>

      {error && (
        <Card
          variant="white"
          className="rise-in border-l-4 border-l-error flex items-start gap-3"
          role="alert"
        >
          <AlertCircle className="h-5 w-5 shrink-0 text-error mt-0.5" aria-hidden="true" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold tracking-ui text-error">
              Something went wrong
            </p>
            <p className="mt-0.5 text-sm text-neutral-700">{error}</p>
          </div>
          <button
            onClick={reset}
            className="text-xs font-semibold tracking-ui text-blue-700 hover:text-blue-900 underline-offset-2 hover:underline"
          >
            Try again
          </button>
        </Card>
      )}

      {analysisId && status === "ready" && (
        <Card variant="white" className="rise-in flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/12 text-success shrink-0">
              <FileText className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold tracking-ui text-navy">
                Analysis ready
              </p>
              <p className="font-mono text-[11px] text-neutral-500 truncate">
                {analysisId}
              </p>
            </div>
          </div>
          <Link
            href={`/pitch/${analysisId}`}
            className="inline-flex h-10 items-center gap-1.5 rounded-2xl bg-white border border-[rgba(0,37,97,0.08)] px-4 text-xs font-semibold tracking-ui text-blue-700 hover:bg-blue-100/40 transition shrink-0"
          >
            Open analysis
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </Card>
      )}

      {analysisId && status === "processing" && (
        <p className="font-mono text-[11px] tracking-wider text-neutral-500 fade-in">
          analysis_id · {analysisId}
        </p>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: Status }) {
  if (status === "idle") return null;
  if (status === "uploading") {
    return (
      <StatusBadge tone="pending" pulse>
        Uploading…
      </StatusBadge>
    );
  }
  if (status === "processing") {
    return (
      <StatusBadge tone="pending" pulse>
        Analyzing deck
      </StatusBadge>
    );
  }
  if (status === "ready") {
    return <StatusBadge tone="success">Ready</StatusBadge>;
  }
  return <StatusBadge tone="error">Failed</StatusBadge>;
}
