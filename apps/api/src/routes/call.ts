import { Hono } from "hono";
import { and, desc, eq } from "drizzle-orm";
import { getDb, calls } from "@revagent/db";
import { requireFounder, getFounderId } from "../lib/auth";
import { finalizeCall } from "../lib/call/finalize";

const call = new Hono<{ Variables: { founderId: string } }>();
call.use("*", requireFounder);

call.post("/start", async (c) => {
  const founderId = getFounderId(c);
  const db = getDb();
  const [row] = await db.insert(calls).values({
    founderId,
    startedAt: new Date(),
  }).returning();
  if (!row) return c.json({ error: "Failed to create call" }, 500);

  const apiBase = process.env.API_BASE_URL ?? `http://localhost:${process.env.PORT ?? 4000}`;
  const wsBase = apiBase.replace(/^http/, "ws");
  return c.json({
    call_id: row.id,
    ws_url: `${wsBase}/api/call/${row.id}/stream`,
  });
});

call.post("/:id/end", async (c) => {
  const id = c.req.param("id");
  const founderId = getFounderId(c);
  const summary = await finalizeCall(id, founderId);
  if (!summary) return c.json({ error: "Not found" }, 404);
  return c.json(summary);
});

call.get("/", async (c) => {
  const founderId = getFounderId(c);
  const db = getDb();
  const rows = await db.select().from(calls)
    .where(eq(calls.founderId, founderId))
    .orderBy(desc(calls.startedAt))
    .limit(50);
  return c.json({ calls: rows });
});

call.get("/:id", async (c) => {
  const id = c.req.param("id");
  const founderId = getFounderId(c);
  const db = getDb();
  const rows = await db.select().from(calls)
    .where(and(eq(calls.id, id), eq(calls.founderId, founderId)))
    .limit(1);
  const row = rows[0];
  if (!row) return c.json({ error: "Not found" }, 404);
  return c.json(row);
});

export default call;
