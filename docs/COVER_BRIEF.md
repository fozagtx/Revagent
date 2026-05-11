# Cover Image Brief

## Specs

- **Dimensions:** 1920 × 1080 PNG
- **Format:** PNG-24, no transparency
- **Output path:** `docs/demo/cover.png`

## Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│    RevAgent                                                         │
│    Sales intelligence for founders                                  │
│                                                                     │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐         │
│  │ PITCH SURGEON  │  │ DISCOVERY      │  │ WIN-LOSS       │         │
│  │                │  │ CO-PILOT       │  │ AUDITOR        │         │
│  │ deck → scores  │  │ live JTBD      │  │ async pipeline │         │
│  │ + narration    │  │ switch chart   │  │ → PDF digest   │         │
│  └────────────────┘  └────────────────┘  └────────────────┘         │
│                                                                     │
│  Powered by:                                                        │
│  [Vultr]   [Gemini]   [Speechmatics]   [Featherless]                │
│                                                                     │
│                                       AI Week 2026 · Milan          │
└─────────────────────────────────────────────────────────────────────┘
```

## Palette

| Role | Hex | Use |
|---|---|---|
| Background | `#0b1220` | full bleed |
| Surface | `#1f3a5f` | card backgrounds |
| Accent | `#22d3ee` | logo, headlines, agent icons |
| Text primary | `#e2e8f0` | body text |
| Text muted | `#94a3b8` | subtitles, sponsor band |

## Typography

- **Wordmark:** ui-mono · 96px · `#e2e8f0` with `rev` colored `#22d3ee`
- **Tagline:** ui-sans · 28px · muted
- **Agent card titles:** ui-sans bold uppercase tracking-wide · 18px
- **Agent card body:** ui-sans · 14px · muted

## Sponsor band

Equal-width 4-column logo strip across the bottom third. Logos rendered in the muted text color (not full-color) to keep visual hierarchy on the agent triptych. Logos must be official SVGs — pull from each sponsor's brand page.

## Production notes

Build this in Figma. Export at 2× then downsample for crisp anti-aliasing. Do not use stock photography — keep it typographic and geometric to match the in-app aesthetic.
