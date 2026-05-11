# Parallel Development Workspace

State for the RevAgent parallel build (AI Agent Olympics @ Milan AI Week 2026).

## Structure

- `PARALLEL_PLAN.md` — main plan with all subtasks and waves
- `worktrees/<subtask>/TASK.md` — per-subtask spec
- `worktrees/<subtask>/STATUS.yml` — per-subtask runtime status
- `worktrees/<subtask>/worktree/` — actual git worktree (created by `/work-on`)
- `integration/MERGE_PLAN.md` — merge order and commands
- `scripts/` — helper utilities

## Commands

- `/plan-parallel <feature>` — create parallel development plan
- `/work-on <subtask>` — start working on a subtask in a fresh worktree
- `/worktree-review` — review current worktree's changes
- `/merge-parallel main` — merge all subtasks back to main

## Manual status check

```bash
bash .claude-workspace/scripts/status-check.sh
```

## Cleanup after merge

```bash
git worktree list
git worktree remove <path>
git branch -D <branch>
```

## Local-only repo note

This repo has no `origin` remote yet. Scripts that reference `origin/main`
fall back to local `main` automatically. If you push to GitHub later, the
existing scripts will start using `origin/main` without modification.
