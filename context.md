# RevAgent — Product Requirements Document

**Hackathon:** AI Agent Olympics @ Milan AI Week 2026
**Event window:** May 13–20, 2026
**Submission deadline:** May 19, 3:00 PM GMT
**On-site demo:** May 20, Fiera Milano (Rho)
**Prize stack target:** Vultr ($5K+$1K credits) + Google Gemini ($5K) + Speechmatics ($200 credits) + Featherless (credits + Pro plan) = **>$13K eligible**

---

## 1. Executive Summary

RevAgent is a web-based sales-intelligence operating system built for early-stage founders running their own customer-facing motion. It orchestrates three coordinated AI agents that address the three highest-friction moments in early-stage revenue work:

1. **Pitch Surgeon** — multimodal pitch-deck critique with three archetype-specific rewrites
2. **Discovery Co-Pilot** — real-time JTBD switch-interview decoder on live customer calls
3. **Win-Loss Auditor** — async pipeline that extracts patterns from every closed deal

Deployed as a single web application on a Vultr VM, with Gemini 3 Pro handling multimodal document/slide reasoning, Speechmatics powering live streaming transcription with diarization, and Featherless serverless inference running specialized open-source models for the async pipeline. Released under MIT license.

**One codebase, four sponsor prizes, 5/5 challenge dimensions.**

---

## 2. Problem Statement

Early-stage founders spend ~40% of their week on customer-facing motion — pitching investors, running discovery calls, reviewing won/lost deals — but have **zero structured tooling** for any of it.

- They pitch from memory, slides drift from week to week, and they never get structured feedback on frame, offer, or desire-stage alignment.
- They run discovery calls without a JTBD framework live in front of them, and forget half of what they heard within 48 hours.
- They lose deals and never extract the pattern — the same objection kills the next three pipeline opportunities.

Existing solutions (Gong, Clari, Pitch.com, Chorus) are enterprise-priced, built for SDR teams of 20+, and require CRM integration before they produce value. None of them work for a solo founder at the pre-Series-A stage.

The result: weak pitches that don't compound, shallow discovery that misses real switch forces, and zero institutional learning from lost deals.

---

## 3. Target Users

**Primary:** Pre-Series-A founders (team of 1–10) actively running customer discovery and pitching weekly. Specifically, the 25,000+ entrepreneurs, managers, and researchers attending AI Week 2026.

**Secondary:** Solo consultants closing >$10K engagements, agency founders building books of business, indie B2B SaaS founders in the first 12 months of revenue.

**Anti-persona:** SDR managers at 50+ person companies — they should buy Gong.

---

## 4. Solution Overview

### Agent 1: Pitch Surgeon

**Input:** Pitch deck as `.pptx`, `.pdf`, or Google Slides URL.

**Process:** Gemini 3 Pro reads each slide as both image and extracted text. A 3-persona council analyzes the deck through three distinct lenses:

- **Frame-Control Agent** — Oren Klaff's Pitch Anything methodology: status framing, intrigue ping, prizing, hot cognition
- **Grand-Slam-Offer Agent** — Hormozi's value-equation: dream outcome × perceived likelihood ÷ (time delay × effort/sacrifice)
- **Desire-Amplifier Agent** — Eugene Schwartz's awareness stages: unaware → problem-aware → solution-aware → product-aware → most-aware

Each persona scores the deck 1–10 on its lens, identifies the single weakest slide, and proposes a concrete rewrite. The orchestrator then generates three full alternative versions of the deck — one per archetype — and produces a 30-second auto-narrated pitch in the strongest archetype via TTS.

**Output:**
- Annotated deck (PDF) with inline scores per slide
- Three full archetype rewrites
- 30-second narrated pitch audio file
- Slide-by-slide diff view in the dashboard

### Agent 2: Discovery Co-Pilot

**Input:** Live call audio captured from browser microphone or system audio (Zoom/Meet/in-person), streamed to Speechmatics via WebSocket with diarization enabled.

**Process:** Speechmatics streams transcribed + diarized text into a JTBD switch-interview decoder running in real-time. The decoder identifies four signal types as they appear in the transcript:

- **Push** — current solution friction, what's broken about today
- **Pull** — desired outcome, the new state the buyer wants
- **Anxiety** — concerns about switching, what could go wrong
- **Habit** — status-quo inertia, why they haven't switched already

The web UI shows a live "switch chart" with four quadrants that populate as evidence accumulates during the call. A mid-call nudge engine flags when the founder is missing a key signal class after 8+ minutes of conversation (e.g., *"You haven't probed for Habit force — try: 'Walk me through how you handle this today.'"*).

**Output:**
- Diarized full transcript with timestamps
- Structured switch chart (4 quadrants × N evidence quotes each)
- 3 recommended follow-up questions to send post-call
- Confidence scores per quadrant

### Agent 3: Win-Loss Auditor (async)

**Input:** Webhook fires when a deal is marked Won or Lost (configurable: CRM webhook, file-watcher on a transcript folder, or manual upload).

**Process:** Async background pipeline runs four specialized Featherless models in sequence:

1. **Objection Extractor** — surfaces every objection raised across all calls in this deal's history
2. **JTBD Pattern Detector** — maps the buyer's switch forces and compares to prior won/lost deals
3. **Win-Loss Classifier** — labels whether this deal pattern-matches prior wins or losses with cited evidence
4. **Voice Extractor** — captures the buyer's exact verbatim language for reuse in landing pages, cold emails, and future discovery scripts

Pipeline state persists between stages; if any stage fails, the next retry resumes from the last successful checkpoint.

**Output:**
- Weekly digest PDF emailed to the founder summarizing: 3 patterns in won deals, 2 patterns in losses, 5 objections to pre-empt in upcoming discovery calls, 10 verbatim buyer phrases ready for copy
- Per-deal audit record stored for future pattern queries

---

## 5. Goals & Non-Goals

### Goals
- Ship all 3 agents end-to-end by **end of Day 5 (May 17)**
- Achieve eligibility for 4 sponsor prizes
- Hit 5/5 challenge dimensions (Reasoning, Agentic, Enterprise, Multimodal, Collaborative)
- Land the on-stage demo with at least one agent running on live audience input
- Public GitHub repo, MIT license, clean README, public demo URL

### Non-Goals
- No CRM integrations (HubSpot, Salesforce) — use generic webhooks
- No user authentication beyond a single demo account
- No team/multiplayer features
- No SOC2, SSO, enterprise security
- No mobile app
- No multi-language support (English only)
- No Stripe billing
- No Kraken track integration (decided: variance trap, skip)

---

## 6. Success Metrics

### Hackathon (primary)
| Metric | Target |
|---|---|
| Sponsor prizes won | ≥2 of 4 eligible |
| Challenge dimensions hit | 5/5 |
| Demo lands without slide-fallback | 1 |
| GitHub repo stars in week 1 | ≥50 |
| Demo video views | ≥1,000 |

### Product (if continued post-hackathon)
| Metric | Target |
|---|---|
| Founder uses ≥1 agent within 7 days | ≥60% |
| Re-uploaded pitches show score improvement | ≥30% |
| Weekly Win-Loss digest open rate | ≥40% |
| Discovery Co-Pilot calls per founder per week | ≥2 |

---

## 7. Architecture

### Stack Decisions
| Layer | Choice | Rationale |
|---|---|---|
| Frontend | Next.js 14 App Router + Tailwind + shadcn/ui | Fastest path to polished UI, native streaming support |
| Backend | Bun + Hono.js | Tiny runtime, TS-native, fast WebSocket support |
| Database | Postgres on Vultr Managed Databases | Vultr eligibility, JSONB for flexible schemas |
| ORM | Drizzle | Type-safe, lightweight |
| Object storage | Vultr Object Storage (S3 API) | Vultr eligibility, decks + audio + PDFs |
| Real-time | WebSockets (native Bun) | Speechmatics relay + live UI updates |
| LLMs | Gemini 3 Pro (multimodal), Featherless (specialized), Vultr Serverless Inference (TTS fallback) | All four sponsor APIs in the critical path |
| Deployment | Coolify on Vultr VM | Recommended in Vultr's own Claude Code deploy guide |
| Email | Resend | Cheap, reliable, simple API |
| PDF generation | `@react-pdf/renderer` | React-native PDF authoring, matches the UI stack |

### Component Diagram

```
                ┌─────────────────────────────────────────────────┐
                │  Browser (Next.js 14)                            │
                │  - Pitch upload, deck viewer                     │
                │  - Live call interface + switch chart            │
                │  - Audit digest viewer                           │
                └────────────────┬───────────────┬─────────────────┘
                                 │ HTTP/WS       │
                ┌────────────────▼───────────────▼─────────────────┐
                │  Bun + Hono API Gateway  (Vultr VM)              │
                │                                                  │
                │  /api/pitch      ──► Pitch Surgeon orchestrator  │
                │  /api/call/ws    ──► Speechmatics WS relay       │
                │  /api/audit      ──► Featherless async pipeline  │
                └──┬─────────────────┬─────────────────┬───────────┘
                   │                 │                 │
       ┌───────────▼──────┐  ┌───────▼──────┐  ┌──────▼────────┐
       │  Gemini 3 Pro    │  │ Speechmatics │  │  Featherless  │
       │  (multimodal)    │  │ (streaming   │  │  (async, 4    │
       │                  │  │  STT + diar) │  │  specialized  │
       │                  │  │              │  │  models)      │
       └──────────────────┘  └──────────────┘  └───────────────┘
                   │                 │                 │
                   └─────────────────┼─────────────────┘
                                     ▼
                ┌──────────────────────────────────────────────────┐
                │  Postgres (Vultr Managed)  +  Object Storage     │
                │  Tables: founders, pitch_analyses, calls,        │
                │          transcripts, audits, digests            │
                └──────────────────────────────────────────────────┘
```

---

## 8. Data Models

```sql
CREATE TABLE founders (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT UNIQUE NOT NULL,
  display_name TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE pitch_analyses (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id          UUID REFERENCES founders(id) ON DELETE CASCADE,
  deck_filename       TEXT NOT NULL,
  deck_url            TEXT NOT NULL,          -- Vultr Object Storage URL
  num_slides          INT,
  frame_score         INT CHECK (frame_score BETWEEN 1 AND 10),
  offer_score         INT CHECK (offer_score BETWEEN 1 AND 10),
  desire_score        INT CHECK (desire_score BETWEEN 1 AND 10),
  weakest_slide_idx   INT,
  slide_critiques     JSONB NOT NULL,         -- [{idx, frame, offer, desire, notes}]
  rewrites            JSONB,                  -- {frame_control: [...], grand_slam: [...], desire_amp: [...]}
  narration_audio_url TEXT,
  gemini_request_id   TEXT,                   -- for judging trace
  created_at          TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE calls (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id      UUID REFERENCES founders(id) ON DELETE CASCADE,
  started_at      TIMESTAMPTZ NOT NULL,
  ended_at        TIMESTAMPTZ,
  duration_sec    INT,
  transcript      JSONB,                      -- [{speaker, text, ts_start, ts_end}]
  switch_chart    JSONB,                      -- {push: [{quote, ts}], pull: [...], anxiety: [...], habit: [...]}
  follow_ups      TEXT[],
  speechmatics_session_id TEXT,               -- for judging trace
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE audits (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id      UUID REFERENCES founders(id) ON DELETE CASCADE,
  deal_id         TEXT NOT NULL,
  outcome         TEXT CHECK (outcome IN ('won', 'lost')),
  source_call_ids UUID[],
  objections      JSONB,                      -- [{objection, raised_by, ts}]
  jtbd_patterns   JSONB,                      -- {push, pull, anxiety, habit, pattern_match: [...]}
  classification  TEXT,                       -- 'matches_won_pattern' | 'matches_lost_pattern' | 'novel'
  buyer_language  JSONB,                      -- [{phrase, context, use_case}]
  digest_pdf_url  TEXT,
  featherless_model_versions JSONB,           -- {objection_extractor: "...", ...} for trace
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE weekly_digests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id      UUID REFERENCES founders(id) ON DELETE CASCADE,
  week_starting   DATE NOT NULL,
  audit_ids       UUID[],
  pdf_url         TEXT NOT NULL,
  sent_at         TIMESTAMPTZ,
  opened_at       TIMESTAMPTZ
);

CREATE INDEX idx_pitch_founder ON pitch_analyses(founder_id, created_at DESC);
CREATE INDEX idx_calls_founder ON calls(founder_id, started_at DESC);
CREATE INDEX idx_audits_outcome ON audits(founder_id, outcome, created_at DESC);
```

---

## 9. API Surface

```
# Authentication (single-tenant demo)
POST /api/auth/login                      Email-only magic link

# Pitch Surgeon
POST /api/pitch                           Upload deck → returns {analysis_id}
GET  /api/pitch/:id                       Get full analysis result
GET  /api/pitch/:id/rewrite/:archetype    Get specific rewrite (frame|offer|desire)
GET  /api/pitch/:id/narration             Stream/download audio file

# Discovery Co-Pilot
POST /api/call/start                      Returns {call_id, ws_url}
WS   /api/call/:id/stream                 Bidirectional: client→audio chunks, server→signals
POST /api/call/:id/end                    Finalize, persist transcript + switch chart
GET  /api/call/:id                        Get call details + switch chart

# Win-Loss Auditor
POST /api/audit/webhook                   External entry (CRM webhook, transcript drop)
POST /api/audit/manual                    Manual upload (transcript file + outcome label)
GET  /api/audit/:id                       Get audit detail
GET  /api/audit/digest/weekly             Get current week's digest
GET  /api/audit/digest/:id/pdf            Stream digest PDF

# Health / observability
GET  /api/health                          Liveness probe
GET  /api/health/integrations             {gemini: ok, speechmatics: ok, featherless: ok}
```

---

## 10. Sponsor Integration Details

### 10.1 Vultr ($5K + $1K credits)

**System of record.** All founder data, all generated artifacts in Vultr Postgres + Object Storage.

- Single Vultr VM (Premium Intel, 8GB RAM, $40/mo tier — covered by credit)
- Coolify managed deploy per Vultr's own Claude Code deployment guide
- Postgres via Vultr Managed Databases
- Vultr Object Storage (S3-compatible) for all deck files, audio, generated PDFs
- Vultr Serverless Inference for the TTS narration step (fallback path for Gemini TTS)
- API request IDs logged to Postgres for judging trace
- Production demo URL on a Vultr-provisioned subdomain

**Eligibility proof:** `vultr.json` deployment manifest in repo root, screenshots of Vultr console, all API endpoints serving from a Vultr IP.

### 10.2 Google Gemini ($5K)

**Multimodal reasoning core.** Gemini 3 Pro handles all deck analysis.

- Each slide passed as image (PNG, 1024×768 max) + extracted text from PPTX/PDF
- Structured JSON output via Gemini's response schema:
  ```json
  {
    "frame_score": 7,
    "offer_score": 5,
    "desire_score": 6,
    "weakest_slide": 3,
    "slide_critiques": [{ "idx": 0, "frame": "...", "offer": "...", "desire": "..." }],
    "rewrites": { "frame_control": [...], "grand_slam": [...], "desire_amp": [...] }
  }
  ```
- Use Google AI Studio for development, Gemini API for production
- Google Cloud $300 free credits cover dev + demo volume
- Gemini request IDs persisted to Postgres for judging trace

**Eligibility proof:** Network tab during demo shows `generativelanguage.googleapis.com` calls; Gemini request IDs displayed in UI footer.

### 10.3 Speechmatics ($200 credits)

**Live voice layer.** Real-time WebSocket streaming with diarization.

- WebSocket connection from Bun backend → Speechmatics RT API
- Configuration: English Enhanced model, diarization enabled (2-speaker minimum), partials enabled for live UI
- Founder's audio captured via browser MediaRecorder → streamed to Bun → relayed to Speechmatics
- Transcribed text + diarization labels stream back through Bun → frontend WS → JTBD decoder runs on rolling 5-second window
- Use the $200 hackathon coupon redeemed during kickoff stream
- Delete API keys after hackathon to avoid accidental charges

**Eligibility proof:** Speechmatics session IDs persisted to `calls.speechmatics_session_id`; demo video shows the network tab with `wss://eu.rt.speechmatics.com` connection.

### 10.4 Featherless (credits + Pro plan)

**Async open-source specialist layer.** Four domain-specialized models, MIT licensed, async-first.

- Models selected from Featherless catalog (final selection on Day 1 after kickoff):
  - **Objection Extractor:** legal/contract-tuned model with long-context window (≥32K)
  - **JTBD Pattern Detector:** instruction-tuned 7B–13B for structured extraction
  - **Win-Loss Classifier:** smaller, fast inference (Mistral-7B family)
  - **Voice Extractor:** general-purpose with strong quote-extraction capability
- All four called via Featherless OpenAI-compatible endpoint
- Async pipeline: webhook → enqueue → background worker → 4 stages with checkpointing → email digest
- Repo released under MIT license at submission
- $25 credit covers ~1 week of demo-volume async inference

**Eligibility proof:** Featherless model IDs persisted to `audits.featherless_model_versions`; `LICENSE` file with MIT in repo root; async architecture diagram in README.

---

## 11. Build Plan (Day 1 → Day 6)

### Day 1 — May 13 (Wednesday) — Foundation
- Watch hackathon kick-off stream, redeem all sponsor credits live
- Provision Vultr VM, install Coolify, Postgres, Bun
- Next.js scaffold with Tailwind + shadcn/ui
- Drizzle migrations for all 5 tables
- Hello-world API endpoint deployed via Coolify
- Test Gemini, Speechmatics, Featherless API connectivity from VM
- Configure object storage bucket + signed URL helper

**End-of-day deliverable:** Live URL serves "Hello RevAgent" from Vultr; all three sponsor APIs return 200 on health check.

### Day 2 — May 14 (Thursday) — Pitch Surgeon
- Deck upload UI (drag-drop → object storage)
- PPTX/PDF → per-slide image extraction (libreoffice CLI in headless mode + pdf2image)
- Gemini 3 Pro multimodal call with 3-persona structured prompt
- Persist scores + rewrites to `pitch_analyses`
- Build analysis viewer UI: slide thumbnails, scores per persona, rewrite tabs
- TTS narration via Gemini or Vultr Serverless Inference

**End-of-day deliverable:** Drop in Klarity.pptx → 60 seconds later see 3 scores + 1 archetype rewrite + narrated audio.

### Day 3 — May 15 (Friday) — Discovery Co-Pilot
- Browser MediaRecorder + WS client
- Bun-side Speechmatics WS relay
- JTBD decoder prompt (runs on 5-second rolling windows of diarized text)
- Live switch chart UI: 4 quadrants with appearing evidence quotes
- Mid-call nudge engine (rule-based: if any quadrant empty after 8 min, surface a suggested question)
- End-call flow: persist transcript + chart, generate follow-up questions

**End-of-day deliverable:** Speak into the browser for 5 minutes → watch switch chart populate live → end call → see structured chart saved.

### Day 4 — May 16 (Saturday) — Win-Loss Auditor
- Webhook endpoint with HMAC signature validation
- Manual-upload alternative for demo
- Async job queue (Postgres-backed, no Redis needed at this scale)
- 4-stage Featherless pipeline with per-stage checkpointing
- React-PDF digest generator
- Resend email integration for weekly delivery

**End-of-day deliverable:** Drop in a transcript + "lost" label → 90 seconds later receive a PDF digest by email with all 4 sections populated.

### Day 5 — May 17 (Sunday) — Polish + Demo Prep
- End-to-end demo flow rehearsal (3 minutes, scripted)
- Record demo video (OBS, 3 minutes max)
- Write README with setup, architecture diagram, sponsor trace
- Design cover image (Figma → PNG)
- Build slide deck (10 slides max)
- Stress test on 3 different real pitch decks (Klarity, SolAI_terminal, plus one external)
- Stage second Vultr VM as hot standby

**End-of-day deliverable:** Polished demo video posted privately, README complete, repo public-ready.

### Day 6 — May 18 (Monday) — Submission
- Final bug fixes, integration retests
- Submit per lablab.ai spec: title, short/long desc, tech tags, cover, video, slides, repo URL, demo URL
- Tag commits explicitly for each sponsor's judging trail
- Post launch announcement tagging all 4 sponsors + lablab.ai
- Confirm submission landed before 3:00 PM GMT May 19

**End-of-day deliverable:** Submission confirmation, social posts live, repo public.

### Day 7 — May 19 (Tuesday) — On-site (Milan)
- Travel to Fiera Milano if selected for on-site build day
- Live demo preparation, audience-input dry runs

### Day 8 — May 20 (Wednesday) — Demo Day
- Demo Showcase + Awards Ceremony at AI Week

---

## 12. Demo Script (3-minute on-stage)

**0:00–0:20 — Hook**
> "I'm a founder at AI Week. This week I'll pitch 12 investors, run 8 customer-discovery calls, and lose 4 deals I'll never learn from. RevAgent fixes all three."

**0:20–1:10 — Pitch Surgeon (Gemini)**
- Drag-drops Klarity.pptx into browser
- 30 seconds of multimodal analysis
- 3 scores appear (Frame, Offer, Desire)
- Click into the weakest slide → audience sees the original + the Hormozi grand-slam rewrite side-by-side
- Play 10 seconds of the narrated pitch audio

**1:10–2:10 — Discovery Co-Pilot (Speechmatics)**
- Click "Start customer call"
- Audience volunteer asks a fake discovery question live
- Switch chart populates in real-time on screen
- Red nudge appears: *"You haven't probed for Habit force — try: 'Walk me through how you handle this today.'"*
- End call → switch chart saves with 3 follow-up questions

**2:10–2:50 — Win-Loss Auditor (Featherless)**
- Switch to dashboard
- Open this week's Win-Loss digest PDF (pre-generated from real prior demo data)
- Scroll through: 3 won patterns, 2 lost patterns, 5 objections, 10 verbatim quotes
- "Generated entirely by Featherless open-source models, MIT-licensed, async"

**2:50–3:00 — Close**
> "Vultr backend, Gemini multimodal, Speechmatics streaming, Featherless async. One codebase, four sponsor stacks. MIT on GitHub. RevAgent.ai — closing now."

---

## 13. Submission Checklist (per lablab.ai spec)

- [ ] **Project Title:** RevAgent — Sales Intelligence for Founders
- [ ] **Short Description** (≤100 chars): "3 AI agents that fix every founder's pitch, discovery, and win-loss workflow."
- [ ] **Long Description:** Executive summary (Section 1)
- [ ] **Technology & Category Tags:** gemini, speechmatics, featherless, vultr, agents, jtbd, sales, multimodal
- [ ] **Cover Image:** 1920×1080 PNG, exported from Figma
- [ ] **Video Presentation:** 3-minute demo, uploaded to YouTube unlisted + Loom backup
- [ ] **Slide Presentation:** 10-slide PDF
- [ ] **Public GitHub Repository:** github.com/[user]/revagent (MIT license)
- [ ] **Demo Application Platform:** Vultr
- [ ] **Application URL:** https://revagent.[domain].com

---

## 14. Risk Register

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Speechmatics WebSocket flaky in live browser demo | Med | High | Pre-record a clean 2-min audio clip as fallback; play through browser tab audio |
| Gemini quota exhausted before Day 5 | Med | High | Cache all analyses to Postgres; rate-limit demo prep to 5 decks; have Google Cloud $300 credit ready |
| Featherless model selection mismatch | Med | Med | Test all 4 candidate models against fixture transcripts on Day 1 morning; fail fast |
| Vultr VM dies mid-demo | Low | Critical | Stage a hot-standby VM with database replica; DNS swap rehearsed |
| One of 3 agents doesn't ship by Day 5 | High | Med | Cut order: archetype rewrites first (Pitch), then async to manual trigger (Win-Loss), keep Discovery as the showpiece |
| Diarization quality poor on accented English | Med | Med | Pre-select audience volunteer with clean English for live demo |
| PDF generation fails on Vultr VM | Low | Low | Generate PDFs locally during demo prep, serve as static files for demo |
| TTS audio out of sync with deck | Low | Low | Pre-render narration audio for all demo decks |

---

## 15. Out of Scope (explicit non-build list)

- Real CRM integrations (HubSpot, Salesforce, Pipedrive, Attio)
- Multi-user team features, RBAC, shared workspaces
- Mobile app (web-only, mobile-responsive)
- Custom voice cloning (use Gemini/Vultr stock TTS only)
- Calendar integrations (Google Cal, Outlook)
- Slack / Discord notifications
- Languages other than English
- Stripe billing, paywalls, free trials
- A/B testing infrastructure for rewrites
- Browser extension
- Public API for third-party developers
- Pitch deck *generation* from scratch (only critique + rewrite of uploaded decks)

---

## 16. Open Questions

| # | Question | Decision Owner | Deadline |
|---|---|---|---|
| Q1 | Add Kraken Social Engagement side-entry on Day 5 if main entry ships clean? | Lead | EOD Day 4 |
| Q2 | Which 4 Featherless models specifically? | Lead | Day 1 morning, post-kickoff |
| Q3 | Single demo account or per-judge throwaway accounts? | Lead | Day 5 |
| Q4 | Resend or Postmark for digest email? | Lead | Day 4 morning |
| Q5 | Do we need a public landing page separate from the app? | Lead | Day 5 |

---

## 17. Appendix: Judging Criteria Mapping

The hackathon brief lists four judging criteria. Mapping RevAgent's strengths to each:

**Application of Technology** — Four sponsor APIs in the critical path, each used for what it's actually best at (Gemini for multimodal reasoning, Speechmatics for live diarization, Featherless for specialized async inference, Vultr for the production host). No costume integrations.

**Presentation** — 3-minute demo with three discrete dramatic moments: drop-deck → live-call → digest-PDF. Each moment is visual, each takes <60 seconds, audience-input optional on the call segment.

**Business Value** — Targets a real audience problem at exactly the venue: 25,000+ entrepreneurs running pitches and discovery calls *during* AI Week. Every judge has done a discovery call this month.

**Originality** — The combination of (1) frame-control + grand-slam + desire-amp multi-archetype rewrites, (2) live JTBD switch-chart populating during a call, and (3) async win-loss pattern extraction across the deal history is not the shape of any existing product. Each piece individually exists; none of them exist together.

---

## 18. Appendix: Challenge Dimension Coverage

| Dimension | How RevAgent satisfies |
|---|---|
| **Intelligent Reasoning** | Each agent operates under explicit framework constraints (Pitch Anything, JTBD switch interview, Hormozi value equation) and handles roadblocks (e.g., missing data, weak transcript) without human intervention. |
| **Agentic** | The Win-Loss Auditor plans its own 4-stage pipeline, calls external Featherless APIs, manages multi-step state with checkpointing, persists results to Postgres. |
| **Enterprise Utility** | Solves a measurable friction point (lost deal learning, weak pitches, shallow discovery) for the exact audience attending AI Week — managers and entrepreneurs. |
| **Multimodal Intelligence** | Gemini 3 Pro reads slides as image + text simultaneously. Speechmatics processes streaming audio. Audio out via TTS. Three modalities round-trip through the system. |
| **Collaborative Systems** | The Pitch Surgeon runs three specialized persona agents whose outputs are merged by an orchestrator. The Win-Loss Auditor passes typed state between four specialized models. Each agent does what a single LLM call couldn't. |
