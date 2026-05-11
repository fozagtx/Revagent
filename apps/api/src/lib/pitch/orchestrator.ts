import { eq } from "drizzle-orm";
import { getDb, pitchAnalyses } from "@revagent/db";
import {
  buildObjectKey, makeS3Client, storageConfigFromEnv, uploadBuffer,
} from "@revagent/shared";
import { extractDeck } from "./deck-extract";
import { runPitchCouncil } from "./gemini-council";
import { narrateScript } from "./narrate";

export interface AnalyzeArgs {
  analysisId: string;
  founderId: string;
  file: File | null;
  slidesUrl: string | null;
}

export async function analyzeDeck(args: AnalyzeArgs): Promise<void> {
  const db = getDb();
  const cfg = storageConfigFromEnv(process.env);
  const s3 = makeS3Client(cfg);

  // 1. Persist the source deck so we have it for re-runs.
  let deckBuffer: Buffer | undefined;
  let deckUrl = "";
  let deckFilename = "";
  if (args.file) {
    deckBuffer = Buffer.from(await args.file.arrayBuffer());
    deckFilename = args.file.name;
    const key = buildObjectKey("deck", args.founderId, args.file.name.split(".").pop() ?? "bin");
    deckUrl = await uploadBuffer(s3, cfg, key, deckBuffer, args.file.type || "application/octet-stream");
  } else if (args.slidesUrl) {
    deckUrl = args.slidesUrl;
    deckFilename = `slides:${args.slidesUrl}`;
  }

  await db.update(pitchAnalyses)
    .set({ deckUrl, deckFilename })
    .where(eq(pitchAnalyses.id, args.analysisId));

  // 2. Per-slide image + text extraction.
  const deck = await extractDeck({
    filename: deckFilename || "deck.pptx",
    buffer: deckBuffer,
    url: args.slidesUrl ?? undefined,
  });

  await db.update(pitchAnalyses)
    .set({ numSlides: deck.slides.length })
    .where(eq(pitchAnalyses.id, args.analysisId));

  // 3. Gemini multimodal 3-persona council.
  const { analysis, requestId } = await runPitchCouncil(deck.slides);

  // 4. Narrate strongest archetype.
  let narrationUrl: string | null = null;
  try {
    const { audio, mime } = await narrateScript(analysis.narration_script);
    const ext = mime.includes("wav") ? "wav" : "mp3";
    const key = buildObjectKey("narration", args.founderId, ext);
    narrationUrl = await uploadBuffer(s3, cfg, key, audio, mime);
  } catch (err) {
    console.warn(`[pitch ${args.analysisId}] narration upload failed`, err);
  }

  // 5. Persist final analysis.
  await db.update(pitchAnalyses).set({
    frameScore: analysis.frame_score,
    offerScore: analysis.offer_score,
    desireScore: analysis.desire_score,
    weakestSlideIdx: analysis.weakest_slide,
    slideCritiques: analysis.slide_critiques,
    rewrites: analysis.rewrites,
    strongestArchetype: analysis.strongest_archetype,
    narrationAudioUrl: narrationUrl,
    geminiRequestId: requestId,
    status: "complete",
  }).where(eq(pitchAnalyses.id, args.analysisId));
}
