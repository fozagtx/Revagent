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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Discovery Co-Pilot</h1>
        <p className="text-slate-400 mt-2">
          Start a call. Speak from your browser mic. A live JTBD switch chart populates as the conversation
          unfolds — Push, Pull, Anxiety, Habit — with diarized transcript and mid-call nudges if a quadrant stays empty.
        </p>
      </div>
      <Card>
        <CardTitle>Begin a new discovery call</CardTitle>
        <CardDescription className="mt-2">
          You'll be asked for microphone permission. Recording is streamed to Speechmatics for real-time
          diarized transcription.
        </CardDescription>
        <div className="mt-4">
          <Button onClick={start} disabled={busy}>{busy ? "Starting…" : "Start customer call"}</Button>
        </div>
        {err && <p className="mt-3 text-sm text-brand-danger">{err}</p>}
      </Card>
    </div>
  );
}
