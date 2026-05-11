---
id: infra-foundation
name: infra-foundation
priority: 1
dependencies: []
estimated_hours: 8
tags: [infra, backend, db, deploy]
---

## Objective

Build the backbone — Next.js + Bun/Hono + Drizzle + Postgres + Vultr deploy — that all three agents plug into.

## Context

This is the Day-1 PRD §11 deliverable. Everything else (Pitch Surgeon, Discovery Co-Pilot, Win-Loss Auditor) depends on this skeleton. Per PRD §7 stack table and §8 schema. Must end the day with a live Vultr URL serving "Hello RevAgent" and all 3 sponsor API health checks green.

## Implementation

1. **Repo skeleton**
   - `apps/web/` — Next.js 14 App Router + Tailwind + shadcn/ui
   - `apps/api/` — Bun + Hono entrypoint (`src/index.ts`)
   - `packages/db/` — Drizzle schema + migration runner
   - `packages/shared/` — TypeScript types shared between web/api (Pitch/Call/Audit DTOs)
   - Root `package.json` workspaces, `bun.lockb`
2. **Database** — Drizzle schema for all 5 tables from PRD §8:
   `founders`, `pitch_analyses`, `calls`, `audits`, `weekly_digests`. Include indices. Migration `0001_init.sql`.
3. **Object storage** — `packages/shared/src/storage.ts` with S3-compatible signed-URL helper pointing at Vultr Object Storage.
4. **API surface stubs** — per PRD §9, every route returns `501 Not Implemented` except:
   - `GET /api/health` — liveness
   - `GET /api/health/integrations` — pings Gemini / Speechmatics / Featherless; returns `{gemini: ok|fail, speechmatics: ok|fail, featherless: ok|fail}`
   - `POST /api/auth/login` — accepts email, returns a stub token (single-tenant demo per PRD §5 Non-Goals)
5. **Frontend shell** — `/` landing, `/pitch`, `/call`, `/audit` placeholder pages with nav.
6. **Env** — `.env.example` with `GEMINI_API_KEY`, `SPEECHMATICS_API_KEY`, `FEATHERLESS_API_KEY`, `VULTR_S3_*`, `DATABASE_URL`, `RESEND_API_KEY`.
7. **Deploy** — `vultr.json` manifest, `Dockerfile` for Coolify, `docker-compose.yml` for local dev (Postgres). Per PRD §10.1.
8. **CI** — single GitHub Actions workflow `ci.yml` running `bun install && bun run typecheck && bun run build`.

## Acceptance Criteria

- [ ] `bun install && bun run dev` boots both web (3000) and api (4000) locally
- [ ] `GET /api/health` returns 200 with `{status: "ok", commit_sha, timestamp}`
- [ ] `GET /api/health/integrations` returns JSON with all 3 sponsor probes
- [ ] All 5 Drizzle tables apply cleanly to a fresh Postgres
- [ ] Production URL on Vultr serves the landing page
- [ ] `.env.example` lists every required key
- [ ] No agent business logic — pure scaffold

## Files to Create

- `package.json`, `tsconfig.json`, `bun.lockb`, `.env.example`, `.gitignore`
- `apps/web/**` — Next.js scaffold
- `apps/api/src/index.ts`, `apps/api/src/routes/health.ts`, `apps/api/src/routes/_stubs.ts`
- `packages/db/src/schema.ts`, `packages/db/migrations/0001_init.sql`, `packages/db/src/client.ts`
- `packages/shared/src/types.ts`, `packages/shared/src/storage.ts`
- `Dockerfile`, `docker-compose.yml`, `vultr.json`
- `.github/workflows/ci.yml`
- `README.md` (minimal — full version comes from `docs-and-license`)

## Integration Points

- **Provides**: DB schema, shared types, API gateway, deploy pipeline, object storage helper, env contract
- **Consumes**: Nothing
- **Conflicts**: Avoid touching anything inside `apps/api/src/routes/{pitch,call,audit}/` beyond stubs (owned by the 3 agent subtasks)
