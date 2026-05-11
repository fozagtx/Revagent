---
id: winloss-auditor
name: winloss-auditor
priority: 3
dependencies: [infra-foundation]
estimated_hours: 8
tags: [agent, featherless, async, pipeline, pdf, email, backend]
---

## Objective

Ship Agent 3 — drop a transcript + "lost" label → 90s later receive a PDF digest by email with 4 sections populated (objections, JTBD patterns, win-loss classification, verbatim buyer language).

## Context

PRD §4 Agent 3, §10.4 Featherless integration, §11 Day 4 deliverable. The async 4-stage pipeline with checkpointing is the agentic-dimension proof per PRD §18. Demo moment 2:10–2:50.

## Implementation

1. **Entry points** (`apps/api/src/routes/audit/`)
   - `POST /api/audit/webhook` — HMAC-signed external trigger, schema `{deal_id, outcome, transcript_url}`
   - `POST /api/audit/manual` — multipart upload (transcript file + outcome label) for demo path
2. **Postgres-backed job queue** (`apps/api/src/lib/queue.ts`)
   - Table `audit_jobs` (add migration `0002_audit_jobs.sql` — owns this, infra owns 0001)
   - Worker polls every 2s, claims with `SELECT ... FOR UPDATE SKIP LOCKED`
   - Per-stage checkpoint column so retries resume mid-pipeline (PRD §4 Agent 3)
3. **4-stage Featherless pipeline** (`apps/api/src/lib/audit-pipeline.ts`)
   - Stage 1: **Objection Extractor** — long-context (≥32K) Featherless model, extract `[{objection, raised_by, ts}]`
   - Stage 2: **JTBD Pattern Detector** — 7B–13B instruction-tuned, structured `{push, pull, anxiety, habit, pattern_match}`
   - Stage 3: **Win-Loss Classifier** — Mistral-7B family, fast inference, output `matches_won|matches_lost|novel` with cited evidence
   - Stage 4: **Voice Extractor** — quote-extraction model, output `[{phrase, context, use_case}]`
   - All via Featherless OpenAI-compatible endpoint
   - Persist model IDs to `audits.featherless_model_versions` (trace per PRD §10.4)
4. **Model selection helper** (`apps/api/src/lib/featherless-models.ts`)
   - Constants for chosen Featherless model IDs (PRD §16 Q2 deadline: Day 1 morning post-kickoff)
   - One smoke-test script `scripts/featherless-smoke.ts` that hits all 4 with a fixture
5. **Digest generator** (`apps/api/src/lib/digest-pdf.tsx`)
   - `@react-pdf/renderer` component
   - Sections: 3 won patterns / 2 loss patterns / 5 objections to pre-empt / 10 verbatim phrases
   - Output to object storage, store URL on `weekly_digests.pdf_url`
6. **Email delivery** (`apps/api/src/lib/email.ts`)
   - Resend integration, weekly digest scheduled job
   - Open-tracking pixel → `weekly_digests.opened_at`
7. **Viewer UI** (`apps/web/app/audit/`)
   - List of past audits with outcome chip + classification
   - Per-audit detail page with all 4 stage outputs
   - Current week's digest PDF inline

## Acceptance Criteria

- [ ] `POST /api/audit/manual` with fixture transcript → PDF emailed within 90s
- [ ] All 4 stages produce non-empty structured output
- [ ] Killing the worker mid-pipeline → restart resumes from last completed stage
- [ ] `featherless_model_versions` populated on every audit row (trace)
- [ ] PDF renders cleanly (manually open, verify formatting)
- [ ] Weekly digest job triggers on schedule
- [ ] HMAC signature validation rejects malformed webhooks

## Files to Create

- `apps/api/src/routes/audit/index.ts`
- `apps/api/src/routes/audit/webhook.ts`
- `apps/api/src/routes/audit/manual.ts`
- `apps/api/src/lib/queue.ts`
- `apps/api/src/lib/audit-pipeline.ts`
- `apps/api/src/lib/featherless-models.ts`
- `apps/api/src/lib/digest-pdf.tsx`
- `apps/api/src/lib/email.ts`
- `apps/api/src/prompts/audit/{objections,jtbd,classifier,voice}.ts`
- `packages/db/migrations/0002_audit_jobs.sql`
- `apps/web/app/audit/page.tsx`
- `apps/web/app/audit/[id]/page.tsx`
- `apps/web/app/audit/digest/[id]/page.tsx`
- `scripts/featherless-smoke.ts`
- `tests/fixtures/transcripts/` (won + lost samples)

## Integration Points

- **Provides**: `/api/audit/*` endpoints, async pipeline, PDF digests, weekly email
- **Consumes**: DB `audits` + `weekly_digests` schemas, object storage, shared types — from `infra-foundation`
- **Conflicts**:
  - Adds migration `0002_audit_jobs.sql` — infra owns `0001`, no overlap
  - Adds new `audit_jobs` table — coordinate via migration ordering (this is why this task depends on infra-foundation)
