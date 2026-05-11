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

const SEVERITY_TONE: Record<Objection["severity"], string> = {
  high: "text-error",
  medium: "text-amber-700",
  low: "text-neutral-600",
};

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

  if (!row) return <p className="text-neutral-600">Loading…</p>;

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wider">
            <span className={row.outcome === "won" ? "text-success" : "text-error"}>
              ● {row.outcome.toUpperCase()}
            </span>{" "}
            <span className="text-neutral-500">· checkpoint {row.pipeline_checkpoint}</span>
            {row.classification && <span className="text-neutral-500"> · {row.classification}</span>}
          </p>
          <h1 className="mt-1 font-serif text-3xl text-navy">{row.deal_id}</h1>
        </div>
        {row.digest_pdf_url && (
          <a
            href={row.digest_pdf_url}
            target="_blank"
            rel="noreferrer"
            className="btn-cta rounded-2xl h-11 px-6 inline-flex items-center font-semibold text-sm tracking-ui transition"
          >
            Download PDF
          </a>
        )}
      </header>

      {row.error_message && (
        <Card variant="white" className="border-l-4 border-l-error">
          <CardTitle className="text-error">Pipeline error</CardTitle>
          <CardDescription className="mt-2">{row.error_message}</CardDescription>
        </Card>
      )}

      <Section title="Objections" empty={!row.objections?.length}>
        {row.objections?.map((o, i) => (
          <li key={i} className="text-sm">
            <span className={`font-mono text-[10px] uppercase tracking-wider mr-2 ${SEVERITY_TONE[o.severity]}`}>
              [{o.severity}]
            </span>
            <span className="text-navy">{o.objection}</span>{" "}
            <span className="text-xs text-neutral-500">— {o.raised_by}</span>
          </li>
        ))}
      </Section>

      <Section title="JTBD patterns" empty={!row.jtbd_patterns}>
        {row.jtbd_patterns && (
          <div className="grid grid-cols-2 gap-5 text-sm">
            <QuadrantList label="Push" items={row.jtbd_patterns.push} />
            <QuadrantList label="Pull" items={row.jtbd_patterns.pull} />
            <QuadrantList label="Anxiety" items={row.jtbd_patterns.anxiety} />
            <QuadrantList label="Habit" items={row.jtbd_patterns.habit} />
          </div>
        )}
      </Section>

      <Section title="Classification evidence" empty={!row.classification_evidence?.length}>
        {row.classification_evidence?.map((e, i) => (
          <li key={i} className="text-sm text-navy">
            <b className="text-navy">{e.claim}</b>{" "}
            — <span className="italic text-neutral-700">"{e.quote_or_pattern}"</span>
          </li>
        ))}
      </Section>

      <Section title="Buyer language (verbatim)" empty={!row.buyer_language?.length}>
        {row.buyer_language?.map((p, i) => (
          <li key={i} className="text-sm">
            <span className="italic text-navy">"{p.phrase}"</span>
            <span className="text-xs text-neutral-500"> → {p.use_case} · {p.context}</span>
          </li>
        ))}
      </Section>

      <p className="text-xs font-mono text-neutral-500 break-all">
        featherless_model_versions: {JSON.stringify(row.featherless_model_versions)}
      </p>
    </div>
  );
}

function Section({ title, empty, children }: { title: string; empty: boolean; children: React.ReactNode }) {
  return (
    <Card>
      <CardTitle>{title}</CardTitle>
      <div className="mt-4">
        {empty ? <CardDescription>Pending…</CardDescription> : (
          <ul className="space-y-2 list-disc list-inside text-navy">{children}</ul>
        )}
      </div>
    </Card>
  );
}

function QuadrantList({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-wider text-blue-700">{label}</p>
      <ul className="mt-2 list-disc list-inside text-navy space-y-1">
        {items.length === 0 && <li className="text-neutral-500">—</li>}
        {items.map((it, i) => <li key={i}>{it}</li>)}
      </ul>
    </div>
  );
}
