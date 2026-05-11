"use client";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { DEMO_FOUNDER_ID } from "@/lib/utils";
import type {
  WsSignal, SwitchChart, SwitchEvidence, TranscriptUtterance, Quadrant,
} from "@revagent/shared";
import { startMicCapture, type MicCapture } from "./_lib/recorder";

interface Nudge { quadrant: Quadrant; suggested_question: string; id: number }
interface FinalSummary { switch_chart: SwitchChart; follow_ups: string[]; speechmatics_session_id: string | null }

const EMPTY_CHART: SwitchChart = { push: [], pull: [], anxiety: [], habit: [] };

const QUADRANT_META: Record<Quadrant, { title: string; sub: string; dot: string }> = {
  push:    { title: "Push",    sub: "what's broken today",   dot: "bg-red-500" },
  pull:    { title: "Pull",    sub: "desired outcome",       dot: "bg-success" },
  anxiety: { title: "Anxiety", sub: "fear of switching",     dot: "bg-amber-700" },
  habit:   { title: "Habit",   sub: "status quo inertia",    dot: "bg-blue-500" },
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
  const wsRef = useRef<WebSocket | null>(null);
  const micRef = useRef<MicCapture | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const wsUrl = `${location.origin.replace(/^http/, "ws")}/api/call/${params.id}/stream`;
      const ws = new WebSocket(wsUrl);
      ws.binaryType = "arraybuffer";
      wsRef.current = ws;

      ws.onopen = async () => {
        try {
          const mic = await startMicCapture((chunk) => {
            if (ws.readyState === WebSocket.OPEN) ws.send(chunk);
          });
          if (cancelled) { mic.stop(); return; }
          micRef.current = mic;
        } catch (err) {
          console.error("[mic]", err);
        }
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data) as WsSignal;
          handleSignal(msg);
        } catch { /* */ }
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
        setChart((c) => ({ ...c, [msg.quadrant]: [...c[msg.quadrant], msg.evidence] }));
        return;
      case "nudge":
        setNudges((n) => [...n, { ...msg, id: Date.now() }]);
        return;
      case "error":
        console.error("[ws error]", msg.message);
        return;
    }
  }

  async function endCall() {
    micRef.current?.stop();
    wsRef.current?.close();
    const r = await fetch(`/api/call/${params.id}/end`, {
      method: "POST",
      headers: { "x-founder-id": DEMO_FOUNDER_ID },
    });
    if (r.ok) setFinal(await r.json() as FinalSummary);
  }

  if (final) return <CallSummary summary={final} callId={params.id} />;

  return (
    <div className="space-y-7">
      <header className="flex items-center justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wider text-blue-700">
            {connected ? "● connected" : "○ connecting…"} · session {sessionId ?? "—"}
          </p>
          <h1 className="mt-1 font-serif text-3xl text-navy">Live call</h1>
        </div>
        <Button variant="danger" onClick={endCall}>End call</Button>
      </header>

      <SwitchChartGrid chart={chart} />

      {nudges.length > 0 && (
        <div className="space-y-2">
          {nudges.slice(-3).map((n) => (
            <Card key={n.id} variant="white" className="border-l-4 border-l-amber-700">
              <p className="font-mono text-[11px] uppercase tracking-wider text-amber-700">
                Nudge · {QUADRANT_META[n.quadrant].title.toLowerCase()}
              </p>
              <CardDescription className="mt-2 text-navy font-medium">
                "{n.suggested_question}"
              </CardDescription>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardTitle>Transcript</CardTitle>
        <div className="mt-3 max-h-72 overflow-y-auto space-y-1 font-mono text-sm">
          {transcript.map((u, i) => (
            <p key={i} className="text-navy">
              <span className="text-neutral-500">[{u.speaker}]</span> {u.text}
            </p>
          ))}
          {partial && <p className="text-neutral-500 italic">… {partial}</p>}
        </div>
      </Card>
    </div>
  );
}

function SwitchChartGrid({ chart }: { chart: SwitchChart }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {(Object.keys(QUADRANT_META) as Quadrant[]).map((q) => (
        <QuadrantCard key={q} q={q} evidence={chart[q]} />
      ))}
    </div>
  );
}

function QuadrantCard({ q, evidence }: { q: Quadrant; evidence: SwitchEvidence[] }) {
  const m = QUADRANT_META[q];
  return (
    <Card>
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${m.dot}`} />
        <h3 className="font-semibold tracking-ui text-navy text-lg">{m.title}</h3>
        <span className="text-xs text-neutral-500">{m.sub}</span>
      </div>
      <div className="mt-3 space-y-2.5">
        {evidence.length === 0 && <p className="text-xs text-neutral-500">Listening…</p>}
        {evidence.map((e, i) => (
          <div key={i} className="text-sm">
            <p className="text-navy">"{e.quote}"</p>
            <p className="text-xs text-neutral-500">@ {e.ts.toFixed(1)}s · conf {Math.round(e.confidence * 100)}%</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function CallSummary({ summary, callId }: { summary: FinalSummary; callId: string }) {
  return (
    <div className="space-y-8">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-wider text-success">● complete</p>
        <h1 className="mt-1 font-serif text-3xl text-navy">Call complete</h1>
      </header>
      <SwitchChartGrid chart={summary.switch_chart} />
      <Card>
        <CardTitle>3 follow-up questions</CardTitle>
        <ol className="mt-4 space-y-2 list-decimal list-inside text-navy">
          {summary.follow_ups.map((q, i) => <li key={i}>{q}</li>)}
        </ol>
      </Card>
      <p className="text-xs font-mono text-neutral-500">
        speechmatics_session_id: {summary.speechmatics_session_id ?? "—"} · call_id: {callId}
      </p>
    </div>
  );
}
