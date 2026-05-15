import { Hono } from "hono";
import { z } from "zod";
import { getDb, founders } from "@revagent/db";
import { eq } from "drizzle-orm";
import { setSessionCookie, clearSessionCookie, requireFounder, getFounderId } from "../lib/auth";

const auth = new Hono<{ Variables: { founderId: string } }>();

const LoginSchema = z.object({
  email: z.string().email(),
  display_name: z.string().optional(),
});

auth.post("/login", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = LoginSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid payload", details: parsed.error.issues }, 400);
  }

  const db = getDb();
  const existing = await db.select().from(founders).where(eq(founders.email, parsed.data.email)).limit(1);
  let founderRow = existing[0];
  if (!founderRow) {
    const [inserted] = await db.insert(founders).values({
      email: parsed.data.email,
      displayName: parsed.data.display_name ?? null,
    }).returning();
    founderRow = inserted;
  }
  if (!founderRow) return c.json({ error: "Failed to create founder" }, 500);

  setSessionCookie(c, founderRow.id);

  return c.json({
    founder_id: founderRow.id,
    email: founderRow.email,
    display_name: founderRow.displayName,
  });
});

auth.post("/logout", async (c) => {
  clearSessionCookie(c);
  return c.json({ ok: true });
});

auth.get("/me", requireFounder, async (c) => {
  const db = getDb();
  const [row] = await db.select().from(founders).where(eq(founders.id, getFounderId(c))).limit(1);
  if (!row) {
    clearSessionCookie(c);
    return c.json({ error: "Unauthorized" }, 401);
  }
  return c.json({
    founder_id: row.id,
    email: row.email,
    display_name: row.displayName,
  });
});

export default auth;
