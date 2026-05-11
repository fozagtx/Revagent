#!/usr/bin/env bun
/**
 * Seed the local DB with a demo founder + sample transcripts for the Win-Loss flow.
 * Decks are loaded from `tests/fixtures/decks/`; drop real .pptx files there before running.
 *
 *   bun run scripts/seed-demo.ts
 */
import { getDb, founders, audits } from "@revagent/db";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

const DEMO_FOUNDER_ID = "00000000-0000-0000-0000-000000000000";
const DEMO_EMAIL = "demo@revagent.ai";

async function main() {
  const db = getDb();

  // Idempotent insert of the demo founder.
  await db.insert(founders).values({
    id: DEMO_FOUNDER_ID,
    email: DEMO_EMAIL,
    displayName: "Demo Founder",
  }).onConflictDoNothing();

  console.log(`✅ Demo founder: ${DEMO_FOUNDER_ID} (${DEMO_EMAIL})`);

  // Load sample transcripts and enqueue audits.
  const dir = "tests/fixtures/transcripts";
  let files: string[] = [];
  try {
    files = (await readdir(dir)).filter((f) => f.endsWith(".txt") || f.endsWith(".md"));
  } catch {
    console.log(`(no transcripts in ${dir} — skipping audit seeding)`);
    return;
  }

  for (const f of files) {
    const outcome: "won" | "lost" = f.toLowerCase().includes("won") ? "won" : "lost";
    const text = await readFile(join(dir, f), "utf-8");
    const [row] = await db.insert(audits).values({
      founderId: DEMO_FOUNDER_ID,
      dealId: f.replace(/\.[a-z]+$/i, ""),
      outcome,
      transcriptText: text,
      pipelineCheckpoint: "objections",
    }).returning();
    console.log(`✅ Seeded audit ${row?.id} (${f}, ${outcome})`);
  }

  console.log("\nNext: start the API (`bun run dev`). The background worker will process queued audits.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
