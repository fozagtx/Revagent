import { Hono } from "hono";
import { and, desc, eq } from "drizzle-orm";
import { getDb, audits, weeklyDigests } from "@revagent/db";
import { requireFounder, getFounderId, verifyWebhookSignature } from "../lib/auth";
import { AuditWebhookPayloadSchema } from "@revagent/shared";
import { enqueueAudit } from "../lib/audit/queue";

const audit = new Hono<{ Variables: { founderId: string } }>();

// Webhook endpoint — HMAC signed, no founder auth.
audit.post("/webhook", async (c) => {
  const raw = await c.req.text();
  const sig = c.req.header("x-revagent-signature") ?? null;
  if (!verifyWebhookSignature(raw, sig)) return c.json({ error: "Invalid signature" }, 401);

  const json = JSON.parse(raw);
  const parsed = AuditWebhookPayloadSchema.safeParse(json);
  if (!parsed.success) return c.json({ error: "Invalid payload", details: parsed.error.issues }, 400);

  const auditId = await enqueueAudit(parsed.data);
  return c.json({ audit_id: auditId, status: "queued" }, 202);
});

// Manual upload — founder auth, multipart (transcript file + outcome).
audit.use("/manual", requireFounder);
audit.use("/:id", requireFounder);
audit.use("/", requireFounder);
audit.use("/digest/*", requireFounder);

audit.post("/manual", async (c) => {
  const form = await c.req.formData();
  const dealId = form.get("deal_id");
  const outcome = form.get("outcome");
  const transcriptFile = form.get("transcript");
  const founderId = getFounderId(c);

  if (typeof dealId !== "string" || (outcome !== "won" && outcome !== "lost") || !(transcriptFile instanceof File)) {
    return c.json({ error: "Required: deal_id (string), outcome (won|lost), transcript (file)" }, 400);
  }
  const transcript_text = await transcriptFile.text();
  const auditId = await enqueueAudit({
    founder_id: founderId,
    deal_id: dealId,
    outcome,
    transcript_text,
  });
  return c.json({ audit_id: auditId, status: "queued" }, 202);
});

audit.get("/", async (c) => {
  const founderId = getFounderId(c);
  const db = getDb();
  const rows = await db.select().from(audits)
    .where(eq(audits.founderId, founderId))
    .orderBy(desc(audits.createdAt))
    .limit(50);
  return c.json({ audits: rows });
});

audit.get("/:id", async (c) => {
  const id = c.req.param("id");
  const founderId = getFounderId(c);
  const db = getDb();
  const rows = await db.select().from(audits)
    .where(and(eq(audits.id, id), eq(audits.founderId, founderId)))
    .limit(1);
  const row = rows[0];
  if (!row) return c.json({ error: "Not found" }, 404);
  return c.json(row);
});

audit.get("/digest/weekly", async (c) => {
  const founderId = getFounderId(c);
  const db = getDb();
  const rows = await db.select().from(weeklyDigests)
    .where(eq(weeklyDigests.founderId, founderId))
    .orderBy(desc(weeklyDigests.weekStarting))
    .limit(1);
  const row = rows[0];
  if (!row) return c.json({ error: "No digest yet" }, 404);
  return c.json(row);
});

audit.get("/digest/:id/pdf", async (c) => {
  const id = c.req.param("id");
  const founderId = getFounderId(c);
  const db = getDb();
  const rows = await db.select().from(weeklyDigests)
    .where(and(eq(weeklyDigests.id, id), eq(weeklyDigests.founderId, founderId)))
    .limit(1);
  const row = rows[0];
  if (!row) return c.json({ error: "Not found" }, 404);
  return c.redirect(row.pdfUrl);
});

export default audit;
