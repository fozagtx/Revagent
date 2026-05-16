"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeft, PhoneOff, AlertCircle, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle, CardEyebrow } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/pageHeader";
import { StatusBadge } from "@/components/ui/statusBadge";
import { EmptyState } from "@/components/ui/emptyState";
import type {
  WsSignal,
  SwitchChart,
  SwitchEvidence,
  TranscriptUtterance,
  Quadrant,
} from "@revagent/shared";
import { authedFetch } from "@/lib/utils";
import { startMicCapture, type MicCapture } from "./_lib/recorder";

interface Nudge {
  quadrant: Quadrant;
  suggested_question: string;
  id: number;
}
interface FinalSummary {
  switch_chart: SwitchChart;
  follow_ups: string[];
  speechmatics_session_id: string | null;
}

const EMPTY_CHART: SwitchChart = { push: [], pull: [], anxiety: [], habit: [] };

const QUADRANT_META: Record<
  Quadrant,
  { title: string; sub: string; dot: string; ring: string; bg: string }
> = {
  push: {
    title: "Push",
    sub: "what's broken today",
    dot: "bg-red-500",
    ring: "border-red-200",
    bg: "bg-red-50/50",
  },
  pull: {
    title: "Pull",
    sub: "desired outcome",
    dot: "bg-success",
    ring: "border-emerald-200",
    bg: "bg-emerald-50/50",
  },
  anxiety: {
    title: "Anxiety",
    sub: "fear of switching",
    dot: "bg-amber-600",
    ring: "border-amber-200",
    bg: "bg-amber-50/50",
  },
  habit: {
    title: "Habit",
    sub: "status quo inertia",
    dot: "bg-blue-500",
    ring: "border-blue-200",
    bg: "bg-blue-50/50",
  },
};

export default function LiveCall() {
  const params = useParams<{ id: string }>();
  const [chart, setChart] = useState<SwitchChart>(EMPTY_CHART);
  const [transcript, setTranscript] = useState<TranscriptUtterance[]>([]);
  const [partial, setPartial] = useState<string>("");
  const [nudges, setNudges] = useState<Nudge[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [final, setFinal] = useState<FinalSummary | null>(null);
  const [micError, setMicError] = useState<string | null>(null);
  const [ending, setEnding] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const micRef = useRef<MicCapture | null>(null);
  const transcriptRef = useRef<HTMLDivElement | null>(null);
  const startedAt = useRef<number>(Date.now());

  // Auto-scroll transcript
  useEffect(() => {
    const el = transcriptRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [transcript, partial]);

  // Elapsed timer
  useEffect(() => {
    if (final) return;
    const t = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt.current) / 1000));
    }, 1000);
    return () => clearInterval(t);
  }, [final]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      // 1. Fetch a short-lived token via the Vercel proxy (cookie-authed).
      // 2. Open WS directly to the API host (cross-origin) with the token in URL.
      //    Vercel can't proxy WebSocket upgrades, so we must bypass it for WS.
      let token: string | null = null;
      try {
        const r = await authedFetch("/api/auth/ws-token");
        if (r.ok) token = ((await r.json()) as { token: string }).token;
      } catch {
        /* fall through — server will reject and we'll show an error */
      }

      const apiBase =
        process.env.NEXT_PUBLIC_API_BASE_URL ?? location.origin;
      const wsBase = apiBase.replace(/^http/, "ws");
      const wsUrl = `${wsBase}/api/call/${params.id}/stream${token ? `?token=${encodeURIComponent(token)}` : ""}`;

      const ws = new WebSocket(wsUrl);
      ws.binaryType = "arraybuffer";
      wsRef.current = ws;

      ws.onopen = async () => {
        try {
          const mic = await startMicCapture((chunk) => {
            if (ws.readyState === WebSocket.OPEN) ws.send(chunk);
          });
          if (cancelled) {
            mic.stop();
            return;
          }
          micRef.current = mic;
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          setMicError(
            msg.includes("Permission")
              ? "Microphone permission was denied. Enable it in your browser to continue."
              : `Couldn't access the microphone: ${msg}`,
          );
        }
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data) as WsSignal;
          handleSignal(msg);
        } catch {
          /* ignore parse errors */
        }
      };

      ws.onerror = () => {
        setMicError(
          (current) =>
            current ?? "Connection error. The call stream is interrupted.",
        );
      };

      ws.onclose = () => setConnected(false);
    })();

    return () => {
      cancelled = true;
      micRef.current?.stop();
      wsRef.current?.close();
    };
  }, [params.id]);

  function handleSignal(msg: WsSignal) {
    switch (msg.type) {
      case "status":
        setSessionId(msg.speechmatics_session_id);
        setConnected(msg.connected);
        return;
      case "transcript":
        if (msg.partial) setPartial(msg.utterance.text);
        else {
          setPartial("");
          setTranscript((t) => [...t, msg.utterance]);
        }
        return;
      case "signal":
        setChart((c) => ({
          ...c,
          [msg.quadrant]: [...c[msg.quadrant], msg.evidence],
        }));
        return;
      case "nudge":
        setNudges((n) => [...n, { ...msg, id: Date.now() }]);
        return;
      case "error":
        setMicError(msg.message || "Unknown stream error.");
        return;
    }
  }

  async function endCall() {
    if (ending) return;
    setEnding(true);
    micRef.current?.stop();
    wsRef.current?.close();
    try {
      const r = await authedFetch(`/api/call/${params.id}/end`, {
        method: "POST",
      });
      if (r.ok) setFinal((await r.json()) as FinalSummary);
    } finally {
      setEnding(false);
    }
  }

  if (final) return <CallSummary summary={final} callId={params.id} />;

  return (
    <div className="container-page pt-28 pb-8 md:pt-32 md:pb-12 space-y-7">
      <Link
        href="/call"
        className="inline-flex items-center gap-1 text-xs font-semibold tracking-ui text-neutral-600 hover:text-navy transition"
      >
        <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
        All calls
      </Link>

      <PageHeader
        eyebrow={
          <span className="inline-flex items-center gap-2 flex-wrap">
            {connected ? (
              <StatusBadge tone="success" pulse>
                Live
              </StatusBadge>
            ) : (
              <StatusBadge tone="pending" pulse>
                Connecting…
              </StatusBadge>
            )}
            <span className="text-neutral-400">·</span>
            <span className="font-mono tabular-nums">{formatTime(elapsed)}</span>
            {sessionId && (
              <>
                <span className="text-neutral-400">·</span>
                <span className="font-mono text-neutral-500 truncate max-w-[140px] sm:max-w-[200px]">
                  {sessionId}
                </span>
              </>
            )}
          </span>
        }
        title="Live discovery call"
        actions={
          <Button
            variant="danger"
            onClick={endCall}
            loading={ending}
            iconLeft={!ending ? <PhoneOff /> : undefined}
          >
            {ending ? "Ending…" : "End call"}
          </Button>
        }
      />

      {micError && (
        <Card
          variant="white"
          role="alert"
          className="rise-in border-l-4 border-l-error flex items-start gap-3"
        >
          <AlertCircle className="h-5 w-5 shrink-0 text-error mt-0.5" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold tracking-ui text-error">
              Microphone issue
            </p>
            <p className="mt-0.5 text-sm text-neutral-700">{micError}</p>
          </div>
        </Card>
      )}

      <SwitchChartGrid chart={chart} />

      {nudges.length > 0 && (
        <div className="space-y-2" aria-live="polite">
          {nudges.slice(-3).map((n) => (
            <Card
              key={n.id}
              variant="white"
              className="rise-in flex items-start gap-3 border-l-4 border-l-amber-600"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <Lightbulb className="h-4 w-4" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-mono text-[11px] uppercase tracking-wider text-amber-700">
                  Nudge · {QUADRANT_META[n.quadrant].title.toLowerCase()}
                </p>
                <p className="mt-1 text-[15px] font-medium text-navy leading-snug">
                  &ldquo;{n.suggested_question}&rdquo;
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <div className="flex items-center justify-between">
          <CardTitle as="h3">Transcript</CardTitle>
          <span className="font-mono text-[11px] tracking-wider text-neutral-500 tabular-nums">
            {transcript.length} utterance{transcript.length === 1 ? "" : "s"}
          </span>
        </div>
        {transcript.length === 0 && !partial ? (
          <div className="mt-4">
            <EmptyState
              title="Listening for speech"
              description="Once someone talks, diarized utterances will appear here in real time."
            />
          </div>
        ) : (
          <div
            ref={transcriptRef}
            className="mt-3 max-h-80 overflow-y-auto space-y-2 font-mono text-sm scrollbar-thin scroll-shadow pr-1"
            aria-live="polite"
            aria-label="Live transcript"
          >
            {transcript.map((u, i) => (
              <p key={i} className="leading-relaxed">
                <span
                  className={`mr-2 inline-block min-w-[34px] font-bold ${speakerColor(u.speaker)}`}
                >
                  [{u.speaker}]
                </span>
                <span className="text-navy">{u.text}</span>
              </p>
            ))}
            {partial && (
              <p className="leading-relaxed text-neutral-500 italic">
                <span className="mr-2 inline-block min-w-[34px]">…</span>
                {partial}
              </p>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}

function speakerColor(speaker: string | number): string {
  const n =
    typeof speaker === "number"
      ? speaker
      : speaker.toString().charCodeAt(speaker.toString().length - 1) % 4;
  const palette = [
    "text-blue-700",
    "text-emerald-700",
    "text-amber-700",
    "text-purple-700",
  ];
  return palette[Math.abs(n) % palette.length] ?? "text-neutral-600";
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60)
    .toString()
    .padStart(2, "0");
  const s = (sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function SwitchChartGrid({ chart }: { chart: SwitchChart }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 rise-in stagger-1">
      {(Object.keys(QUADRANT_META) as Quadrant[]).map((q, i) => (
        <div
          key={q}
          className="rise-in"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <QuadrantCard q={q} evidence={chart[q]} />
        </div>
      ))}
    </div>
  );
}

function QuadrantCard({ q, evidence }: { q: Quadrant; evidence: SwitchEvidence[] }) {
  const m = QUADRANT_META[q];
  return (
    <Card className={`border ${m.ring}`}>
      <div className="flex items-baseline justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span className={`h-2 w-2 rounded-full ${m.dot}`} aria-hidden="true" />
          <h3 className="font-semibold tracking-ui text-navy text-lg">
            {m.title}
          </h3>
          <span className="text-xs text-neutral-500">{m.sub}</span>
        </div>
        <span className="font-mono text-[11px] tabular-nums text-neutral-500 shrink-0">
          {evidence.length}
        </span>
      </div>
      <div className="mt-4 space-y-3">
        {evidence.length === 0 && (
          <p className="text-xs italic text-neutral-500">Listening…</p>
        )}
        {evidence.map((e, i) => (
          <div
            key={i}
            className="rise-in border-l-2 border-l-[rgba(189,215,255,0.7)] pl-3"
          >
            <p className="text-sm text-navy leading-snug">&ldquo;{e.quote}&rdquo;</p>
            <p className="mt-0.5 font-mono text-[10px] tracking-wider text-neutral-500 tabular-nums">
              @ {e.ts.toFixed(1)}s · conf {Math.round(e.confidence * 100)}%
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function CallSummary({
  summary,
  callId,
}: {
  summary: FinalSummary;
  callId: string;
}) {
  return (
    <div className="space-y-8">
      <Link
        href="/call"
        className="inline-flex items-center gap-1 text-xs font-semibold tracking-ui text-neutral-600 hover:text-navy transition"
      >
        <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Start another call
      </Link>
      <PageHeader
        eyebrow={<StatusBadge tone="success">Complete</StatusBadge>}
        title="Call summary"
        description="Here's the final JTBD switch chart and the three follow-up questions the agent suggests sending."
      />
      <SwitchChartGrid chart={summary.switch_chart} />
      <Card className="rise-in">
        <CardTitle as="h3">Suggested follow-up questions</CardTitle>
        <ol className="mt-4 space-y-3">
          {summary.follow_ups.map((q, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 font-mono text-xs font-bold tabular-nums text-blue-700">
                {i + 1}
              </span>
              <p className="text-sm leading-relaxed text-navy">{q}</p>
            </li>
          ))}
        </ol>
      </Card>
      <details className="group">
        <summary className="flex cursor-pointer list-none items-center gap-2 text-xs font-semibold tracking-ui text-neutral-500 hover:text-navy transition outline-none">
          <span>Technical details</span>
          <svg
            className="h-3 w-3 transition-transform duration-charms ease-charms group-open:rotate-90"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path d="m9 5 7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </summary>
        <Card variant="white" className="mt-3 space-y-3">
          <p className="text-xs text-neutral-600">
            Identifiers tying this call to the providers behind it — useful for
            debugging or for sponsor verification. You don&apos;t need these to use the product.
          </p>
          <RefRow label="Call ID" value={callId} />
          {summary.speechmatics_session_id && (
            <RefRow
              label="Speechmatics session"
              value={summary.speechmatics_session_id}
            />
          )}
        </Card>
      </details>
    </div>
  );
}

function RefRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked — ignore */
    }
  }
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-wider text-neutral-500">
        {label}
      </p>
      <div className="mt-0.5 flex items-center gap-2">
        <code className="flex-1 font-mono text-sm font-bold text-navy break-all select-all">
          {value}
        </code>
        <button
          type="button"
          onClick={copy}
          className="shrink-0 inline-flex h-7 items-center rounded-md border border-[rgba(0,37,97,0.08)] bg-white px-2 text-[11px] font-semibold tracking-ui text-blue-700 hover:bg-blue-100/40 transition"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}
