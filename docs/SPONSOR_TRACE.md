# Sponsor Trace

Every external API call leaves a persistent ID for the judging trail.

## Vultr

| Item | Location |
|---|---|
| Deployment manifest | `vultr.json` (repo root) |
| Production VM | Vultr VC2 / Premium Intel · `apps/api` + `apps/web` via Coolify |
| Postgres | Vultr Managed Databases (PostgreSQL 16) — connection string in `DATABASE_URL` |
| Object Storage | Vultr Object Storage (S3-compatible) — endpoint in `VULTR_S3_ENDPOINT`, bucket in `VULTR_S3_BUCKET` |
| Serverless Inference (fallback) | TTS narration fallback path in `apps/api/src/lib/pitch/narrate.ts` |
| Proof | Network tab during demo shows responses from a Vultr-allocated IP. Coolify dashboard screenshot in `docs/demo/`. |

## Google Gemini

| Item | Location |
|---|---|
| Multimodal deck reasoning | `apps/api/src/lib/pitch/gemini-council.ts` — `model: gemini-2.5-pro` (PRD references Gemini 3 Pro; default in `.env.example`) |
| Live JTBD decoding (5-sec rolling window) | `apps/api/src/lib/call/jtbd-decoder.ts` — `model: gemini-2.5-flash` |
| Post-call follow-up generation | Same file, `generateFollowUps` |
| Request ID persistence | `pitch_analyses.gemini_request_id` (per-analysis row, includes timestamp + random suffix) |
| API endpoint | `generativelanguage.googleapis.com` |
| Proof | Request IDs visible in `/pitch/[id]` page footer; network tab shows the `generativelanguage.googleapis.com` host |

## Speechmatics

| Item | Location |
|---|---|
| Real-time WebSocket relay | `apps/api/src/lib/call/ws.ts` (`startSpeechmaticsRelay`) |
| RT token mint | `apps/api/src/lib/call/speechmatics.ts` (`getSpeechmaticsRtToken`) |
| Config | English Enhanced, diarization enabled, partials enabled, `max_delay: 2` |
| Session ID persistence | `calls.speechmatics_session_id` |
| Endpoint | `wss://eu.rt.speechmatics.com/v2` |
| Proof | Session IDs visible in `/call/[id]` page footer; network tab shows the `wss://eu.rt.speechmatics.com` connection |

## Featherless

| Item | Location |
|---|---|
| OpenAI-compatible client | `apps/api/src/lib/audit/featherless.ts` |
| 4-stage pipeline | `apps/api/src/lib/audit/pipeline.ts` |
| Worker w/ checkpointing | `apps/api/src/lib/audit/worker.ts` — `SELECT … FOR UPDATE SKIP LOCKED` |
| Model defaults | See `.env.example`: `FEATHERLESS_MODEL_OBJECTIONS`, `FEATHERLESS_MODEL_JTBD`, `FEATHERLESS_MODEL_CLASSIFIER`, `FEATHERLESS_MODEL_VOICE` |
| Model ID persistence | `audits.featherless_model_versions` (JSONB) — populated per stage |
| MIT license | `LICENSE` (repo root) |
| Proof | Model IDs visible in `/audit/[id]` page footer; PDF digest footer mentions "4-stage Featherless pipeline · MIT-licensed" |

---

## Live demo capture template

Fill in real IDs after running an end-to-end demo:

```
gemini_request_id        = pitch-________________________
speechmatics_session_id  = ____________________________________
featherless_models       = {
  objection_extractor: "_____________________",
  jtbd_detector:       "_____________________",
  classifier:          "_____________________",
  voice_extractor:     "_____________________"
}
vultr_vm_ip              = ___.___.___.___
```
