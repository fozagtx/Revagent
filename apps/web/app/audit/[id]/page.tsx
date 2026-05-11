"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { DEMO_FOUNDER_ID } from "@/lib/utils";
import type { Objection, JtbdPatterns, BuyerPhrase, FeatherlessModelVersions } from "@revagent/shared";

interface AuditDetail {
  id: string;
  deal_id: string;
  outcome: "won" | "lost";
  classification: string | null;
  classification_evidence: Array<{ claim: string; quote_or_pattern: string }> | null;
  objections: Objection[] | null;
  jtbd_patterns: JtbdPatterns | null;
  buyer_language: BuyerPhrase[] | null;
  featherless_model_versions: FeatherlessModelVersions | null;
  digest_pdf_url: string | null;
  pipeline_checkpoint: string;
  error_message: string | null;
}

export default function AuditDetailPage() {
  const params = useParams<{ id: string }>();
  const [row, setRow] = useState<AuditDetail | null>(null);

  useEffect(() => {
    let alive = true;
    const fetchOne = async () => {
      const r = await fetch(`/api/audit/${params.id}`, { headers: { "x-founder-id": DEMO_FOUNDER_ID } });
      if (r.ok && alive) setRow(await r.json() as AuditDetail);
    };
    void fetchOne();
    const t = setInterval(fetchOne, 3000);
    return () => { alive = false; clearInterval(t); };
  }, [params.id]);

  if (!row) return <p className="text-slate-400">Loading…</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{row.deal_id}</h1>
          <p className="text-sm text-slate-500">
            {row.outcome.toUpperCase()} · checkpoint <span className="font-mono">{row.pipeline_checkpoint}</span>
            {row.classification && ` · ${row.classification}`}
          </p>
        </div>
        {row.digest_pdf_url && (
          <a href={row.digest_pdf_url} target="_blank" rel="noreferrer" className="text-brand-accent">PDF →</a>
        )}
      </div>

      {row.error_message && (
        <Card className="border-brand-danger">
          <CardTitle className="text-brand-danger">Pipeline error</CardTitle>
          <CardDescription className="mt-2">{row.error_message}</CardDescription>
        </Card>
      )}

      <Section title="Objections" empty={!row.objections?.length}>
        {row.objections?.map((o, i) => (
          <li key={i} className="text-sm">
            <span className="text-brand-warn">[{o.severity.toUpperCase()}]</span> {o.objection}{" "}
            <span className="text-xs text-slate-500">— {o.raised_by}</span>
          </li>
        ))}
      </Section>

      <Section title="JTBD patterns" empty={!row.jtbd_patterns}>
        {row.jtbd_patterns && (
          <div className="grid grid-cols-2 gap-3 text-sm">
            <QuadrantList label="Push" items={row.jtbd_patterns.push} />
            <QuadrantList label="Pull" items={row.jtbd_patterns.pull} />
            <QuadrantList label="Anxiety" items={row.jtbd_patterns.anxiety} />
            <QuadrantList label="Habit" items={row.jtbd_patterns.habit} />
          </div>
        )}
      </Section>

      <Section title="Classification evidence" empty={!row.classification_evidence?.length}>
        {row.classification_evidence?.map((e, i) => (
          <li key={i} className="text-sm"><b>{e.claim}</b> — <span className="italic text-slate-300">"{e.quote_or_pattern}"</span></li>
        ))}
      </Section>

      <Section title="Buyer language" empty={!row.buyer_language?.length}>
        {row.buyer_language?.map((p, i) => (
          <li key={i} className="text-sm">
            <span className="italic">"{p.phrase}"</span>
            <span className="text-xs text-slate-500"> → {p.use_case} · {p.context}</span>
          </li>
        ))}
      </Section>

      <p className="text-xs font-mono text-slate-600 break-all">
        featherless_model_versions: {JSON.stringify(row.featherless_model_versions)}
      </p>
    </div>
  );
}

function Section({ title, empty, children }: { title: string; empty: boolean; children: React.ReactNode }) {
  return (
    <Card>
      <CardTitle>{title}</CardTitle>
      <div className="mt-3">
        {empty ? <CardDescription>Pending…</CardDescription> : <ul className="space-y-1.5 list-disc list-inside text-slate-200">{children}</ul>}
      </div>
    </Card>
  );
}

function QuadrantList({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <p className="text-xs uppercase text-slate-500">{label}</p>
      <ul className="mt-1 list-disc list-inside">
        {items.length === 0 && <li className="text-slate-500">—</li>}
        {items.map((it, i) => <li key={i}>{it}</li>)}
      </ul>
    </div>
  );
}
