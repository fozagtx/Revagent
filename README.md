# RevAgent

> Sales intelligence for early-stage founders. 3 AI agents that fix every founder's pitch, discovery, and win-loss workflow.

Built for **AI Agent Olympics @ Milan AI Week 2026**. Released under MIT.

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

## The three agents

| Agent | Trigger | Powered by | Output |
|---|---|---|---|
| **Pitch Surgeon** | Upload `.pptx` / `.pdf` deck | Gemini 3 Pro (multimodal) | 3 scores · weakest-slide rewrite · 30-sec narrated pitch |
| **Discovery Co-Pilot** | Start a live call from the browser | Speechmatics RT (diarized) + Gemini Flash | Live JTBD switch chart · mid-call nudges · 3 follow-ups |
| **Win-Loss Auditor** | Drop transcript + outcome label | Featherless (4 specialized OSS models) | PDF digest emailed via Resend — objections, patterns, classification, verbatim language |

Each agent uses what the sponsor stack is actually best at. No costume integrations.

---

## Architecture

```
              ┌────────────────────────────────────┐
              │ Next.js 14 (web)                   │
              └──────────┬─────────────────┬───────┘
                         │ HTTP/WS         │
              ┌──────────▼─────────────────▼───────┐
              │ Bun + Hono (api) on Vultr VM       │
              │ /api/pitch  /api/call  /api/audit  │
              └──┬─────────────┬────────────┬──────┘
                 │             │            │
           Gemini 3 Pro   Speechmatics  Featherless
                 │             │            │
                 └─────────────┼────────────┘
                               ▼
              Postgres (Vultr Managed) + Object Storage
```

Single Vultr VM via Coolify. All data lands in Postgres + Vultr Object Storage. Featherless runs the async pipeline. MIT-licensed end-to-end.

---

## Sponsor trace

Every external API call persists its identifier so the judging trail is auditable.

| Sponsor | What it powers | DB column / file | Eligibility proof |
|---|---|---|---|
| **Vultr** | VM host, Postgres, Object Storage, Serverless Inference fallback | `vultr.json`, all deployed endpoints | All API endpoints serve from a Vultr IP; `vultr.json` in repo root |
| **Gemini** | Multimodal deck reasoning + structured-output rewrites + live JTBD decoding + follow-up generation | `pitch_analyses.gemini_request_id` | Network tab shows `generativelanguage.googleapis.com`; request IDs in UI footer |
| **Speechmatics** | Real-time WebSocket diarized transcription | `calls.speechmatics_session_id` | Network tab shows `wss://eu.rt.speechmatics.com`; session IDs in UI footer |
| **Featherless** | 4-stage async pipeline: objection / JTBD / classifier / voice | `audits.featherless_model_versions` | Model IDs persisted per audit; MIT `LICENSE` in repo root |

Full trace details: [`docs/SPONSOR_TRACE.md`](docs/SPONSOR_TRACE.md).

---

## Local dev

Requirements: Bun ≥ 1.1.34, Docker (for Postgres + MinIO), LibreOffice + poppler-utils on the host (for deck extraction).

```bash
# 1. Bring up Postgres + S3-compatible object storage
docker compose up -d

# 2. Install workspaces
bun install

# 3. Apply migrations
bun run db:push

# 4. Start both web (3000) and api (4000)
cp .env.example .env   # fill in real keys
bun run dev
```

Health checks:
- `GET http://localhost:4000/api/health`
- `GET http://localhost:4000/api/health/integrations` → reports per-sponsor probe results

---

## Deploy (Vultr + Coolify)

1. Provision a Vultr VM (Premium Intel, 8GB RAM minimum).
2. Install Coolify on the VM.
3. Point Coolify at this repo. Coolify reads the `Dockerfile` and `vultr.json`.
4. Provision a Vultr Managed Postgres and a Vultr Object Storage bucket.
5. Set the env vars from `.env.example` in the Coolify UI.
6. Deploy. Health check: `/api/health` returns 200.

---

## Repo layout

```
apps/
  web/                Next.js 14 frontend (App Router, Tailwind, shadcn-style components)
  api/                Bun + Hono API gateway + WebSocket relay + background worker
    src/lib/pitch/    Deck extraction, Gemini council, narration orchestrator
    src/lib/call/     Speechmatics relay, JTBD decoder, nudge engine
    src/lib/audit/    Featherless pipeline, Postgres-backed queue, PDF digest, Resend email
    src/prompts/      Per-agent system prompts
packages/
  db/                 Drizzle schema + migrations
  shared/             Zod-validated DTOs, S3 helpers
docs/                 Sponsor trace, demo script, submission text, risk register
.claude-workspace/    Parallel development plan
```

---

## Documents

- [`context.md`](context.md) — full PRD
- [`docs/SPONSOR_TRACE.md`](docs/SPONSOR_TRACE.md) — sponsor eligibility proof
- [`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md) — 3-minute on-stage script
- [`docs/SUBMISSION.md`](docs/SUBMISSION.md) — lablab.ai submission text
- [`docs/RISK_REGISTER.md`](docs/RISK_REGISTER.md) — risks + mitigations
- [`docs/COVER_BRIEF.md`](docs/COVER_BRIEF.md) — cover-image design brief

---

## License

MIT — see [LICENSE](LICENSE).
