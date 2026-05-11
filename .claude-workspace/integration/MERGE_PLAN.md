---
target_branch: main
merge_order: [infra-foundation, docs-and-license, pitch-surgeon, discovery-copilot, winloss-auditor, demo-and-submission]
created: 2026-05-11
---

# Merge Plan

## Merge Order (Dependency-Based)

Merges happen in three waves matching the dependency graph in `PARALLEL_PLAN.md`.

### Wave 1 — Foundation (no deps, merge in either order)

1. **infra-foundation** (`parallel/infra-foundation`) — spine the agents plug into. Merge first so its `0001_init.sql`, package layout, and `apps/api/src/routes/_stubs.ts` exist on `main`.
2. **docs-and-license** (`parallel/docs-and-license`) — LICENSE, README, all docs. Merge *after* infra so its full `README.md` cleanly overwrites the minimal stub from infra.

### Wave 2 — Agents (merge after Wave 1; agents are independent of each other)

3. **pitch-surgeon** (`parallel/pitch-surgeon`)
4. **discovery-copilot** (`parallel/discovery-copilot`)
5. **winloss-auditor** (`parallel/winloss-auditor`) — adds `0002_audit_jobs.sql`; safe because infra owns `0001`

### Wave 3 — Integration

6. **demo-and-submission** (`parallel/demo-and-submission`) — touches `apps/web/app/page.tsx` and `docs/SPONSOR_TRACE.md` last

## Merge Commands

```bash
# Local-only repo — no `git pull origin` step. Once a remote is added, prepend `git pull origin main`.
git checkout main

# Wave 1
git merge --no-ff parallel/infra-foundation       -m "Merge infra-foundation: scaffold + DB + deploy"
git merge --no-ff parallel/docs-and-license       -m "Merge docs-and-license: LICENSE + README + submission text"

# Wave 2 — verify Wave 1 merged cleanly, then:
bun install && bun run typecheck
git merge --no-ff parallel/pitch-surgeon          -m "Merge pitch-surgeon: Agent 1 (Gemini multimodal)"
git merge --no-ff parallel/discovery-copilot      -m "Merge discovery-copilot: Agent 2 (Speechmatics live JTBD)"
git merge --no-ff parallel/winloss-auditor        -m "Merge winloss-auditor: Agent 3 (Featherless async pipeline)"

# Wave 3
bun install && bun run typecheck && bun run build
git merge --no-ff parallel/demo-and-submission    -m "Merge demo-and-submission: video + slides + submission"

# Tag the submission
git tag -a v1.0-submission -m "RevAgent submission — AI Agent Olympics @ Milan AI Week 2026"
```

## Conflict Resolution

Expected conflicts and resolutions:

| File | Conflict between | Resolution |
|---|---|---|
| `README.md` | infra (stub) vs. docs-and-license (full) | Take docs-and-license version |
| `apps/web/app/page.tsx` | infra (placeholder) vs. demo-and-submission (unified dashboard) | Take demo-and-submission version |
| `docs/SPONSOR_TRACE.md` | docs-and-license (template rows) vs. demo-and-submission (real IDs) | Take demo-and-submission version |
| `packages/db/migrations/` | infra (`0001`) + winloss (`0002`) | No conflict — different file names |
| `apps/api/src/routes/_stubs.ts` | infra defines stubs; Wave 2 tasks may delete entries as they implement | Each agent removes its own stub entry; coalesce on merge |

Resolve in dependency order; verify `bun run typecheck` after each merge before continuing.

## Post-Merge Verification

- [ ] `bun install && bun run typecheck && bun run build` passes
- [ ] `bun run dev` boots web + api locally
- [ ] `GET /api/health/integrations` returns all green
- [ ] Run full PRD §12 demo end-to-end on local before deploy
- [ ] Deploy to Vultr via Coolify, verify production URL responds
- [ ] All 4 sponsor trace IDs captured in a single fresh demo run (Gemini request ID, Speechmatics session ID, Featherless model versions, Vultr deployment manifest)
- [ ] MIT LICENSE visible in repo root
- [ ] `v1.0-submission` tag pushed (once GitHub remote exists)
- [ ] lablab.ai submission confirmation received before 2026-05-19T15:00:00Z

## Cleanup

After successful merge and submission:

```bash
git worktree list
git worktree remove .claude-workspace/worktrees/infra-foundation/worktree
git worktree remove .claude-workspace/worktrees/docs-and-license/worktree
git worktree remove .claude-workspace/worktrees/pitch-surgeon/worktree
git worktree remove .claude-workspace/worktrees/discovery-copilot/worktree
git worktree remove .claude-workspace/worktrees/winloss-auditor/worktree
git worktree remove .claude-workspace/worktrees/demo-and-submission/worktree

git branch -D parallel/infra-foundation parallel/docs-and-license \
              parallel/pitch-surgeon parallel/discovery-copilot \
              parallel/winloss-auditor parallel/demo-and-submission
```
