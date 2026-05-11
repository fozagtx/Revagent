import { z } from "zod";

// ─── Pitch Surgeon ─────────────────────────────────────────────────────────

export const SlideCritiqueSchema = z.object({
  idx: z.number().int().min(0),
  frame: z.string(),
  offer: z.string(),
  desire: z.string(),
  notes: z.string().optional(),
});
export type SlideCritique = z.infer<typeof SlideCritiqueSchema>;

export const ArchetypeRewriteSchema = z.object({
  slide_idx: z.number().int().min(0),
  original_text: z.string(),
  rewritten_text: z.string(),
  rationale: z.string(),
});
export type ArchetypeRewrite = z.infer<typeof ArchetypeRewriteSchema>;

export const PitchAnalysisSchema = z.object({
  frame_score: z.number().int().min(1).max(10),
  offer_score: z.number().int().min(1).max(10),
  desire_score: z.number().int().min(1).max(10),
  weakest_slide: z.number().int().min(0),
  slide_critiques: z.array(SlideCritiqueSchema),
  rewrites: z.object({
    frame_control: z.array(ArchetypeRewriteSchema),
    grand_slam: z.array(ArchetypeRewriteSchema),
    desire_amp: z.array(ArchetypeRewriteSchema),
  }),
  strongest_archetype: z.enum(["frame_control", "grand_slam", "desire_amp"]),
  narration_script: z.string(),
});
export type PitchAnalysis = z.infer<typeof PitchAnalysisSchema>;

// ─── Discovery Co-Pilot ────────────────────────────────────────────────────

export const Quadrant = z.enum(["push", "pull", "anxiety", "habit"]);
export type Quadrant = z.infer<typeof Quadrant>;

export const TranscriptUtteranceSchema = z.object({
  speaker: z.string(),
  text: z.string(),
  ts_start: z.number(),
  ts_end: z.number(),
});
export type TranscriptUtterance = z.infer<typeof TranscriptUtteranceSchema>;

export const SwitchEvidenceSchema = z.object({
  quote: z.string(),
  ts: z.number(),
  speaker: z.string(),
  confidence: z.number().min(0).max(1),
});
export type SwitchEvidence = z.infer<typeof SwitchEvidenceSchema>;

export const SwitchChartSchema = z.object({
  push: z.array(SwitchEvidenceSchema),
  pull: z.array(SwitchEvidenceSchema),
  anxiety: z.array(SwitchEvidenceSchema),
  habit: z.array(SwitchEvidenceSchema),
});
export type SwitchChart = z.infer<typeof SwitchChartSchema>;

// WebSocket signal frames (server → client)
export const WsSignalSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("transcript"),
    utterance: TranscriptUtteranceSchema,
    partial: z.boolean(),
  }),
  z.object({
    type: z.literal("signal"),
    quadrant: Quadrant,
    evidence: SwitchEvidenceSchema,
  }),
  z.object({
    type: z.literal("nudge"),
    quadrant: Quadrant,
    suggested_question: z.string(),
  }),
  z.object({
    type: z.literal("status"),
    speechmatics_session_id: z.string().nullable(),
    connected: z.boolean(),
  }),
  z.object({
    type: z.literal("error"),
    message: z.string(),
  }),
]);
export type WsSignal = z.infer<typeof WsSignalSchema>;

// ─── Win-Loss Auditor ──────────────────────────────────────────────────────

export const ObjectionSchema = z.object({
  objection: z.string(),
  raised_by: z.string(),
  ts: z.number().optional(),
  severity: z.enum(["low", "medium", "high"]).default("medium"),
});
export type Objection = z.infer<typeof ObjectionSchema>;

export const JtbdPatternsSchema = z.object({
  push: z.array(z.string()),
  pull: z.array(z.string()),
  anxiety: z.array(z.string()),
  habit: z.array(z.string()),
  pattern_match: z.array(z.string()),
});
export type JtbdPatterns = z.infer<typeof JtbdPatternsSchema>;

export const BuyerPhraseSchema = z.object({
  phrase: z.string(),
  context: z.string(),
  use_case: z.enum(["landing_page", "cold_email", "discovery_script", "ad_copy"]),
});
export type BuyerPhrase = z.infer<typeof BuyerPhraseSchema>;

export const AuditOutcome = z.enum(["won", "lost"]);
export type AuditOutcome = z.infer<typeof AuditOutcome>;

export const AuditClassification = z.enum([
  "matches_won_pattern",
  "matches_lost_pattern",
  "novel",
]);
export type AuditClassification = z.infer<typeof AuditClassification>;

export const FeatherlessModelVersionsSchema = z.object({
  objection_extractor: z.string(),
  jtbd_detector: z.string(),
  classifier: z.string(),
  voice_extractor: z.string(),
});
export type FeatherlessModelVersions = z.infer<typeof FeatherlessModelVersionsSchema>;

// ─── Webhook signatures ────────────────────────────────────────────────────

export const AuditWebhookPayloadSchema = z.object({
  deal_id: z.string().min(1),
  outcome: AuditOutcome,
  transcript_url: z.string().url().optional(),
  transcript_text: z.string().optional(),
  founder_id: z.string().uuid(),
}).refine((v) => v.transcript_url || v.transcript_text, {
  message: "Either transcript_url or transcript_text is required",
});
export type AuditWebhookPayload = z.infer<typeof AuditWebhookPayloadSchema>;
