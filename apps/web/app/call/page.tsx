"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mic, Lock, Radio, AlertCircle, ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/pageHeader";
import { authedFetch } from "@/lib/utils";
import { useLocalState } from "@/lib/useLocalState";

interface LastCall {
  callId: string | null;
  startedAt: number | null;
}

const INITIAL_LAST: LastCall = { callId: null, startedAt: null };

export default function CallStart() {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [lastCall, setLastCall, clearLastCall] = useLocalState<LastCall>(
    "call:last",
    INITIAL_LAST,
  );
  const router = useRouter();

  async function start() {
    setBusy(true);
    setErr(null);
    try {
      const r = await authedFetch("/api/call/start", {
        method: "POST",
      });
      if (!r.ok) throw new Error((await r.text()) || `Start failed (${r.status})`);
      const json = (await r.json()) as { call_id: string };
      setLastCall({ callId: json.call_id, startedAt: Date.now() });
      router.push(`/call/${json.call_id}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  }

  return (
    <div className="container-page pt-28 pb-8 md:pt-32 md:pb-12 space-y-8">
      <PageHeader
        eyebrow="Speechmatics · real-time"
        title="Discovery Co-Pilot"
        description="Speak from your browser mic. A live JTBD switch chart populates as the conversation unfolds — Push, Pull, Anxiety, Habit — with diarized transcript and mid-call nudges if a quadrant stays empty."
        actions={
          lastCall.callId ? (
            <button
              type="button"
              onClick={clearLastCall}
              className="inline-flex h-10 items-center gap-1.5 rounded-2xl border border-[rgba(0,37,97,0.08)] bg-white px-4 text-xs font-semibold tracking-ui text-neutral-600 transition hover:bg-blue-100/40 hover:text-navy"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              Clear session
            </button>
          ) : null
        }
      />

      {lastCall.callId && (
        <Card
          variant="white"
          className="rise-in flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0">
            <p className="text-sm font-semibold tracking-ui text-navy">
              Resume your last call
            </p>
            <p className="mt-0.5 font-mono text-[11px] tracking-wider text-neutral-500 break-all">
              call_id · {lastCall.callId}
            </p>
          </div>
          <Link
            href={`/call/${lastCall.callId}`}
            className="inline-flex h-10 items-center gap-1.5 rounded-2xl bg-blue-150 px-4 text-xs font-semibold tracking-ui text-navy transition hover:bg-blue-200 shrink-0"
          >
            Open
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </Card>
      )}

      <Card variant="hero" className="bg-sky p-6 sm:p-8 md:p-10 rise-in stagger-1">
        <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-neu-card border border-[rgba(189,215,255,0.5)] text-blue-700">
              <Mic className="h-5 w-5" aria-hidden="true" />
            </div>
            <h2 className="mt-4 font-serif text-xl sm:text-2xl text-navy">
              Begin a new discovery call
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-neutral-700">
              Your browser will ask for microphone permission. Audio streams to
              Speechmatics over a secure WebSocket for real-time diarized
              transcription.
            </p>
          </div>
          <Button
            onClick={start}
            loading={busy}
            size="lg"
            iconLeft={!busy ? <Radio /> : undefined}
          >
            {busy ? "Starting…" : "Start customer call"}
          </Button>
        </div>

        <ul className="mt-6 grid gap-3 text-xs text-neutral-600 sm:grid-cols-3">
          <li className="flex items-center gap-2">
            <Lock className="h-3.5 w-3.5 text-blue-700" aria-hidden="true" />
            Audio never stored without consent
          </li>
          <li className="flex items-center gap-2">
            <Mic className="h-3.5 w-3.5 text-blue-700" aria-hidden="true" />
            Mic permission required
          </li>
          <li className="flex items-center gap-2">
            <Radio className="h-3.5 w-3.5 text-blue-700" aria-hidden="true" />
            Live diarized transcript
          </li>
        </ul>
      </Card>

      {err && (
        <Card
          variant="white"
          role="alert"
          className="rise-in border-l-4 border-l-error flex items-start gap-3"
        >
          <AlertCircle className="h-5 w-5 shrink-0 text-error mt-0.5" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold tracking-ui text-error">
              Couldn&apos;t start the call
            </p>
            <p className="mt-0.5 text-sm text-neutral-700">{err}</p>
          </div>
        </Card>
      )}
    </div>
  );
}
