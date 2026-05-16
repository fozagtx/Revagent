# Brand — RevAgent

_Status: deferred_

The brand identity for RevAgent is already established in code (see `apps/web/tailwind.config.ts` for tokens and `apps/web/app/globals.css` for the atmospheric background). User has explicitly requested no brand changes during polish passes.

**Established palette** (do not modify in polish work):
- Navy `#002259` — primary text, brand wordmark
- Blue 600/700 `#0044B9 → #0074EC` — accent, CTA gradient
- Sky gradient (radial blue at top → pale `#EAF1FA`) — body atmosphere
- Success `#10b981` (emerald) — positive states
- Error `#ef4444` (red) — destructive states + Live indicator (recording red)

**Established typography** (do not swap):
- Instrument Sans — UI body text (`font-sans`)
- Instrument Serif — headlines, hero (`font-serif`)
- Space Mono — eyebrows, code, numbers (`font-mono`)

**Voice**: Concrete > poetic. Headlines lead with problem or numeric outcome. Avoid metaphor (no "floating", "rocket fuel", etc.). Eyebrows in mono uppercase tracking-wider.

**Components**: Existing primitives in `apps/web/components/ui/` (`Card`, `Button`, `Field`, `PageHeader`, `StatusBadge`, `Skeleton`). Do not introduce new component libraries.

To run a full brand re-pick, invoke `brand-design`. Otherwise polish passes preserve everything above.

_Deferred at: 2026-05-16_
