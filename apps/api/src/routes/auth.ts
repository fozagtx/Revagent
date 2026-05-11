import { Hono } from "hono";
import { z } from "zod";
import { getDb, founders } from "@revagent/db";
import { eq } from "drizzle-orm";
import { signedToken } from "../lib/auth";

const auth = new Hono();

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

  return c.json({
    founder_id: founderRow.id,
    email: founderRow.email,
    token: signedToken(founderRow.id),
  });
});

export default auth;
