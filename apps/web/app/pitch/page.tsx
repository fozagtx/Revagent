"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  UploadCloud,
  ArrowRight,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  X,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/pageHeader";
import { StatusBadge } from "@/components/ui/statusBadge";
import { FileDrop } from "@/components/ui/field";
import { authedFetch } from "@/lib/utils";
import { useLocalState } from "@/lib/useLocalState";

type Status = "idle" | "uploading" | "processing" | "ready" | "error";

interface PitchSession {
  status: Status;
  analysisId: string | null;
  fileName: string | null;
  error: string | null;
}

const INITIAL: PitchSession = {
  status: "idle",
  analysisId: null,
  fileName: null,
  error: null,
};

const MAX_BYTES = 25 * 1024 * 1024;

export default function PitchPage() {
  const [session, setSession, clearSession] = useLocalState<PitchSession>(
    "pitch:session",
    INITIAL,
  );
  const { status, analysisId, fileName, error } = session;
  const setStatus = (s: Status) => setSession((p) => ({ ...p, status: s }));
  const setAnalysisId = (id: string | null) =>
    setSession((p) => ({ ...p, analysisId: id }));
  const setError = (e: string | null) => setSession((p) => ({ ...p, error: e }));
  const setFileName = (n: string | null) =>
    setSession((p) => ({ ...p, fileName: n }));
  const pollingRef = useRef<Set<string>>(new Set());

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
      const r = await authedFetch("/api/pitch", {
        method: "POST",
        body: fd,
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
    if (pollingRef.current.has(id)) return;
    pollingRef.current.add(id);
    try {
      for (let i = 0; i < 60; i++) {
        await new Promise((r) => setTimeout(r, 2000));
        try {
          const r = await authedFetch(`/api/pitch/${id}`);
          if (!r.ok) continue;
          const row = (await r.json()) as {
            status: string;
            errorMessage?: string | null;
          };
          if (row.status === "complete") {
            setStatus("ready");
            return;
          }
          if (row.status === "failed") {
            setStatus("error");
            setError(humanizeBackendError(row.errorMessage));
            return;
          }
        } catch {
          /* keep polling */
        }
      }
      setStatus("error");
      setError("Timed out waiting for analysis.");
    } finally {
      pollingRef.current.delete(id);
    }
  }

  // Resume polling on reload if a processing analysis was persisted
  useEffect(() => {
    if (status === "processing" && analysisId) {
      void pollUntilReady(analysisId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function humanizeBackendError(raw: string | null | undefined): string {
    if (!raw) return "Analysis failed. Try a different deck.";
    const msg = raw.toLowerCase();
    if (msg.includes("libreoffice")) {
      return "PPTX conversion needs LibreOffice on the server. Export your deck as PDF and re-upload, or install LibreOffice (brew install --cask libreoffice).";
    }
    if (msg.includes("429") || msg.includes("quota") || msg.includes("rate")) {
      return "Gemini quota exceeded. Switch GEMINI_MODEL to gemini-2.5-flash (or wait for quota to reset) and retry.";
    }
    if (msg.includes("no slides extracted")) {
      return "Couldn't read any slides from this file. It may be corrupted or empty.";
    }
    if (msg.includes("invalid shape")) {
      return "Gemini returned a malformed analysis. Retry — this is usually transient.";
    }
    // Trim verbose Google API noise so the user sees the actionable bit
    const first = raw.split("\n")[0]?.trim() ?? raw;
    return first.length > 220 ? first.slice(0, 220) + "…" : first;
  }

  function reset() {
    clearSession();
  }

  const hasSession =
    status !== "idle" || analysisId != null || fileName != null;

  const busy = status === "uploading" || status === "processing";

  return (
    <div className="container-page pt-28 pb-8 md:pt-32 md:pb-12 space-y-8">
      <PageHeader
        eyebrow="Gemini · multimodal"
        title="Pitch Surgeon"
        description="Drop a .pptx or .pdf deck. A 3-persona council scores Frame, Offer, and Desire — then rewrites the weakest slide in three archetypes with a 30-second narrated pitch."
        actions={
          hasSession && !busy ? (
            <button
              type="button"
              onClick={reset}
              className="inline-flex h-10 items-center gap-1.5 rounded-2xl border border-[rgba(0,37,97,0.08)] bg-white px-4 text-xs font-semibold tracking-ui text-neutral-600 transition hover:bg-blue-100/40 hover:text-navy"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              Clear session
            </button>
          ) : null
        }
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
            <h2 className="mt-5 font-serif text-xl sm:text-2xl text-navy break-all max-w-full">
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
        <Card
          variant="hero"
          className="rise-in bg-sky flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"
        >
          <div className="flex items-center gap-4 min-w-0">
            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center">
              <span className="absolute inset-0 rounded-full bg-success/15" />
              <span className="absolute inset-1 rounded-full bg-white shadow-neu-card border border-[rgba(189,215,255,0.5)]" />
              <CheckCircle2 className="relative h-5 w-5 text-success" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="font-serif text-lg text-navy">Analysis is ready</p>
              <p className="mt-0.5 text-xs text-neutral-600 tracking-ui">
                Frame · Offer · Desire scored. Rewrites and narration drafted.
              </p>
            </div>
          </div>
          <Link
            href={`/pitch/${analysisId}`}
            className="btn-cta inline-flex h-11 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-semibold tracking-ui shrink-0 sm:w-auto"
          >
            Open analysis
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Card>
      )}

      {analysisId && status === "processing" && <AnalyzingCard />}
    </div>
  );
}

function AnalyzingCard() {
  const phrases = [
    "Reading slides",
    "Inspecting visuals",
    "Scoring Frame · Offer · Desire",
    "Drafting rewrites",
    "Composing 30-second narration",
  ];
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % phrases.length), 2200);
    return () => clearInterval(t);
  }, [phrases.length]);

  return (
    <Card variant="white" className="rise-in">
      <div className="flex items-center gap-4">
        <div className="relative flex h-12 w-12 shrink-0 items-center justify-center">
          <span className="absolute inset-0 rounded-full bg-blue-100 halo-pulse" />
          <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-neu-card border border-[rgba(189,215,255,0.5)] text-blue-700">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold tracking-ui text-navy">
            Analyzing your deck
          </p>
          <p
            key={i}
            className="mt-0.5 text-sm text-neutral-700 fade-in"
            aria-live="polite"
          >
            {phrases[i]}…
          </p>
        </div>
      </div>
      <div
        className="mt-4 h-1 w-full overflow-hidden rounded-full bg-blue-100"
        role="progressbar"
        aria-label="Analysis in progress"
      >
        <div className="progress-slide h-full w-1/3 rounded-full bg-gradient-to-r from-blue-500 to-blue-700" />
      </div>
    </Card>
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
