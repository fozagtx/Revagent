#!/usr/bin/env bun
/**
 * Smoke-test all 4 Featherless models with a 200-word fixture transcript.
 * Run this Day 1 morning right after redeeming credits to validate model choices.
 *
 *   bun run scripts/featherless-smoke.ts
 */
import { callFeatherless } from "../apps/api/src/lib/audit/featherless";
import { OBJECTION_EXTRACTOR_SYSTEM } from "../apps/api/src/prompts/audit/objections";
import { JTBD_DETECTOR_SYSTEM } from "../apps/api/src/prompts/audit/jtbd";
import { CLASSIFIER_SYSTEM } from "../apps/api/src/prompts/audit/classifier";
import { VOICE_EXTRACTOR_SYSTEM } from "../apps/api/src/prompts/audit/voice";
import { env } from "../apps/api/src/lib/env";

const FIXTURE = `[Buyer] Honestly, the workflow we have today is a nightmare. Every week I'm reconciling three spreadsheets by hand. I just want a single source of truth.
[Buyer] My main concern is whether switching is going to disrupt our team for a quarter. Last time we changed tools it took us six weeks to get back to baseline.
[Buyer] I haven't actually switched yet because my finance lead is comfortable with the current setup, even though I know we're losing hours every week. It's the path of least resistance.
[Founder] What would amazing look like 12 months from now?
[Buyer] Honestly, I'd save 10 hours a week and finally trust the numbers. That would be life-changing for me.`;

async function main() {
  const e = env();
  console.log("🪶 Featherless smoke test\n");

  const tests = [
    { name: "Objection Extractor", model: e.FEATHERLESS_MODEL_OBJECTIONS, system: OBJECTION_EXTRACTOR_SYSTEM, user: `Transcript:\n${FIXTURE}` },
    { name: "JTBD Detector",       model: e.FEATHERLESS_MODEL_JTBD,       system: JTBD_DETECTOR_SYSTEM,       user: `Transcript:\n${FIXTURE}` },
    { name: "Classifier",          model: e.FEATHERLESS_MODEL_CLASSIFIER, system: CLASSIFIER_SYSTEM,          user: `Outcome: lost\nJTBD: { "push": ["spreadsheet nightmare"], "anxiety": ["6-week ramp"], "habit": ["finance lead comfortable"], "pull": ["save 10h/week"] }\nObjections: ["disruption risk"]` },
    { name: "Voice Extractor",     model: e.FEATHERLESS_MODEL_VOICE,      system: VOICE_EXTRACTOR_SYSTEM,     user: `Transcript:\n${FIXTURE}` },
  ];

  let pass = 0;
  let fail = 0;
  for (const t of tests) {
    process.stdout.write(`${t.name.padEnd(20)} (${t.model}) … `);
    try {
      const start = Date.now();
      const r = await callFeatherless({ model: t.model, system: t.system, user: t.user, jsonOnly: true });
      const ms = Date.now() - start;
      if (r.parsed) {
        console.log(`✅ ${ms}ms`);
        pass++;
      } else {
        console.log(`⚠️  ${ms}ms (non-JSON output)\n   ${r.content.slice(0, 120)}…`);
        fail++;
      }
    } catch (err) {
      console.log(`❌ ${err instanceof Error ? err.message : err}`);
      fail++;
    }
  }

  console.log(`\nResult: ${pass} pass / ${fail} fail`);
  process.exit(fail === 0 ? 0 : 1);
}

main();
