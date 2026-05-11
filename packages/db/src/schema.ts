import {
  pgTable, uuid, text, integer, timestamp, jsonb, check, index, date, pgEnum,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const auditOutcome = pgEnum("audit_outcome", ["won", "lost"]);
export const auditClassification = pgEnum("audit_classification", [
  "matches_won_pattern",
  "matches_lost_pattern",
  "novel",
]);
export const jobStatus = pgEnum("job_status", [
  "queued",
  "running",
  "completed",
  "failed",
]);

export const founders = pgTable("founders", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  displayName: text("display_name"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const pitchAnalyses = pgTable("pitch_analyses", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  founderId: uuid("founder_id").notNull().references(() => founders.id, { onDelete: "cascade" }),
  deckFilename: text("deck_filename").notNull(),
  deckUrl: text("deck_url").notNull(),
  numSlides: integer("num_slides"),
  frameScore: integer("frame_score"),
  offerScore: integer("offer_score"),
  desireScore: integer("desire_score"),
  weakestSlideIdx: integer("weakest_slide_idx"),
  slideCritiques: jsonb("slide_critiques").notNull(),
  rewrites: jsonb("rewrites"),
  strongestArchetype: text("strongest_archetype"),
  narrationAudioUrl: text("narration_audio_url"),
  geminiRequestId: text("gemini_request_id"),
  status: text("status").default("processing").notNull(),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  founderIdx: index("idx_pitch_founder").on(t.founderId, t.createdAt),
  frameChk: check("pitch_frame_chk", sql`${t.frameScore} IS NULL OR (${t.frameScore} BETWEEN 1 AND 10)`),
  offerChk: check("pitch_offer_chk", sql`${t.offerScore} IS NULL OR (${t.offerScore} BETWEEN 1 AND 10)`),
  desireChk: check("pitch_desire_chk", sql`${t.desireScore} IS NULL OR (${t.desireScore} BETWEEN 1 AND 10)`),
}));

export const calls = pgTable("calls", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  founderId: uuid("founder_id").notNull().references(() => founders.id, { onDelete: "cascade" }),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
  endedAt: timestamp("ended_at", { withTimezone: true }),
  durationSec: integer("duration_sec"),
  transcript: jsonb("transcript"),
  switchChart: jsonb("switch_chart"),
  followUps: jsonb("follow_ups"),
  speechmaticsSessionId: text("speechmatics_session_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  founderIdx: index("idx_calls_founder").on(t.founderId, t.startedAt),
}));

export const audits = pgTable("audits", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  founderId: uuid("founder_id").notNull().references(() => founders.id, { onDelete: "cascade" }),
  dealId: text("deal_id").notNull(),
  outcome: auditOutcome("outcome").notNull(),
  sourceCallIds: jsonb("source_call_ids"),
  transcriptText: text("transcript_text"),
  objections: jsonb("objections"),
  jtbdPatterns: jsonb("jtbd_patterns"),
  classification: auditClassification("classification"),
  classificationEvidence: jsonb("classification_evidence"),
  buyerLanguage: jsonb("buyer_language"),
  digestPdfUrl: text("digest_pdf_url"),
  featherlessModelVersions: jsonb("featherless_model_versions"),
  pipelineCheckpoint: text("pipeline_checkpoint").default("queued").notNull(),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
}, (t) => ({
  outcomeIdx: index("idx_audits_outcome").on(t.founderId, t.outcome, t.createdAt),
}));

export const weeklyDigests = pgTable("weekly_digests", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  founderId: uuid("founder_id").notNull().references(() => founders.id, { onDelete: "cascade" }),
  weekStarting: date("week_starting").notNull(),
  auditIds: jsonb("audit_ids").notNull(),
  pdfUrl: text("pdf_url").notNull(),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  openedAt: timestamp("opened_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Audit pipeline job queue (owned by winloss-auditor; declared here to keep schema centralized)
export const auditJobs = pgTable("audit_jobs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  auditId: uuid("audit_id").notNull().references(() => audits.id, { onDelete: "cascade" }),
  stage: text("stage").notNull(),
  status: jobStatus("status").default("queued").notNull(),
  payload: jsonb("payload"),
  result: jsonb("result"),
  attempts: integer("attempts").default(0).notNull(),
  errorMessage: text("error_message"),
  claimedAt: timestamp("claimed_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  statusIdx: index("idx_audit_jobs_status").on(t.status, t.createdAt),
  auditIdx: index("idx_audit_jobs_audit").on(t.auditId, t.stage),
}));

export type Founder = typeof founders.$inferSelect;
export type NewFounder = typeof founders.$inferInsert;
export type PitchAnalysis = typeof pitchAnalyses.$inferSelect;
export type NewPitchAnalysis = typeof pitchAnalyses.$inferInsert;
export type Call = typeof calls.$inferSelect;
export type NewCall = typeof calls.$inferInsert;
export type Audit = typeof audits.$inferSelect;
export type NewAudit = typeof audits.$inferInsert;
export type WeeklyDigest = typeof weeklyDigests.$inferSelect;
export type AuditJob = typeof auditJobs.$inferSelect;
export type NewAuditJob = typeof auditJobs.$inferInsert;
