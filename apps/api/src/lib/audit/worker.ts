import { sql, eq } from "drizzle-orm";
import { getDb, auditJobs, audits } from "@revagent/db";
import { runStage, type PipelineStage } from "./pipeline";
import { generateDigestPdf } from "./digestPdf";
import {
  buildObjectKey, makeS3Client, storageConfigFromEnv, uploadBuffer,
} from "@revagent/shared";
import { sendDigestEmail } from "./email";

const POLL_INTERVAL_MS = 2000;
const MAX_ATTEMPTS = 3;

let running = false;

export async function startAuditWorker() {
  if (running) return;
  running = true;
  void loop();
}

async function loop() {
  while (running) {
    try {
      const claimed = await claimNextJob();
      if (!claimed) {
        await sleep(POLL_INTERVAL_MS);
        continue;
      }
      await processJob(claimed);
    } catch (err) {
      console.error("[audit worker loop]", err);
      await sleep(POLL_INTERVAL_MS);
    }
  }
}

interface ClaimedJob {
  id: string;
  audit_id: string;
  stage: PipelineStage;
  attempts: number;
  [k: string]: unknown;
}

async function claimNextJob(): Promise<ClaimedJob | null> {
  const db = getDb();
  const result = await db.execute<ClaimedJob>(sql`
    UPDATE audit_jobs
    SET status = 'running', claimed_at = now(), attempts = attempts + 1
    WHERE id = (
      SELECT id FROM audit_jobs
      WHERE status = 'queued'
      ORDER BY created_at
      FOR UPDATE SKIP LOCKED
      LIMIT 1
    )
    RETURNING id, audit_id, stage::text AS stage, attempts
  `);
  const rows = (result as unknown as { rows?: ClaimedJob[] }).rows ?? (result as unknown as ClaimedJob[]);
  return Array.isArray(rows) ? (rows[0] ?? null) : null;
}

async function processJob(job: ClaimedJob) {
  const db = getDb();
  try {
    const next = await runStage(job.audit_id, job.stage);
    await db.update(auditJobs).set({
      status: "completed",
      completedAt: new Date(),
    }).where(eq(auditJobs.id, job.id));

    if (next !== "complete") {
      await db.insert(auditJobs).values({
        auditId: job.audit_id,
        stage: next,
        status: "queued",
      });
    } else {
      await finalizeAudit(job.audit_id);
    }
  } catch (err) {
    console.error(`[audit job ${job.id} stage=${job.stage}]`, err);
    const msg = err instanceof Error ? err.message : String(err);
    if (job.attempts >= MAX_ATTEMPTS) {
      await db.update(auditJobs).set({
        status: "failed",
        errorMessage: msg,
      }).where(eq(auditJobs.id, job.id));
      await db.update(audits).set({
        errorMessage: msg,
      }).where(eq(audits.id, job.audit_id));
    } else {
      // Re-queue with the same stage; attempts already incremented.
      await db.update(auditJobs).set({
        status: "queued",
        errorMessage: msg,
      }).where(eq(auditJobs.id, job.id));
    }
  }
}

async function finalizeAudit(auditId: string) {
  const db = getDb();
  const rows = await db.select().from(audits).where(eq(audits.id, auditId)).limit(1);
  const audit = rows[0];
  if (!audit) return;

  const pdf = await generateDigestPdf({ audits: [audit] });
  const cfg = storageConfigFromEnv(process.env);
  const s3 = makeS3Client(cfg);
  const key = buildObjectKey("digest", audit.founderId, "pdf");
  const url = await uploadBuffer(s3, cfg, key, pdf, "application/pdf");

  await db.update(audits).set({ digestPdfUrl: url }).where(eq(audits.id, auditId));

  await sendDigestEmail(audit.founderId, url, [audit.id]).catch((err) => {
    console.warn(`[audit ${auditId}] email failed`, err);
  });
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
