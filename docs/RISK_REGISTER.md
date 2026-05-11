# Risk Register

| # | Risk | Prob | Impact | Mitigation | Owner | Status |
|---|---|---|---|---|---|---|
| 1 | Speechmatics WebSocket flaky in live browser demo | Med | High | Pre-recorded 2-min clip plays through browser tab audio; toggle in dev menu | Discovery agent | Mitigation built into `apps/web/app/call/[id]/_lib/recorder.ts` (`startMicCapture` returns a stop handle so a fallback can swap in) |
| 2 | Gemini quota exhausted before demo day | Med | High | All analyses cached to Postgres; demo prep rate-limited to 5 decks max; Google Cloud $300 credit ready | Pitch agent | Caching is automatic (pitch_analyses table stores everything) |
| 3 | Featherless model selection mismatch | Med | Med | Smoke-test all 4 candidate models against fixture transcripts on Day 1 morning; fail fast | Win-Loss agent | `scripts/featherless-smoke.ts` to be added; defaults in `.env.example` |
| 4 | Vultr VM dies mid-demo | Low | Critical | Hot-standby VM with DB replica; DNS swap rehearsed | Demo & submission | TODO: provision second VM before demo day |
| 5 | One of 3 agents doesn't ship | Med | Med | Cut order: archetype rewrites first → manual audit trigger → keep Discovery as the showpiece | All | All 3 agents have working entry points; degradation paths defined in code |
| 6 | Diarization quality poor on accented English | Med | Med | Pre-select audience volunteer with clean English; pre-recorded fallback | Discovery agent | Volunteer briefing in DEMO_SCRIPT.md |
| 7 | PDF generation fails on Vultr VM | Low | Low | Pre-generate digest PDFs locally during prep; serve as static | Win-Loss agent | `docs/demo/sample-digest.pdf` is the safety net |
| 8 | TTS audio out of sync with deck | Low | Low | Pre-render narration for demo decks | Pitch agent | Narration silent-mp3 fallback in `narrate.ts` ensures pipeline doesn't block |
| 9 | LibreOffice not installed on host | Med | Med | `Dockerfile` installs `libreoffice-impress` + `poppler-utils` in runtime stage | Infra | Built in |
| 10 | Gemini structured-output schema rejected | Med | Med | Schema validated with Zod after parse; clear error surfaced | Pitch agent | `runPitchCouncil` throws on invalid shape; UI shows status=failed |

## Last-minute checklist

Run T-12h before submission:

- [ ] `bun run typecheck && bun run build` green
- [ ] `GET /api/health/integrations` returns all `ok` (or `skip` if API keys not yet configured)
- [ ] Full demo flow rehearsed end-to-end without slide-fallback (3 times minimum)
- [ ] Demo video uploaded (YouTube unlisted + Loom backup)
- [ ] 10-slide PDF complete
- [ ] Cover image 1920×1080 PNG in `docs/demo/`
- [ ] `LICENSE` is verbatim MIT
- [ ] `vultr.json` present in repo root
- [ ] Production URL responds + has all sponsor IDs in DB from a recorded demo run
- [ ] Hot-standby VM responding to health checks
- [ ] Sponsor trace doc updated with real IDs from the final demo recording
