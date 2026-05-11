---
id: docs-and-license
name: docs-and-license
priority: 2
dependencies: []
estimated_hours: 3
tags: [docs, submission, license]
---

## Objective

Author the static docs, LICENSE, and sponsor-trace stubs that the submission depends on — all derivable from `context.md` without needing any code to exist.

## Context

PRD §10 requires MIT LICENSE in repo root (Featherless eligibility) and §13 lists submission collateral. Doing this in Wave 1 — parallel with infra — frees the Wave 3 demo-and-submission task to focus on real screenshots and integration evidence rather than rewriting prose under deadline pressure.

## Implementation

1. **`LICENSE`** — MIT, year 2026, holder name placeholder `[Founder Name]`. Per PRD §10.4 Featherless eligibility.
2. **`README.md`** — top-level. Sections:
   - Hero (title, one-line pitch, AI Week 2026 badge)
   - The Three Agents (Pitch Surgeon / Discovery Co-Pilot / Win-Loss Auditor — copy from PRD §4)
   - Architecture diagram (copy ASCII from PRD §7)
   - Sponsor Trace (table mapping each of the 4 sponsors → the file/endpoint that proves usage, per PRD §10 eligibility proofs)
   - Local Dev (placeholder, infra-foundation will fill in commands)
   - Deploy (Vultr + Coolify per PRD §10.1)
   - License — MIT
3. **`docs/SPONSOR_TRACE.md`** — one row per sponsor with: API endpoint, env var, request-ID storage location, screenshot path. Mirrors PRD §10 eligibility-proof blocks.
4. **`docs/DEMO_SCRIPT.md`** — verbatim 3-minute on-stage script from PRD §12, with timestamps and stage directions. Fixture-ready (placeholder for Klarity.pptx path, audience-volunteer cue).
5. **`docs/SUBMISSION.md`** — lablab.ai submission text per PRD §13: title, short desc (≤100 chars), long desc, tags, cover-image brief, video brief.
6. **`docs/RISK_REGISTER.md`** — copy PRD §14 table, add owner/status columns.
7. **`docs/COVER_BRIEF.md`** — 1920×1080 cover spec: three-agent triptych, sponsor logos band, AI Week 2026 stamp. Figma layout description for someone else to execute.

## Acceptance Criteria

- [ ] `LICENSE` is verbatim MIT text
- [ ] `README.md` renders cleanly on GitHub (manually preview)
- [ ] Sponsor Trace table has all 4 sponsors with eligibility-proof rows
- [ ] Demo script is 3 minutes when read aloud at presentation pace
- [ ] Submission text fits lablab.ai field limits (short desc ≤100 chars)
- [ ] No code dependencies — everything is markdown

## Files to Create

- `LICENSE`
- `README.md`
- `docs/SPONSOR_TRACE.md`
- `docs/DEMO_SCRIPT.md`
- `docs/SUBMISSION.md`
- `docs/RISK_REGISTER.md`
- `docs/COVER_BRIEF.md`

## Integration Points

- **Provides**: LICENSE (Featherless requirement), README, all submission collateral text
- **Consumes**: Nothing (sources only from `context.md`)
- **Conflicts**: `README.md` — `infra-foundation` writes a minimal stub; this task overwrites it with the full version. Merge `docs-and-license` *after* `infra-foundation` to win the README.
