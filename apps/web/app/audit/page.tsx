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
    <div className="space-y-8">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-wider text-blue-700">Featherless · async</p>
        <h1 className="mt-1 font-serif text-4xl text-navy">Win-Loss Auditor</h1>
        <p className="mt-3 text-neutral-700 max-w-2xl leading-relaxed">
          Drop a call transcript with an outcome label. The 4-stage Featherless pipeline extracts
          objections, JTBD patterns, win-loss classification, and verbatim buyer language. Final PDF digest
          is emailed when complete.
        </p>
      </header>

      <Card variant="hero" className="p-6 bg-sky">
        <CardTitle className="font-serif text-xl">Submit a deal for analysis</CardTitle>
        <div className="mt-5 grid grid-cols-3 gap-3">
          <input
            className="frosted rounded-xl px-3 py-2 text-sm tracking-ui text-navy placeholder:text-neutral-500 outline-none focus:border-blue-500"
            placeholder="deal_id"
            value={dealId}
            onChange={(e) => setDealId(e.target.value)}
          />
          <select
            className="frosted rounded-xl px-3 py-2 text-sm tracking-ui text-navy outline-none"
            value={outcome}
            onChange={(e) => setOutcome(e.target.value as "won" | "lost")}
          >
            <option value="lost">Lost</option>
            <option value="won">Won</option>
          </select>
          <input ref={fileRef} type="file" accept=".txt,.md,.json" className="text-sm text-navy" />
        </div>
        <div className="mt-5">
          <Button onClick={submit} disabled={submitting || !dealId}>
            {submitting ? "Submitting…" : "Submit"}
          </Button>
        </div>
      </Card>

      <section className="space-y-3">
        <h2 className="text-xs uppercase tracking-wider text-neutral-500">Recent audits</h2>
        {audits.length === 0 && <CardDescription>None yet.</CardDescription>}
        {audits.map((a) => (
          <Card key={a.id} variant="white" className="flex items-center justify-between">
            <div>
              <p className="font-semibold tracking-ui text-navy">{a.deal_id}</p>
              <p className="text-sm text-neutral-600 mt-1">
                <span className={a.outcome === "won" ? "text-success font-semibold" : "text-error font-semibold"}>
                  {a.outcome.toUpperCase()}
                </span>{" · "}
                <span className="font-mono text-xs">{a.pipeline_checkpoint}</span>
                {a.classification && ` · ${a.classification}`}
              </p>
            </div>
            <div className="flex gap-4">
              <a href={`/audit/${a.id}`} className="text-blue-700 font-semibold text-sm">Detail →</a>
              {a.digest_pdf_url && (
                <a href={a.digest_pdf_url} target="_blank" rel="noreferrer" className="text-blue-700 font-semibold text-sm">PDF</a>
              )}
            </div>
          </Card>
        ))}
      </section>
    </div>
  );
}
