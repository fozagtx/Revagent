---
id: pitch-surgeon
name: pitch-surgeon
priority: 3
dependencies: [infra-foundation]
estimated_hours: 8
tags: [agent, gemini, multimodal, frontend, backend]
---

## Objective

Ship Agent 1 end-to-end — drop a pitch deck, get 3 scores + weakest-slide rewrite + narrated 30-second pitch in <60s.

## Context

PRD §4 Agent 1, §10.2 Gemini integration, §11 Day 2 deliverable. The 3-persona council (Klaff frame-control / Hormozi grand-slam / Schwartz desire-amp) is the originality differentiator per PRD §17. This is the marquee demo moment 0:20–1:10.

## Implementation

1. **Deck ingest** (`apps/api/src/routes/pitch/`)
   - `POST /api/pitch` accepts `.pptx`, `.pdf`, or Google Slides URL
   - Upload to Vultr Object Storage via signed URL helper from `packages/shared`
   - Returns `{analysis_id}` immediately, processes async
2. **Slide extraction** (`apps/api/src/lib/deck-extract.ts`)
   - PPTX → per-slide PNG via `libreoffice --headless --convert-to pdf` + `pdf2image` (or `mutool`)
   - PDF → per-slide PNG directly
   - Slide text via `pptx-parser` / `pdf-parse`
   - Cap at 1024×768, JPEG quality 85
3. **Gemini 3-persona call** (`apps/api/src/lib/gemini-council.ts`)
   - Single Gemini 3 Pro multimodal request with structured-output schema (PRD §10.2)
   - System prompt instructs Gemini to embody 3 personas: Klaff/Hormozi/Schwartz
   - Response shape: `{frame_score, offer_score, desire_score, weakest_slide, slide_critiques[], rewrites: {frame_control, grand_slam, desire_amp}}`
   - Persist full response + `gemini_request_id` to `pitch_analyses`
4. **TTS narration** (`apps/api/src/lib/narrate.ts`)
   - Take strongest archetype rewrite → 30-sec script → Gemini TTS (or Vultr Serverless Inference fallback)
   - Store MP3 in object storage, URL on the row
5. **Viewer UI** (`apps/web/app/pitch/[id]/`)
   - Slide grid with thumbnail + per-slide score chips
   - Weakest-slide-banner with original ↔ rewrite diff (side-by-side)
   - Archetype tabs: Frame Control / Grand Slam / Desire Amp
   - Audio player for narration
   - Gemini request ID in footer (judging trace per PRD §10.2)
6. **Upload UI** (`apps/web/app/pitch/page.tsx`) — drag-drop + recent analyses list

## Acceptance Criteria

- [ ] Drop `Klarity.pptx` → analysis page renders within 60s
- [ ] 3 numerical scores 1–10 visible
- [ ] Weakest slide identified with rationale
- [ ] All 3 archetype rewrites accessible
- [ ] Narration audio plays, ≤35s duration
- [ ] `gemini_request_id` visible in UI footer (trace)
- [ ] Failed Gemini call surfaces actionable error (not silent)
- [ ] Tested on 3 different decks (Klarity, SolAI_terminal, + 1 external — per PRD §11 Day 5)

## Files to Create

- `apps/api/src/routes/pitch/index.ts`
- `apps/api/src/routes/pitch/[id].ts`
- `apps/api/src/lib/deck-extract.ts`
- `apps/api/src/lib/gemini-council.ts`
- `apps/api/src/lib/narrate.ts`
- `apps/api/src/prompts/pitch-council.ts`
- `apps/web/app/pitch/page.tsx` (upload + list)
- `apps/web/app/pitch/[id]/page.tsx` (viewer)
- `apps/web/app/pitch/[id]/_components/{ScoreCard,SlideGrid,RewriteTabs,NarrationPlayer}.tsx`
- `tests/fixtures/decks/` (drop test pptx files here)

## Integration Points

- **Provides**: `/api/pitch/*` endpoints, pitch viewer pages
- **Consumes**: DB `pitch_analyses` schema, object storage helper, shared types — all from `infra-foundation`
- **Conflicts**: None expected — owns `apps/api/src/routes/pitch/` and `apps/web/app/pitch/` exclusively
