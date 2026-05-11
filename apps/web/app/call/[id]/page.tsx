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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Live call</h1>
          <p className="text-sm text-slate-500">
            session: <span className="font-mono">{sessionId ?? "—"}</span> ·{" "}
            <span className={connected ? "text-brand-ok" : "text-slate-500"}>{connected ? "connected" : "connecting…"}</span>
          </p>
        </div>
        <Button variant="danger" onClick={endCall}>End call</Button>
      </div>

      <SwitchChartGrid chart={chart} />

      {nudges.length > 0 && (
        <div className="space-y-2">
          {nudges.slice(-3).map((n) => (
            <Card key={n.id} className="border-brand-warn">
              <CardTitle className="text-brand-warn">Nudge · {n.quadrant.toUpperCase()}</CardTitle>
              <CardDescription className="mt-2 text-slate-200">"{n.suggested_question}"</CardDescription>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardTitle>Transcript</CardTitle>
        <div className="mt-3 max-h-72 overflow-y-auto space-y-1 font-mono text-sm">
          {transcript.map((u, i) => (
            <p key={i}><span className="text-slate-500">[{u.speaker}]</span> {u.text}</p>
          ))}
          {partial && <p className="text-slate-500 italic">… {partial}</p>}
        </div>
      </Card>
    </div>
  );
}

function SwitchChartGrid({ chart }: { chart: SwitchChart }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Quadrant title="Push (what's broken today)" color="text-rose-400" evidence={chart.push} />
      <Quadrant title="Pull (desired outcome)" color="text-emerald-400" evidence={chart.pull} />
      <Quadrant title="Anxiety (fear of switching)" color="text-amber-400" evidence={chart.anxiety} />
      <Quadrant title="Habit (status quo inertia)" color="text-sky-400" evidence={chart.habit} />
    </div>
  );
}

function Quadrant({ title, color, evidence }: { title: string; color: string; evidence: SwitchEvidence[] }) {
  return (
    <Card>
      <CardTitle className={color}>{title}</CardTitle>
      <div className="mt-3 space-y-2">
        {evidence.length === 0 && <p className="text-xs text-slate-500">Listening…</p>}
        {evidence.map((e, i) => (
          <div key={i} className="text-sm">
            <p className="text-slate-200">"{e.quote}"</p>
            <p className="text-xs text-slate-500">@ {e.ts.toFixed(1)}s · conf {Math.round(e.confidence * 100)}%</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function CallSummary({ summary, callId }: { summary: FinalSummary; callId: string }) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Call complete</h1>
      <SwitchChartGrid chart={summary.switch_chart} />
      <Card>
        <CardTitle>3 follow-up questions</CardTitle>
        <ol className="mt-3 space-y-2 list-decimal list-inside text-slate-200">
          {summary.follow_ups.map((q, i) => <li key={i}>{q}</li>)}
        </ol>
      </Card>
      <p className="text-xs font-mono text-slate-600">
        speechmatics_session_id: {summary.speechmatics_session_id ?? "—"} · call_id: {callId}
      </p>
    </div>
  );
}
