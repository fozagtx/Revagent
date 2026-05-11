import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, audits } from "@revagent/db";
import {
  ObjectionSchema, JtbdPatternsSchema, BuyerPhraseSchema,
  AuditClassification, type FeatherlessModelVersions,
} from "@revagent/shared";
import { env } from "../env";
import { callFeatherless } from "./featherless";
import { OBJECTION_EXTRACTOR_SYSTEM } from "../../prompts/audit/objections";
import { JTBD_DETECTOR_SYSTEM } from "../../prompts/audit/jtbd";
import { CLASSIFIER_SYSTEM } from "../../prompts/audit/classifier";
import { VOICE_EXTRACTOR_SYSTEM } from "../../prompts/audit/voice";

export type PipelineStage = "objections" | "jtbd" | "classify" | "voice" | "complete";

const ObjectionsResponse = z.object({ objections: z.array(ObjectionSchema) });
const VoiceResponse = z.object({ phrases: z.array(BuyerPhraseSchema) });
const ClassifierResponse = z.object({
  classification: AuditClassification,
  evidence: z.array(z.object({ claim: z.string(), quote_or_pattern: z.string() })),
  confidence: z.number().min(0).max(1),
});

export async function runStage(auditId: string, fromStage: PipelineStage): Promise<PipelineStage> {
  const db = getDb();
  const e = env();
  const rows = await db.select().from(audits).where(eq(audits.id, auditId)).limit(1);
  const audit = rows[0];
  if (!audit) throw new Error(`Audit ${auditId} not found`);
  if (!audit.transcriptText) throw new Error(`Audit ${auditId} has no transcript`);

  const modelVersions: FeatherlessModelVersions = (audit.featherlessModelVersions as FeatherlessModelVersions | null) ?? {
    objection_extractor: "",
    jtbd_detector: "",
    classifier: "",
    voice_extractor: "",
  };

  switch (fromStage) {
    case "objections": {
      const r = await callFeatherless<unknown>({
        model: e.FEATHERLESS_MODEL_OBJECTIONS,
        system: OBJECTION_EXTRACTOR_SYSTEM,
        user: `Transcript:\n${audit.transcriptText}`,
        jsonOnly: true,
        maxTokens: 4096,
      });
      const parsed = ObjectionsResponse.safeParse(r.parsed);
      if (!parsed.success) throw new Error(`Stage objections: bad JSON — ${parsed.error.message}`);
      modelVersions.objection_extractor = r.model;
      await db.update(audits).set({
        objections: parsed.data.objections,
        featherlessModelVersions: modelVersions,
        pipelineCheckpoint: "jtbd",
      }).where(eq(audits.id, auditId));
      return "jtbd";
    }
    case "jtbd": {
      const r = await callFeatherless<unknown>({
        model: e.FEATHERLESS_MODEL_JTBD,
        system: JTBD_DETECTOR_SYSTEM,
        user: `Transcript:\n${audit.transcriptText}`,
        jsonOnly: true,
        maxTokens: 4096,
      });
      const parsed = JtbdPatternsSchema.safeParse(r.parsed);
      if (!parsed.success) throw new Error(`Stage jtbd: bad JSON — ${parsed.error.message}`);
      modelVersions.jtbd_detector = r.model;
      await db.update(audits).set({
        jtbdPatterns: parsed.data,
        featherlessModelVersions: modelVersions,
        pipelineCheckpoint: "classify",
      }).where(eq(audits.id, auditId));
      return "classify";
    }
    case "classify": {
      const r = await callFeatherless<unknown>({
        model: e.FEATHERLESS_MODEL_CLASSIFIER,
        system: CLASSIFIER_SYSTEM,
        user: `Outcome: ${audit.outcome}
JTBD pattern: ${JSON.stringify(audit.jtbdPatterns)}
Objections: ${JSON.stringify(audit.objections)}`,
        jsonOnly: true,
        temperature: 0.2,
      });
      const parsed = ClassifierResponse.safeParse(r.parsed);
      if (!parsed.success) throw new Error(`Stage classify: bad JSON — ${parsed.error.message}`);
      modelVersions.classifier = r.model;
      await db.update(audits).set({
        classification: parsed.data.classification,
        classificationEvidence: parsed.data.evidence,
        featherlessModelVersions: modelVersions,
        pipelineCheckpoint: "voice",
      }).where(eq(audits.id, auditId));
      return "voice";
    }
    case "voice": {
      const r = await callFeatherless<unknown>({
        model: e.FEATHERLESS_MODEL_VOICE,
        system: VOICE_EXTRACTOR_SYSTEM,
        user: `Transcript:\n${audit.transcriptText}`,
        jsonOnly: true,
        maxTokens: 3072,
      });
      const parsed = VoiceResponse.safeParse(r.parsed);
      if (!parsed.success) throw new Error(`Stage voice: bad JSON — ${parsed.error.message}`);
      modelVersions.voice_extractor = r.model;
      await db.update(audits).set({
        buyerLanguage: parsed.data.phrases,
        featherlessModelVersions: modelVersions,
        pipelineCheckpoint: "complete",
        completedAt: new Date(),
      }).where(eq(audits.id, auditId));
      return "complete";
    }
    case "complete":
      return "complete";
  }
}

export const PIPELINE_STAGES: PipelineStage[] = ["objections", "jtbd", "classify", "voice", "complete"];
