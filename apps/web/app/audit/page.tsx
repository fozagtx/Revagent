"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { FileSearch, ArrowRight, Download, FileUp, Inbox, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/pageHeader";
import { StatusBadge, type StatusTone } from "@/components/ui/statusBadge";
import { Field, Input, Select } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/emptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { authedFetch } from "@/lib/utils";
import { useLocalState } from "@/lib/useLocalState";

interface AuditRow {
  id: string;
  dealId: string;
  outcome: "won" | "lost";
  classification: string | null;
  pipelineCheckpoint: string;
  digestPdfUrl: string | null;
  createdAt: string;
}

interface AuditDraft {
  dealId: string;
  outcome: "won" | "lost";
}

const INITIAL_DRAFT: AuditDraft = { dealId: "", outcome: "lost" };

export default function AuditPage() {
  const [audits, setAudits] = useState<AuditRow[] | null>(null);
  const [draft, setDraft, clearDraft] = useLocalState<AuditDraft>(
    "audit:draft",
    INITIAL_DRAFT,
  );
  const dealId = draft.dealId;
  const outcome = draft.outcome;
  const setDealId = (v: string) => setDraft((p) => ({ ...p, dealId: v }));
  const setOutcome = (v: "won" | "lost") =>
    setDraft((p) => ({ ...p, outcome: v }));
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<{
    deal?: string;
    file?: string;
  }>({});
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let alive = true;
    const fetchAudits = async () => {
      try {
        const r = await authedFetch("/api/audit");
        if (r.ok && alive) {
          setAudits(((await r.json()) as { audits: AuditRow[] }).audits);
        } else if (alive && audits === null) {
          setAudits([]);
        }
      } catch {
        if (alive && audits === null) setAudits([]);
      }
    };
    void fetchAudits();
    const t = setInterval(fetchAudits, 4000);
    return () => {
      alive = false;
      clearInterval(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submit() {
    const file = fileRef.current?.files?.[0];
    const errors: typeof fieldError = {};
    if (!dealId.trim()) errors.deal = "Deal ID is required.";
    if (!file) errors.file = "Attach a transcript file.";
    if (Object.keys(errors).length) {
      setFieldError(errors);
      return;
    }
    setFieldError({});
    setSubmitError(null);
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("deal_id", dealId);
      fd.append("outcome", outcome);
      fd.append("transcript", file!);
      const r = await authedFetch("/api/audit/manual", {
        method: "POST",
        body: fd,
      });
      if (!r.ok) throw new Error((await r.text()) || `Submit failed (${r.status})`);
      clearDraft();
      setFileName(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container-page pt-10 pb-8 md:pt-14 md:pb-12 space-y-8">
      <PageHeader
        eyebrow="Featherless · async"
        title="Win-Loss Auditor"
        description="Drop a call transcript with an outcome label. The 4-stage Featherless pipeline extracts objections, JTBD patterns, win-loss classification, and verbatim buyer language. Final PDF digest is emailed when complete."
        actions={
          dealId || fileName ? (
            <button
              type="button"
              onClick={() => {
                clearDraft();
                setFileName(null);
                if (fileRef.current) fileRef.current.value = "";
              }}
              className="inline-flex h-10 items-center gap-1.5 rounded-2xl border border-[rgba(0,37,97,0.08)] bg-white px-4 text-xs font-semibold tracking-ui text-neutral-600 transition hover:bg-blue-100/40 hover:text-navy"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              Clear draft
            </button>
          ) : null
        }
      />

      <Card variant="hero" className="rise-in stagger-1 p-5 sm:p-6 md:p-8 bg-sky">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-neu-card border border-[rgba(189,215,255,0.5)] text-blue-700">
            <FileUp className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 className="font-serif text-lg sm:text-xl text-navy">
              Submit a deal for analysis
            </h2>
            <p className="text-xs text-neutral-600 tracking-ui">
              Provide a deal identifier, outcome, and a transcript file.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Field
            label="Deal ID"
            htmlFor="deal-id"
            required
            error={fieldError.deal}
          >
            <Input
              id="deal-id"
              placeholder="e.g. acme-q3-renewal"
              value={dealId}
              onChange={(e) => setDealId(e.target.value)}
              invalid={!!fieldError.deal}
              disabled={submitting}
            />
            {!fieldError.deal && (
              <p className="mt-1.5 text-xs font-bold text-navy tracking-ui">
                Any string you&apos;ll recognize - company name, CRM id, or a slug. e.g. acme-q3-renewal.
              </p>
            )}
          </Field>
          <Field label="Outcome" htmlFor="outcome">
            <Select
              id="outcome"
              value={outcome}
              onChange={(e) => setOutcome(e.target.value as "won" | "lost")}
              disabled={submitting}
            >
              <option value="lost">Lost</option>
              <option value="won">Won</option>
            </Select>
          </Field>
          <Field
            label="Transcript file"
            htmlFor="transcript"
            required
            hint=".txt, .md, or .json"
            error={fieldError.file}
          >
            <label
              htmlFor="transcript"
              className={`frosted-input flex h-11 cursor-pointer items-center gap-2 rounded-xl px-3.5 text-sm tracking-ui ${
                fileName ? "text-navy" : "text-neutral-500"
              } ${fieldError.file ? "border-error/70" : ""}`}
            >
              <FileUp className="h-4 w-4 text-blue-700" aria-hidden="true" />
              <span className="truncate">
                {fileName ?? "Choose a transcript…"}
              </span>
              <input
                ref={fileRef}
                id="transcript"
                type="file"
                accept=".txt,.md,.json"
                className="sr-only"
                disabled={submitting}
                onChange={(e) =>
                  setFileName(e.target.files?.[0]?.name ?? null)
                }
              />
            </label>
          </Field>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button onClick={submit} loading={submitting} disabled={submitting}>
            {submitting ? "Submitting…" : "Submit for analysis"}
          </Button>
          {submitError && (
            <p className="text-sm text-error" role="alert">
              {submitError}
            </p>
          )}
        </div>
      </Card>

      <section className="space-y-3" aria-label="Recent audits">
        <div className="flex items-baseline justify-between">
          <h3 className="font-mono text-[11px] uppercase tracking-wider text-neutral-500">
            Recent audits
          </h3>
          {audits && audits.length > 0 && (
            <span className="font-mono text-[11px] tabular-nums text-neutral-500">
              {audits.length} total
            </span>
          )}
        </div>

        {audits === null && (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <Card key={i} variant="white">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="mt-2 h-3 w-64" />
              </Card>
            ))}
          </div>
        )}

        {audits && audits.length === 0 && (
          <EmptyState
            icon={<Inbox />}
            title="No audits yet"
            description="Submit a deal above and you'll see the pipeline progress here in real time."
          />
        )}

        {audits && audits.length > 0 && (
          <ul className="space-y-2.5">
            {audits.map((a, i) => (
              <li
                key={a.id}
                className="rise-in"
                style={{ animationDelay: `${Math.min(i, 6) * 40}ms` }}
              >
                <AuditRowCard audit={a} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function AuditRowCard({ audit }: { audit: AuditRow }) {
  const tone: StatusTone = audit.outcome === "won" ? "success" : "error";
  return (
    <Card
      variant="white"
      className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="truncate font-semibold tracking-ui text-navy">
            {audit.dealId}
          </p>
          <StatusBadge tone={tone}>{audit.outcome.toUpperCase()}</StatusBadge>
        </div>
        <p className="mt-1 text-xs text-neutral-600 flex items-center gap-2 flex-wrap">
          <span className="font-mono tracking-wider">
            checkpoint · {audit.pipelineCheckpoint}
          </span>
          {audit.classification && (
            <>
              <span className="text-neutral-400">·</span>
              <span>{audit.classification}</span>
            </>
          )}
          <span className="text-neutral-400">·</span>
          <span className="font-mono tabular-nums">
            {new Date(audit.createdAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })}
          </span>
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {audit.digestPdfUrl && (
          <a
            href={audit.digestPdfUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[rgba(0,37,97,0.08)] bg-white px-3 text-xs font-semibold tracking-ui text-blue-700 transition hover:bg-blue-100/40"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            PDF
          </a>
        )}
        <Link
          href={`/audit/${audit.id}`}
          className="inline-flex h-9 items-center gap-1 rounded-xl bg-blue-150 px-3 text-xs font-semibold tracking-ui text-navy transition hover:bg-blue-200"
        >
          Detail
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>
    </Card>
  );
}
