import { getDb, audits, auditJobs } from "@revagent/db";
import type { AuditWebhookPayload } from "@revagent/shared";

export async function enqueueAudit(payload: AuditWebhookPayload): Promise<string> {
  const db = getDb();

  let transcript = payload.transcript_text;
  if (!transcript && payload.transcript_url) {
    const r = await fetch(payload.transcript_url);
    if (!r.ok) throw new Error(`Failed to fetch transcript: ${r.status}`);
    transcript = await r.text();
  }
  if (!transcript) throw new Error("Missing transcript");

  const [auditRow] = await db.insert(audits).values({
    founderId: payload.founder_id,
    dealId: payload.deal_id,
    outcome: payload.outcome,
    transcriptText: transcript,
    pipelineCheckpoint: "objections",
  }).returning();
  if (!auditRow) throw new Error("Failed to create audit");

  await db.insert(auditJobs).values({
    auditId: auditRow.id,
    stage: "objections",
    status: "queued",
  });

  return auditRow.id;
}
