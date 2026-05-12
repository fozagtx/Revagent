# RevAgent — Progress Handoff

> Snapshot for the next session to resume cleanly. Source of truth is the code in `apps/` and `packages/`; this doc tells you where to look and what is real vs. stubbed.

**Target:** AI Agent Olympics @ Milan AI Week 2026 · submission deadline **2026-05-19 15:00 GMT** · on-stage demo **2026-05-20**.

**Branch:** `main` · local-only repo (no `origin` remote yet).

---

## Current state

✅ **Repo scaffolded, end-to-end stack boots.** Web (Next 14) and API (Bun/Hono) both serve HTTP 200 against a local Postgres + MinIO via `docker compose`. Schema applied. Charms design system applied to all pages.

⚠️ **No real sponsor API keys yet** — `.env` currently has `ci-stub` values. Pitch/Call/Audit flows will fail at the LLM step until keys are dropped in.

❌ **Not deployed** to Vultr yet. Local-only repo (no `git remote`).

---

## Commits (most recent first)

```
264d2c2  Apply Charms design system to frontend
68691d6  Build RevAgent MVP — infra + 3 agents + docs
9d19a22  Add parallel development plan for RevAgent MVP
3bbff45  Initial commit: RevAgent PRD
```

---

## Running services

Started locally during the last session. May still be up; restart commands below if not.

| Service | Port | Container / Process | Notes |
|---|---|---|---|
| Postgres 16 | 5432 | `agent-db-1` (docker) | 6 tables + 3 enums applied from `packages/db/migrations/0001_init.sql` |
| MinIO (S3) | 9000 (api), 9001 (console) | `agent-minio-1` (docker) | Console login: `revagent` / `revagent-secret`. **Bucket `revagent` not created yet** — make it via console before any upload flow |
| API (Bun/Hono) | 4000 | `bun run --cwd apps/api dev` | Background process. Health: `curl :4000/api/health/integrations` |
| Web (Next.js) | 3000 | `bun run --cwd apps/web dev` | Open http://localhost:3000 |

### How to restart from cold

```bash
cd /Users/kaizen/Desktop/agent

# 1. Docker stack
docker compose up -d
until docker exec agent-db-1 pg_isready -U revagent > /dev/null; do sleep 1; done

# 2. Schema (idempotent only if you check first — drop & re-apply for a clean slate)
docker exec -i agent-db-1 psql -U revagent -d revagent < packages/db/migrations/0001_init.sql

# 3. Both servers
bun run --cwd apps/api dev &
bun run --cwd apps/web dev &
```

### How to kill cleanly

```bash
lsof -ti:3000,4000 | xargs kill -9
docker compose down
```

---

## What's implemented (and how to verify)

### Pitch Surgeon — `/pitch`

- **Code paths:** `apps/api/src/routes/pitch.ts` → `apps/api/src/lib/pitch/{orchestrator,deck-extract,gemini-council,narrate}.ts`
- **Prompt:** `apps/api/src/prompts/pitch-council.ts` (Klaff / Hormozi / Schwartz 3-persona council, structured-output schema)
- **UI:** `apps/web/app/pitch/page.tsx` (upload) + `apps/web/app/pitch/[id]/page.tsx` (viewer)
- **Verify (needs GEMINI_API_KEY + libreoffice + poppler on host):** drop a .pptx at `/pitch` → poll for `status: complete` → 3 scores + rewrites + narration URL visible
- **Sponsor trace:** `pitch_analyses.gemini_request_id`

### Discovery Co-Pilot — `/call`

- **Code paths:** `apps/api/src/routes/call.ts` + `apps/api/src/lib/call/{ws,speechmatics,jtbd-decoder,nudge,finalize}.ts`
- **Prompts:** `apps/api/src/prompts/jtbd-probes.ts` (probe library), JTBD decode prompt inlined in `jtbd-decoder.ts`
- **UI:** `apps/web/app/call/page.tsx` (start) + `apps/web/app/call/[id]/page.tsx` (live + summary) + `apps/web/app/call/[id]/_lib/recorder.ts` (PCM s16le @16kHz)
- **Verify (needs SPEECHMATICS_API_KEY + GEMINI_API_KEY + browser mic permission):** click Start → speak → switch chart populates → End → 3 follow-ups shown
- **Sponsor trace:** `calls.speechmatics_session_id`

### Win-Loss Auditor — `/audit`

- **Code paths:** `apps/api/src/routes/audit.ts` + `apps/api/src/lib/audit/{queue,worker,pipeline,featherless,digest-pdf,email}.ts`
- **Prompts:** `apps/api/src/prompts/audit/{objections,jtbd,classifier,voice}.ts`
- **UI:** `apps/web/app/audit/page.tsx` (list + manual upload) + `apps/web/app/audit/[id]/page.tsx` (detail)
- **Queue:** Postgres `audit_jobs` table with `SELECT ... FOR UPDATE SKIP LOCKED`; worker started in `apps/api/src/index.ts` via `startAuditWorker()`. Per-stage checkpointing via `audits.pipeline_checkpoint`.
- **Verify (needs FEATHERLESS_API_KEY + RESEND_API_KEY + bucket):** POST a transcript to `/api/audit/manual` (or paste `tests/fixtures/transcripts/sample-lost-deal.txt` via UI) → worker runs 4 stages → PDF appears in `audits.digest_pdf_url` → email sent
- **Sponsor trace:** `audits.featherless_model_versions` (populated per stage)

### Infra

- **Monorepo:** Bun workspaces (`apps/*`, `packages/*`). `package.json` workspaces, `tsconfig.base.json` paths, `bun.lockb` checked in by Bun.
- **DB:** Drizzle ORM, schema in `packages/db/src/schema.ts`, generated SQL in `packages/db/migrations/0001_init.sql`. Drizzle config: `packages/db/drizzle.config.ts`.
- **Storage:** S3 helpers in `packages/shared/src/storage.ts` (presign GET/PUT, signed URL upload). MinIO locally, Vultr Object Storage in prod.
- **Auth:** Single-tenant demo via `x-founder-id` header (frontend uses `DEMO_FOUNDER_ID = "00000000-0000-..."`). HMAC token in `apps/api/src/lib/auth.ts` for webhooks.
- **Health:** `GET /api/health/integrations` probes Gemini/Speechmatics/Featherless/Vultr; returns `ok | fail | skip`.
- **Deploy:** `Dockerfile` (multi-stage, installs libreoffice + poppler), `docker-compose.yml` (local Postgres + MinIO), `vultr.json` (Coolify manifest). CI: `.github/workflows/ci.yml` (typecheck + build).

### Design — Charms system applied

- **Fonts:** Instrument Sans, Instrument Serif, Space Mono via `next/font/google` (`apps/web/app/layout.tsx`)
- **Palette + tokens:** `apps/web/tailwind.config.ts` (navy + blue + neumorphic neutrals, sky/cta gradients, neu-card shadow)
- **Utilities:** `apps/web/app/globals.css` (`.frosted`, `.neu`, `.btn-cta`, ambient orbs)
- **Components:** `apps/web/components/ui/{button,card}.tsx` (variants: primary CTA gradient, white, ghost, danger; card variants: neu, white, hero)

---

## Known issues / gotchas

| # | Issue | Where | Fix |
|---|---|---|---|
| 1 | `.env` symlinked into `apps/api/` and `apps/web/` because Bun reads from cwd | `apps/api/.env`, `apps/web/.env.local` are symlinks to `../../.env` | Don't break the symlinks. If you move to a new machine: `ln -sf ../../.env apps/api/.env && ln -sf ../../.env apps/web/.env.local` |
| 2 | `drizzle-orm` and `postgres` had to be re-declared in `apps/api/package.json` | Bun workspace transitive resolution didn't pick them up via `@revagent/db` | Already fixed in 264d2c2. If you add more transitively-resolved packages to `packages/db`, mirror them in `apps/api` |
| 3 | `apps/web/tsconfig.json` was auto-edited by Next (added `allowJs: true`) | First `next dev` run reconfigured it | Leave it — it's expected. |
| 4 | MinIO bucket `revagent` doesn't exist yet | Configured in `.env` as `VULTR_S3_BUCKET=revagent` | Create via console http://localhost:9001 OR run `docker exec agent-minio-1 mc mb local/revagent` after configuring mc alias |
| 5 | Featherless probe returns `ok` even with stub key | `apps/api/src/routes/health.ts` `probeFeatherless` — `/v1/models` is unauthenticated | Harmless; will return correctly with a real key. Don't rely on the probe to detect missing keys. |
| 6 | Two untracked files at repo root: `Agents.md`, `plan.md` | Pre-existed before the build session | Not touched. User may want them; do not delete. They're excluded from all my commits via explicit pathspec excludes. |
| 7 | Featherless model defaults are guesses | `.env` `FEATHERLESS_MODEL_*` | Run `bun run scripts/featherless-smoke.ts` once you have a real key — switch out any that fail JSON parsing |
| 8 | Demo founder row doesn't exist by default | UI sends `x-founder-id: 00000000-...` | Run `bun run scripts/seed-demo.ts` to insert it + sample audits |
| 9 | `audit_jobs` table is in `0001_init.sql` even though PRD owns it under winloss-auditor | Done for simpler single-migration apply | Don't add a `0002`; if you regenerate via `drizzle-kit generate`, verify the output matches `0001_init.sql` |
| 10 | TTS narration has a silent-mp3 fallback if Gemini TTS fails | `apps/api/src/lib/pitch/narrate.ts` | Intentional — pipeline doesn't block on audio. Real audio appears when key works. |

---

## Next steps (priority order)

### 🔴 Critical (blocks submission)

1. **Real API keys in `.env`** — Gemini, Speechmatics, Featherless. Without these, nothing actually runs end-to-end.
2. **Create MinIO bucket `revagent`** locally; create Vultr Object Storage bucket in prod.
3. **Featherless model smoke test** — `bun run scripts/featherless-smoke.ts`. Swap out any model ID that fails JSON.
4. **Seed demo founder + sample audits** — `bun run scripts/seed-demo.ts`.
5. **End-to-end smoke** — drop a real `.pptx` at `/pitch`, start a `/call` (speak 2 min), upload a transcript at `/audit`. Capture the sponsor trace IDs (gemini_request_id, speechmatics_session_id, featherless_model_versions). Paste them into `docs/SPONSOR_TRACE.md`.
6. **Vultr deploy** — provision VM, install Coolify, set env, push image, point DNS. See `vultr.json` + `Dockerfile`.

### 🟡 Important

7. **GitHub remote** — `git remote add origin git@github.com:<user>/revagent.git && git push -u origin main`. Repo must be public for MIT eligibility.
8. **Demo video** — 3-min OBS recording per `docs/DEMO_SCRIPT.md`. Upload unlisted to YouTube + Loom backup.
9. **10-slide PDF** — outline in `docs/SUBMISSION.md`. Build in Keynote/Figma → export PDF → drop at `docs/demo/slides.pdf`.
10. **Cover image** — execute brief in `docs/COVER_BRIEF.md` → 1920×1080 PNG → `docs/demo/cover.png`.
11. **lablab.ai submission form** — use `docs/SUBMISSION.md` verbatim. Submit before **2026-05-19 15:00 GMT**.

### 🟢 Nice to have

12. Hot-standby Vultr VM with DB replica (per risk #4 in `docs/RISK_REGISTER.md`).
13. Pre-render demo digest PDFs as static assets (risk #7 mitigation).
14. Pre-record a 2-min call audio as Speechmatics WS fallback (risk #1).

---

## Key files for fast navigation

```
context.md                              — full PRD
README.md                               — public-facing intro
docs/SPONSOR_TRACE.md                   — eligibility proof per sponsor
docs/DEMO_SCRIPT.md                     — 3-min on-stage script
docs/SUBMISSION.md                      — lablab.ai form text
docs/RISK_REGISTER.md                   — risk table + checklist
docs/COVER_BRIEF.md                     — cover image spec

apps/api/src/index.ts                   — server entry, WS upgrade, worker boot
apps/api/src/lib/env.ts                 — env schema + validation
apps/api/src/lib/auth.ts                — demo auth + webhook HMAC
apps/api/src/lib/pitch/orchestrator.ts  — pitch pipeline
apps/api/src/lib/call/ws.ts             — call WS + Speechmatics relay
apps/api/src/lib/audit/worker.ts        — async queue worker
apps/api/src/lib/audit/pipeline.ts      — 4-stage Featherless pipeline

apps/web/app/layout.tsx                 — root layout, font loading, header
apps/web/app/page.tsx                   — landing
apps/web/tailwind.config.ts             — design tokens
apps/web/app/globals.css                — utility classes (.frosted, .neu, .btn-cta)

packages/db/src/schema.ts               — Drizzle schema (source of truth)
packages/db/migrations/0001_init.sql    — SQL applied to local DB
packages/shared/src/types.ts            — Zod DTOs shared web ↔ api
packages/shared/src/storage.ts          — S3 helpers

scripts/seed-demo.ts                    — seed demo founder + sample audits
scripts/featherless-smoke.ts            — Day-1 model smoke test
.claude-workspace/PARALLEL_PLAN.md      — the (now-completed) parallel build plan
```

---

## Style preferences captured during the session

- User wants action, not planning chatter. Skip the day-by-day commentary.
- Don't ask permission for each step inside a multi-step task — execute, then report.
- Don't sleep / poll unnecessarily; use `until <check>; do sleep N; done` or background tasks.
- Don't claim "production-ready" or use marketing language. State plainly what works, what's stubbed.
- Two pre-existing files at root (`Agents.md`, `plan.md`) are NOT from this session — leave them alone.

---

## How to resume

If you're a new Claude session reading this:

1. Read `context.md` (the PRD) and this file.
2. Run the **"How to restart from cold"** block above to bring the stack up.
3. Hit http://localhost:3000 — confirm Charms design loads.
4. Check the **Next steps** list — the lowest-numbered unchecked item is what to do next.
5. The user's communication style: terse instructions, sometimes typo-heavy ("rtead the cintext md"). They want execution, not clarifying questions. If something is genuinely ambiguous, pick a reasonable default and proceed; mention the assumption briefly.
