# Demo Script — 3 minutes on stage

Total: **3:00 exactly**. Run with a stopwatch. If you fall behind, cut from the Win-Loss segment first (pre-rendered PDF is the safety net).

## 0:00 – 0:20 — Hook

> "I'm a founder at AI Week. This week I'll pitch 12 investors, run 8 customer-discovery calls, and lose 4 deals I'll never learn from. RevAgent fixes all three."

(Single slide on screen: title only.)

## 0:20 – 1:10 — Pitch Surgeon (Gemini)

**Action:** Drag-drop `Klarity.pptx` into the browser.

**Voiceover while it processes (~30s):**
> "Gemini 3 Pro reads every slide as image and text simultaneously. A 3-persona council scores the deck: Klaff for frame control, Hormozi for offer, Schwartz for desire-stage. Each one proposes a rewrite."

**When scores appear:** click into weakest slide.

> "Here's slide 4 as it shipped. Here's the Hormozi grand-slam rewrite, side-by-side."

**Play 10 seconds of narrated pitch audio.**

> "And here's the 30-second pitch, narrated in the strongest archetype. Gemini request ID right there in the footer — that's the judging trace."

## 1:10 – 2:10 — Discovery Co-Pilot (Speechmatics)

**Action:** Click "Start customer call." Grant mic permission.

> "Audience volunteer — pretend you're considering a CRM. Ask me a question."

**[Volunteer asks something live. You respond briefly.]**

**Switch chart populates on screen in real-time. Point at quadrants.**

> "Push, Pull, Anxiety, Habit — JTBD switch-interview framework. Speechmatics streams diarized transcript, Gemini Flash classifies each utterance live."

**When 8-min nudge would normally fire, simulate by clicking demo button:**

> "If I were missing a quadrant, you'd see this red nudge: 'Try probing for Habit force.'"

**Click End Call.**

> "Switch chart saves. Three follow-up questions generated. Speechmatics session ID in the footer."

## 2:10 – 2:50 — Win-Loss Auditor (Featherless)

**Switch to /audit page.** Open the pre-generated digest PDF.

> "While I've been demoing, the async pipeline ran on a real lost deal. Four specialized Featherless models in sequence — objection extractor, JTBD pattern detector, win-loss classifier, voice extractor — each MIT-licensed open source, each running on Featherless serverless inference, each checkpointing into Postgres so a crash mid-run resumes from the last stage."

**Scroll through PDF:** 3 won patterns → 2 loss patterns → 5 objections → 10 verbatim phrases.

> "Ten verbatim buyer phrases ready to paste into a landing page. This is the email I'd get every Sunday."

## 2:50 – 3:00 — Close

> "Vultr backend, Gemini multimodal, Speechmatics streaming, Featherless async. One codebase, four sponsor stacks, MIT on GitHub. RevAgent.ai — closing now."

(Hold final slide: repo URL + demo URL + team handle.)

---

## Stage directions

- **Audience volunteer:** brief them privately 5 minutes before stage. Give them a short, English-accented question. Tell them not to riff.
- **Fallback for Speechmatics WS:** if the live mic fails, switch to the "Play recorded audio" dev toggle (pre-recorded clip in `tests/fixtures/audio/sample-discovery-call.wav`).
- **Fallback for Pitch Surgeon:** the analysis must complete in ≤60s. If it stalls, the dashboard has a "Show cached result" button — uses the pre-cached analysis from demo prep.
- **Always-on safety net:** the demo PDF for Win-Loss is pre-generated and lives at `docs/demo/sample-digest.pdf`. If anything else fails, this slide alone covers the Featherless and MIT story.
