"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { DEMO_FOUNDER_ID } from "@/lib/utils";

export default function CallStart() {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  async function start() {
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch("/api/call/start", {
        method: "POST",
        headers: { "x-founder-id": DEMO_FOUNDER_ID, "content-type": "application/json" },
      });
      if (!r.ok) throw new Error(await r.text());
      const json = await r.json() as { call_id: string };
      router.push(`/call/${json.call_id}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-wider text-blue-700">Speechmatics · real-time</p>
        <h1 className="mt-1 font-serif text-4xl text-navy">Discovery Co-Pilot</h1>
        <p className="mt-3 text-neutral-700 max-w-2xl leading-relaxed">
          Speak from your browser mic. A live JTBD switch chart populates as the conversation
          unfolds — Push, Pull, Anxiety, Habit — with diarized transcript and mid-call nudges if a quadrant
          stays empty.
        </p>
      </header>

      <Card variant="hero" className="p-10 bg-sky">
        <CardTitle className="font-serif text-2xl">Begin a new discovery call</CardTitle>
        <CardDescription className="mt-2">
          You'll be asked for microphone permission. Audio streams to Speechmatics over a WebSocket for
          real-time diarized transcription.
        </CardDescription>
        <div className="mt-6">
          <Button onClick={start} disabled={busy}>
            {busy ? "Starting…" : "Start customer call"}
          </Button>
        </div>
        {err && <p className="mt-3 text-sm text-error">{err}</p>}
      </Card>
    </div>
  );
}
