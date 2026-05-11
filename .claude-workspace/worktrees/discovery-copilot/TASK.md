---
id: discovery-copilot
name: discovery-copilot
priority: 3
dependencies: [infra-foundation]
estimated_hours: 8
tags: [agent, speechmatics, realtime, websocket, frontend, backend]
---

## Objective

Ship Agent 2 — speak into the browser, watch the JTBD switch chart populate live, end call → see structured chart saved with 3 follow-up questions.

## Context

PRD §4 Agent 2, §10.3 Speechmatics integration, §11 Day 3 deliverable. The live switch chart is the showpiece per §14 (mitigation: "keep Discovery as the showpiece" if other agents slip). Demo moment 1:10–2:10 with audience volunteer.

## Implementation

1. **Browser audio capture** (`apps/web/app/call/_lib/recorder.ts`)
   - `MediaRecorder` on mic, 16-bit PCM 16kHz chunks every 250ms
   - WebSocket client to `/api/call/:id/stream`
2. **Server WS relay** (`apps/api/src/routes/call/ws.ts`)
   - Bun native WebSocket
   - On client connect → open upstream WS to `wss://eu.rt.speechmatics.com` per PRD §10.3
   - Config: English Enhanced, diarization enabled (min 2 speakers), partials on
   - Relay client audio → Speechmatics; relay transcripts → client
   - Persist `speechmatics_session_id` to `calls` row (judging trace)
3. **JTBD decoder** (`apps/api/src/lib/jtbd-decoder.ts`)
   - Buffer last 5 seconds of diarized text
   - On every new utterance, run lightweight extractor (Gemini Flash or Featherless small model) to classify into {push, pull, anxiety, habit}
   - Emit `{type: 'signal', quadrant, quote, ts, confidence}` over WS
4. **Nudge engine** (`apps/api/src/lib/nudge.ts`)
   - Rule: after 8 minutes of call time, if any quadrant has zero evidence, surface a suggested probe question for that quadrant
   - Library of probes in `apps/api/src/prompts/jtbd-probes.ts` (≥3 per quadrant from PRD §4 examples)
5. **Live switch chart UI** (`apps/web/app/call/[id]/_components/SwitchChart.tsx`)
   - 4 quadrants (Push / Pull / Anxiety / Habit) with appearing evidence quote cards
   - Confidence bar per quadrant
   - Nudge toast (red) when triggered
6. **End-call flow** (`POST /api/call/:id/end`)
   - Persist full transcript + chart + `speechmatics_session_id`
   - Generate 3 follow-up questions via Gemini (one per under-covered quadrant)
7. **Pre-recorded fallback** (`apps/web/app/call/_lib/fallback-audio.ts`)
   - Per PRD §14 risk register: if live WS flaky, play a pre-recorded 2-min audio clip through browser tab audio. Toggle in dev menu.

## Acceptance Criteria

- [ ] Speak 5 minutes → switch chart populates with ≥2 quotes per quadrant
- [ ] Diarization correctly labels speakers (verified manually)
- [ ] Nudge fires after 8min if a quadrant is empty
- [ ] End call → 3 follow-up questions generated and shown
- [ ] `speechmatics_session_id` persisted and visible in UI footer
- [ ] WS reconnects gracefully on transient drop
- [ ] Pre-recorded fallback works as fail-safe for demo

## Files to Create

- `apps/api/src/routes/call/index.ts`
- `apps/api/src/routes/call/ws.ts`
- `apps/api/src/lib/jtbd-decoder.ts`
- `apps/api/src/lib/nudge.ts`
- `apps/api/src/prompts/jtbd-probes.ts`
- `apps/web/app/call/page.tsx` (start call)
- `apps/web/app/call/[id]/page.tsx` (live session + post-call)
- `apps/web/app/call/_lib/recorder.ts`
- `apps/web/app/call/_lib/fallback-audio.ts`
- `apps/web/app/call/[id]/_components/{SwitchChart,Transcript,NudgeToast,FollowUpList}.tsx`
- `tests/fixtures/audio/sample-discovery-call.wav`

## Integration Points

- **Provides**: `/api/call/*` endpoints, WS protocol, call viewer pages
- **Consumes**: DB `calls` schema, shared types — from `infra-foundation`
- **Conflicts**: None expected — owns `apps/api/src/routes/call/` and `apps/web/app/call/` exclusively
