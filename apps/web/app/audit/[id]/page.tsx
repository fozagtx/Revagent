"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeft, Download, AlertCircle } from "lucide-react";
import { Card, CardTitle, CardDescription, CardEyebrow } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/pageHeader";
import { StatusBadge, type StatusTone } from "@/components/ui/statusBadge";
import { Skeleton, SkeletonText } from "@/components/ui/skeleton";
import { authedFetch } from "@/lib/utils";
import type {
  Objection,
  JtbdPatterns,
  BuyerPhrase,
  FeatherlessModelVersions,
} from "@revagent/shared";

interface AuditDetail {
  id: string;
  dealId: string;
  outcome: "won" | "lost";
  classification: string | null;
  classificationEvidence: Array<{ claim: string; quote_or_pattern: string }> | null;
  objections: Objection[] | null;
  jtbdPatterns: JtbdPatterns | null;
  buyerLanguage: BuyerPhrase[] | null;
  featherlessModelVersions: FeatherlessModelVersions | null;
  digestPdfUrl: string | null;
  pipelineCheckpoint: string;
  errorMessage: string | null;
}

const SEVERITY_TONE: Record<Objection["severity"], StatusTone> = {
  high: "error",
  medium: "warning",
  low: "neutral",
};

const TERMINAL_CHECKPOINTS = new Set([
  "complete",
  "done",
  "failed",
  "error",
  "digest_emailed",
]);

export default function AuditDetailPage() {
  const params = useParams<{ id: string }>();
  const [row, setRow] = useState<AuditDetail | null>(null);

  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setInterval> | null = null;

    const fetchOne = async () => {
      try {
        const r = await authedFetch(`/api/audit/${params.id}`);
        if (r.ok && alive) {
          const j = (await r.json()) as AuditDetail;
          setRow(j);
          if (TERMINAL_CHECKPOINTS.has(j.pipelineCheckpoint) && timer) {
            clearInterval(timer);
            timer = null;
          }
        }
      } catch {
        /* retry next tick */
      }
    };

    void fetchOne();
    timer = setInterval(fetchOne, 3000);
    return () => {
      alive = false;
      if (timer) clearInterval(timer);
    };
  }, [params.id]);

  if (!row) return <LoadingState />;

  const outcomeTone: StatusTone = row.outcome === "won" ? "success" : "error";
  const isProcessing = !TERMINAL_CHECKPOINTS.has(row.pipelineCheckpoint);

  return (
    <div className="container-page pt-10 pb-8 md:pt-14 md:pb-12 space-y-8">
      <Link
        href="/audit"
        className="inline-flex items-center gap-1 text-xs font-semibold tracking-ui text-neutral-600 hover:text-navy transition"
      >
        <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
        All audits
      </Link>

      <PageHeader
        eyebrow={
          <span className="inline-flex items-center gap-2 flex-wrap">
            <StatusBadge tone={outcomeTone}>
              {row.outcome.toUpperCase()}
            </StatusBadge>
            <span className="text-neutral-400">·</span>
            {isProcessing ? (
              <StatusBadge tone="pending" pulse>
                checkpoint {row.pipelineCheckpoint}
              </StatusBadge>
            ) : (
              <span className="font-mono text-neutral-500">
                checkpoint {row.pipelineCheckpoint}
              </span>
            )}
            {row.classification && (
              <>
                <span className="text-neutral-400">·</span>
                <span className="font-mono text-neutral-500">
                  {row.classification}
                </span>
              </>
            )}
          </span>
        }
        title={row.dealId}
        actions={
          row.digestPdfUrl ? (
            <a
              href={row.digestPdfUrl}
              target="_blank"
              rel="noreferrer"
              className="btn-cta inline-flex h-11 items-center gap-2 rounded-2xl px-5 text-sm font-semibold tracking-ui transition"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Download PDF
            </a>
          ) : null
        }
      />

      {row.errorMessage && (
        <Card
          variant="white"
          role="alert"
          className="rise-in border-l-4 border-l-error flex items-start gap-3"
        >
          <AlertCircle className="h-5 w-5 shrink-0 text-error mt-0.5" aria-hidden="true" />
          <div>
            <CardTitle as="h3" className="text-error">
              Pipeline error
            </CardTitle>
            <CardDescription className="mt-1">{row.errorMessage}</CardDescription>
          </div>
        </Card>
      )}

      <Section
        title="Objections"
        empty={!row.objections?.length}
        processing={isProcessing}
      >
        <ul className="space-y-2.5">
          {row.objections?.map((o, i) => (
            <li
              key={i}
              className="rise-in flex items-baseline gap-3 text-sm"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <StatusBadge tone={SEVERITY_TONE[o.severity]} className="shrink-0">
                {o.severity}
              </StatusBadge>
              <div className="min-w-0">
                <p className="text-navy leading-snug">{o.objection}</p>
                <p className="mt-0.5 text-xs text-neutral-500">- {o.raised_by}</p>
              </div>
            </li>
          ))}
        </ul>
      </Section>

      <Section
        title="JTBD patterns"
        empty={!row.jtbdPatterns}
        processing={isProcessing}
      >
        {row.jtbdPatterns && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <QuadrantList
              label="Push"
              dot="bg-red-500"
              items={row.jtbdPatterns.push}
            />
            <QuadrantList
              label="Pull"
              dot="bg-success"
              items={row.jtbdPatterns.pull}
            />
            <QuadrantList
              label="Anxiety"
              dot="bg-amber-600"
              items={row.jtbdPatterns.anxiety}
            />
            <QuadrantList
              label="Habit"
              dot="bg-blue-500"
              items={row.jtbdPatterns.habit}
            />
          </div>
        )}
      </Section>

      <Section
        title="Classification evidence"
        empty={!row.classificationEvidence?.length}
        processing={isProcessing}
      >
        <ul className="space-y-3">
          {row.classificationEvidence?.map((e, i) => (
            <li
              key={i}
              className="rise-in text-sm"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <p className="font-semibold text-navy">{e.claim}</p>
              <p className="mt-1 italic text-neutral-700 leading-relaxed">
                &ldquo;{e.quote_or_pattern}&rdquo;
              </p>
            </li>
          ))}
        </ul>
      </Section>

      <Section
        title="Buyer language (verbatim)"
        empty={!row.buyerLanguage?.length}
        processing={isProcessing}
      >
        <ul className="space-y-3">
          {row.buyerLanguage?.map((p, i) => (
            <li
              key={i}
              className="rise-in text-sm"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <p className="italic text-navy leading-snug">
                &ldquo;{p.phrase}&rdquo;
              </p>
              <p className="mt-0.5 text-xs text-neutral-500">
                → {p.use_case} · {p.context}
              </p>
            </li>
          ))}
        </ul>
      </Section>

      {row.featherlessModelVersions && (
        <details className="rounded-xl border border-[rgba(189,215,255,0.5)] bg-white/40 px-4 py-3">
          <summary className="cursor-pointer text-xs font-mono uppercase tracking-wider text-neutral-500 hover:text-navy transition">
            Model versions
          </summary>
          <pre className="mt-3 max-w-full overflow-x-auto whitespace-pre-wrap break-all font-mono text-[11px] text-neutral-600">
            {JSON.stringify(row.featherlessModelVersions, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}

function Section({
  title,
  empty,
  processing,
  children,
}: {
  title: string;
  empty: boolean;
  processing: boolean;
  children: React.ReactNode;
}) {
  return (
    <Card className="rise-in">
      <div className="flex items-center justify-between">
        <CardTitle as="h2">{title}</CardTitle>
        {empty && processing && (
          <StatusBadge tone="pending" pulse>
            processing
          </StatusBadge>
        )}
      </div>
      <div className="mt-4">
        {empty ? (
          processing ? (
            <SkeletonText lines={3} />
          ) : (
            <CardDescription>No data extracted for this section.</CardDescription>
          )
        ) : (
          children
        )}
      </div>
    </Card>
  );
}

function QuadrantList({
  label,
  dot,
  items,
}: {
  label: string;
  dot: string;
  items: string[];
}) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${dot}`} aria-hidden="true" />
        <CardEyebrow>{label}</CardEyebrow>
      </div>
      {items.length === 0 ? (
        <p className="mt-2 text-xs italic text-neutral-500">No signals.</p>
      ) : (
        <ul className="mt-2 space-y-1.5 text-sm text-navy">
          {items.map((it, i) => (
            <li
              key={i}
              className="leading-snug pl-3 border-l-2 border-l-[rgba(189,215,255,0.7)]"
            >
              {it}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="container-page pt-10 pb-8 md:pt-14 md:pb-12 space-y-8">
      <Skeleton className="h-3 w-24" />
      <div className="space-y-3">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-9 w-72" />
      </div>
      {[0, 1, 2].map((i) => (
        <Card key={i}>
          <Skeleton className="h-4 w-32" />
          <div className="mt-4">
            <SkeletonText lines={3} />
          </div>
        </Card>
      ))}
    </div>
  );
}
