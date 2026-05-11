# lablab.ai Submission

Fill the form using the text below. All fields below their character limit.

## Project Title

`RevAgent — Sales Intelligence for Founders`

## Short Description (≤100 chars)

`3 AI agents that fix every founder's pitch, discovery, and win-loss workflow.`

(74 characters.)

## Long Description

RevAgent is a sales-intelligence operating system for early-stage founders running their own customer-facing motion. It orchestrates three coordinated AI agents that address the three highest-friction moments in early-stage revenue work:

1. **Pitch Surgeon** — Drop a `.pptx` or `.pdf` deck. A 3-persona Gemini 3 Pro council (Klaff frame-control, Hormozi grand-slam-offer, Schwartz desire-amplifier) scores the deck on each lens, identifies the weakest slide, generates three full archetype rewrites, and produces a 30-second narrated pitch.

2. **Discovery Co-Pilot** — Start a call from the browser. Audio streams to Speechmatics for real-time diarized transcription. A JTBD switch-interview decoder running on Gemini Flash classifies each utterance into Push / Pull / Anxiety / Habit quadrants. A live switch chart populates as evidence accumulates. A mid-call nudge engine flags missing quadrants. End-of-call: structured chart + 3 recommended follow-up questions.

3. **Win-Loss Auditor** — Webhook or manual upload fires the async 4-stage pipeline: Objection Extractor → JTBD Pattern Detector → Win-Loss Classifier → Voice Extractor, all running on Featherless serverless inference against open-source models, with per-stage Postgres-backed checkpointing. Final output: a weekly PDF digest emailed via Resend listing patterns, objections, classification evidence, and verbatim buyer language ready for copy.

**One codebase. Four sponsor stacks (Vultr / Gemini / Speechmatics / Featherless). MIT-licensed.** Deployed on a single Vultr VM via Coolify, with Vultr Managed Postgres and Vultr Object Storage as the system of record.

## Technology & Category Tags

```
gemini, speechmatics, featherless, vultr, agents, jtbd, sales, multimodal, async, websocket, structured-output, mit
```

## Cover Image Brief

1920 × 1080 PNG. Three-agent triptych across the top half (Pitch Surgeon · Discovery Co-Pilot · Win-Loss Auditor — each with its sponsor logo). Bottom band: Vultr / Gemini / Speechmatics / Featherless lockup with "AI Week 2026" stamp. Dark slate background (#0b1220), accent cyan (#22d3ee). See [`COVER_BRIEF.md`](COVER_BRIEF.md) for the full spec.

## Video Presentation

3-minute demo on YouTube (unlisted) + Loom backup. Demo script in [`DEMO_SCRIPT.md`](DEMO_SCRIPT.md).

## Slide Presentation

10-slide PDF: cover · problem · solution · architecture · agent 1 · agent 2 · agent 3 · sponsor trace · business value · close.

## Public GitHub Repository

`https://github.com/<owner>/revagent` (MIT license, repo public)

## Demo Application Platform

Vultr

## Application URL

`https://revagent.<domain>` — production deploy on Vultr VM via Coolify.

## Submission Confirmation

- Confirm landed before **2026-05-19 15:00:00 GMT**.
- Post on Twitter, LinkedIn, and Farcaster tagging @Vultr @GoogleAI @Speechmatics @featherlessai @lablabai.
