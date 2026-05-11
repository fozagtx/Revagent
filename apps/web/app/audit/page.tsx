"use client";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { DEMO_FOUNDER_ID } from "@/lib/utils";

interface AuditRow {
  id: string;
  deal_id: string;
  outcome: "won" | "lost";
  classification: string | null;
  pipeline_checkpoint: string;
  digest_pdf_url: string | null;
  created_at: string;
}

export default function AuditPage() {
  const [audits, setAudits] = useState<AuditRow[]>([]);
  const [dealId, setDealId] = useState("");
  const [outcome, setOutcome] = useState<"won" | "lost">("lost");
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let alive = true;
    const fetchAudits = async () => {
      const r = await fetch("/api/audit", { headers: { "x-founder-id": DEMO_FOUNDER_ID } });
      if (r.ok && alive) setAudits(((await r.json()) as { audits: AuditRow[] }).audits);
    };
    void fetchAudits();
    const t = setInterval(fetchAudits, 4000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  async function submit() {
    const file = fileRef.current?.files?.[0];
    if (!file || !dealId) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("deal_id", dealId);
      fd.append("outcome", outcome);
      fd.append("transcript", file);
      await fetch("/api/audit/manual", {
        method: "POST",
        body: fd,
        headers: { "x-founder-id": DEMO_FOUNDER_ID },
      });
      setDealId("");
      if (fileRef.current) fileRef.current.value = "";
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Win-Loss Auditor</h1>
        <p className="text-slate-400 mt-2">
          Drop a call transcript with an outcome label. The 4-stage Featherless pipeline extracts
          objections, JTBD patterns, win-loss classification, and verbatim buyer language. Final PDF digest
          is emailed when complete.
        </p>
      </div>

      <Card>
        <CardTitle>Submit a deal for analysis</CardTitle>
        <div className="mt-4 grid grid-cols-3 gap-3">
          <input
            className="bg-slate-800 rounded-md px-3 py-2 text-sm"
            placeholder="deal_id"
            value={dealId}
            onChange={(e) => setDealId(e.target.value)}
          />
          <select
            className="bg-slate-800 rounded-md px-3 py-2 text-sm"
            value={outcome}
            onChange={(e) => setOutcome(e.target.value as "won" | "lost")}
          >
            <option value="lost">Lost</option>
            <option value="won">Won</option>
          </select>
          <input ref={fileRef} type="file" accept=".txt,.md,.json" className="text-sm" />
        </div>
        <div className="mt-4">
          <Button onClick={submit} disabled={submitting || !dealId}>
            {submitting ? "Submitting…" : "Submit"}
          </Button>
        </div>
      </Card>

      <div className="space-y-3">
        <h2 className="text-sm uppercase tracking-wide text-slate-500">Recent audits</h2>
        {audits.length === 0 && <CardDescription>None yet.</CardDescription>}
        {audits.map((a) => (
          <Card key={a.id} className="flex items-center justify-between">
            <div>
              <p className="font-semibold">{a.deal_id}</p>
              <p className="text-sm text-slate-400">
                {a.outcome.toUpperCase()} · checkpoint: <span className="font-mono">{a.pipeline_checkpoint}</span>
                {a.classification && ` · ${a.classification}`}
              </p>
            </div>
            <div className="flex gap-3">
              <a href={`/audit/${a.id}`} className="text-brand-accent text-sm">Detail →</a>
              {a.digest_pdf_url && (
                <a href={a.digest_pdf_url} target="_blank" rel="noreferrer" className="text-brand-accent text-sm">PDF</a>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
