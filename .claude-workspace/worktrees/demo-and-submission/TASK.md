---
id: demo-and-submission
name: demo-and-submission
priority: 4
dependencies: [infra-foundation, pitch-surgeon, discovery-copilot, winloss-auditor, docs-and-license]
estimated_hours: 8
tags: [demo, polish, submission, video, slides]
---

## Objective

Land the on-stage demo and submit by 3:00 PM GMT May 19 — record video, build slides, polish UI seams between agents, deploy hot-standby, file lablab.ai entry.

## Context

PRD §11 Day 5–6 deliverables, §12 demo script, §13 submission checklist. Cannot start until all 3 agents are merged because most of this is screenshots, real demo runs, and integration polish.

## Implementation

1. **Unified dashboard** (`apps/web/app/page.tsx`)
   - Landing → 3 agent cards with stats (analyses run, calls captured, audits processed)
   - Live integration-health badges (green/red) pulling from `/api/health/integrations`
2. **Demo fixture data** (`scripts/seed-demo.ts`)
   - Pre-load 3 pitch decks (Klarity, SolAI_terminal, external)
   - Pre-load 2 sample call transcripts (one won, one lost)
   - Pre-generate one Win-Loss digest PDF (per PRD §12 demo flow, this is shown pre-rendered)
3. **End-to-end demo run** — execute PRD §12 script 5× until smooth
   - Time each segment, must total ≤3:00
   - Stress-test all 3 decks per PRD §11 Day 5
4. **Demo video** (`docs/demo/`)
   - 3-min OBS recording, exported MP4
   - Upload to YouTube (unlisted) + Loom backup per PRD §13
   - Voiceover script aligned to demo-script.md
5. **Slide deck** (`docs/demo/slides.pdf`)
   - 10 slides max per PRD §13: cover / problem / solution / architecture / agent 1 / agent 2 / agent 3 / sponsor trace / business value / close
6. **Cover image** — execute on the brief from `docs/COVER_BRIEF.md` → 1920×1080 PNG → `docs/demo/cover.png`
7. **Hot-standby deploy** — second Vultr VM with DB replica, DNS swap rehearsed (PRD §14 mitigation)
8. **Final README pass** — update `docs/SPONSOR_TRACE.md` rows with real request IDs / session IDs / model IDs captured from a live demo run (judging trail)
9. **Submit** — fill lablab.ai form per `docs/SUBMISSION.md`, confirm before 3:00 PM GMT May 19
10. **Launch post** — Twitter/LinkedIn/farcaster tagging all 4 sponsors + lablab.ai (PRD §11 Day 6)

## Acceptance Criteria

- [ ] Full PRD §12 demo runs end-to-end without slide-fallback
- [ ] Demo video uploaded to YouTube (unlisted) + Loom backup
- [ ] 10-slide PDF complete
- [ ] Cover image 1920×1080 PNG
- [ ] Hot-standby VM responding to health checks
- [ ] Sponsor trace table populated with real IDs from a recorded demo run
- [ ] lablab.ai submission confirmation email received
- [ ] Launch posts live on at least 2 channels
- [ ] Repo public, MIT license visible, demo URL working

## Files to Create

- `scripts/seed-demo.ts`
- `docs/demo/cover.png`
- `docs/demo/slides.pdf`
- `docs/demo/demo-video-url.md` (just the YouTube + Loom URLs)
- `docs/demo/launch-post.md`
- Updates to `apps/web/app/page.tsx` (unified dashboard)
- Updates to `docs/SPONSOR_TRACE.md` (real IDs)

## Integration Points

- **Provides**: Final submission artifacts, demo readiness
- **Consumes**: All 3 agents working end-to-end, all docs from `docs-and-license`, deploy from `infra-foundation`
- **Conflicts**: Updates `docs/SPONSOR_TRACE.md` last; updates `apps/web/app/page.tsx` (was a placeholder from `infra-foundation`)
