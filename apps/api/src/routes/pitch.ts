import { Hono } from "hono";
import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";
import { getDb, pitchAnalyses } from "@revagent/db";
import { requireFounder, getFounderId } from "../lib/auth";
import { analyzeDeck } from "../lib/pitch/orchestrator";

const pitch = new Hono<{ Variables: { founderId: string } }>();
pitch.use("*", requireFounder);

pitch.post("/", async (c) => {
  const form = await c.req.formData();
  const file = form.get("deck");
  const slidesUrl = form.get("slides_url");

  if (!(file instanceof File) && typeof slidesUrl !== "string") {
    return c.json({ error: "Provide a 'deck' file or a 'slides_url' field" }, 400);
  }

  const founderId = getFounderId(c);
  const db = getDb();
  const [row] = await db.insert(pitchAnalyses).values({
    founderId,
    deckFilename: file instanceof File ? file.name : `slides:${slidesUrl}`,
    deckUrl: "pending",
    slideCritiques: [],
    status: "processing",
  }).returning();
  if (!row) return c.json({ error: "Failed to create analysis" }, 500);

  // Fire and forget the orchestrator (in-process worker).
  analyzeDeck({
    analysisId: row.id,
    founderId,
    file: file instanceof File ? file : null,
    slidesUrl: typeof slidesUrl === "string" ? slidesUrl : null,
  }).catch(async (err) => {
    console.error(`[pitch ${row.id}] failed`, err);
    await db.update(pitchAnalyses)
      .set({ status: "failed", errorMessage: err instanceof Error ? err.message : String(err) })
      .where(eq(pitchAnalyses.id, row.id));
  });

  return c.json({ analysis_id: row.id, status: "processing" }, 202);
});

pitch.get("/", async (c) => {
  const founderId = getFounderId(c);
  const db = getDb();
  const rows = await db.select().from(pitchAnalyses)
    .where(eq(pitchAnalyses.founderId, founderId))
    .orderBy(desc(pitchAnalyses.createdAt))
    .limit(50);
  return c.json({ analyses: rows });
});

pitch.get("/:id", async (c) => {
  const id = c.req.param("id");
  const founderId = getFounderId(c);
  const db = getDb();
  const rows = await db.select().from(pitchAnalyses)
    .where(and(eq(pitchAnalyses.id, id), eq(pitchAnalyses.founderId, founderId)))
    .limit(1);
  const row = rows[0];
  if (!row) return c.json({ error: "Not found" }, 404);
  return c.json(row);
});

const Archetype = z.enum(["frame_control", "grand_slam", "desire_amp"]);

pitch.get("/:id/rewrite/:archetype", async (c) => {
  const arch = Archetype.safeParse(c.req.param("archetype"));
  if (!arch.success) return c.json({ error: "Unknown archetype" }, 400);

  const id = c.req.param("id");
  const founderId = getFounderId(c);
  const db = getDb();
  const rows = await db.select().from(pitchAnalyses)
    .where(and(eq(pitchAnalyses.id, id), eq(pitchAnalyses.founderId, founderId)))
    .limit(1);
  const row = rows[0];
  if (!row) return c.json({ error: "Not found" }, 404);

  const rewrites = (row.rewrites ?? {}) as Record<string, unknown>;
  const value = rewrites[arch.data];
  if (!value) return c.json({ error: "Rewrite not generated yet" }, 404);
  return c.json({ archetype: arch.data, rewrite: value });
});

pitch.get("/:id/narration", async (c) => {
  const id = c.req.param("id");
  const founderId = getFounderId(c);
  const db = getDb();
  const rows = await db.select().from(pitchAnalyses)
    .where(and(eq(pitchAnalyses.id, id), eq(pitchAnalyses.founderId, founderId)))
    .limit(1);
  const row = rows[0];
  if (!row?.narrationAudioUrl) return c.json({ error: "Narration not ready" }, 404);
  return c.json({ url: row.narrationAudioUrl });
});

export default pitch;
