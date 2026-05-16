# RevAgent

> Sales intelligence for early-stage founders. 3 AI agents that fix every founder's pitch, discovery, and win-loss workflow.

Released under MIT.

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Demo Video](https://img.shields.io/badge/demo-YouTube-red.svg)](https://youtu.be/dha5L_-41WY)
[![Live Demo](https://img.shields.io/badge/live-revagent.vercel.app-black.svg)](https://revagent.vercel.app/)

- **Live demo:** https://revagent.vercel.app/
- **Demo video:** https://youtu.be/dha5L_-41WY
- **Backend (Vultr VM):** https://45-77-55-94.nip.io
- **Health check (public):** https://45-77-55-94.nip.io/api/health/integrations

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
       ┌──────────────────────────────────────────┐
       │ Next.js 14 (web) — Vercel                │
       │ https://revagent.vercel.app              │
       └──────────┬─────────────────┬─────────────┘
                  │ HTTPS           │ WSS
       ┌──────────▼─────────────────▼─────────────┐
       │ Bun + Hono (api) — Vultr VM              │
       │ https://45-77-55-94.nip.io               │
       │ /api/pitch  /api/call  /api/audit        │
       └──┬─────────────┬────────────┬────────────┘
          │             │            │
    Gemini 3 Pro   Speechmatics  Featherless
          │             │            │
          └─────────────┼────────────┘
                        ▼
       Postgres (Vultr Managed) + Vultr Object Storage
```

Frontend deploys to Vercel; backend (API + WebSocket relay + audit worker) runs on a single Vultr VM. All data lands in Vultr Managed Postgres + Vultr Object Storage. Featherless runs the async win-loss pipeline. MIT-licensed end-to-end.

---

## Sponsor trace

Every external API call persists its identifier so the judging trail is auditable.

| Sponsor | What it powers | DB column / file | Eligibility proof |
|---|---|---|---|
| **Vultr** | VM host, Postgres, Object Storage, Serverless Inference fallback | `vultr.json`, all deployed endpoints | All API endpoints serve from a Vultr IP; `vultr.json` in repo root |
| **Gemini** | Multimodal deck reasoning + structured-output rewrites + live JTBD decoding + follow-up generation | `pitch_analyses.gemini_request_id` | Network tab shows `generativelanguage.googleapis.com`; request IDs in UI footer |
| **Speechmatics** | Real-time WebSocket diarized transcription | `calls.speechmatics_session_id` | Network tab shows `wss://eu.rt.speechmatics.com`; session IDs in UI footer |
| **Featherless** | 4-stage async pipeline: objection / JTBD / classifier / voice | `audits.featherless_model_versions` | Model IDs persisted per audit; MIT `LICENSE` in repo root |

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

## Deploy

The current deployment:

- **Backend (Vultr VM):** https://45-77-55-94.nip.io
- **HTTP raw (firewall-allowed):** http://45.77.55.94:4000
- **WebSocket (TLS):** wss://45-77-55-94.nip.io
- **Frontend (Vercel):** https://revagent.vercel.app

Steps to reproduce:

1. Provision a Vultr VM (Premium Intel, 8GB RAM minimum).
2. Provision a Vultr Managed Postgres and a Vultr Object Storage bucket.
3. Build the API container from the repo `Dockerfile` and run it on the VM, exposing ports 3000 (web) / 4000 (api).
4. Set the env vars from `.env.example` on the host.
5. Deploy the Next.js frontend to Vercel and point `NEXT_PUBLIC_API_BASE_URL` at the Vultr backend.
6. Verify: `/api/health` returns 200.

Verify the live backend:

```bash
curl -s https://45-77-55-94.nip.io/api/health
curl -s https://45-77-55-94.nip.io/api/health/integrations
```

---

## Public API endpoints

Base URLs:
- **HTTPS:** `https://45-77-55-94.nip.io`
- **HTTP raw (firewall-allowed):** `http://45.77.55.94:4000`
- **WebSocket (TLS):** `wss://45-77-55-94.nip.io`

### Health (public)

| Method | Path | Auth | Returns |
|---|---|---|---|
| GET | `/api/health` | none | basic ping |
| GET | `/api/health/integrations` | none | Gemini / Speechmatics / Featherless / Vultr S3 probes |

### Auth

| Method | Path | Auth | Body / Returns |
|---|---|---|---|
| POST | `/api/auth/login` | none | `{email, display_name?}` → sets session cookie, returns founder |
| POST | `/api/auth/logout` | none | clears cookie |
| GET | `/api/auth/me` | cookie | current founder |
| GET | `/api/auth/ws-token` | cookie | `{token}` — short-lived signed token for WS URL |

### Pitch Surgeon (cookie)

| Method | Path | Body / Returns |
|---|---|---|
| POST | `/api/pitch` | multipart deck (`.pptx`/`.pdf`) → `{analysis_id}` |
| GET | `/api/pitch` | list of analyses |
| GET | `/api/pitch/:id` | analysis detail |
| GET | `/api/pitch/:id/rewrite/:archetype` | scoped rewrite block |
| GET | `/api/pitch/:id/narration` | 30-sec narrated MP3 URL |

### Discovery Co-Pilot (cookie except WS)

| Method | Path | Body / Returns |
|---|---|---|
| POST | `/api/call/start` | `→ {call_id, ws_url}` |
| POST | `/api/call/:id/end` | finalize, return summary + 3 follow-ups |
| GET | `/api/call` | list of calls |
| GET | `/api/call/:id` | call detail |
| WS | `/api/call/:id/stream?token=...` | binary PCM in / JSON signals out (token via `/api/auth/ws-token`) |

### Win-Loss Auditor (cookie except webhook)

| Method | Path | Auth | Body / Returns |
|---|---|---|---|
| POST | `/api/audit/webhook` | HMAC signature | external system pushes transcripts |
| POST | `/api/audit/manual` | cookie | multipart `deal_id` + outcome + transcript |
| GET | `/api/audit` | cookie | list of audits |
| GET | `/api/audit/:id` | cookie | audit detail (polls during processing) |
| GET | `/api/audit/digest/weekly` | cookie | aggregate digest meta |
| GET | `/api/audit/digest/:id/pdf` | cookie | PDF redirect |

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
```

---

## License

MIT — see [LICENSE](LICENSE).
