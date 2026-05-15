import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { PitchAnalysisSchema, type PitchAnalysis } from "@revagent/shared";
import { env } from "../env";
import { PITCH_COUNCIL_SYSTEM } from "../../prompts/pitchCouncil";
import type { ExtractedSlide } from "./deckExtract";
import { callFeatherless } from "../audit/featherless";
import { withProviderFallback } from "../llm/withFallback";

export interface CouncilResult {
  analysis: PitchAnalysis;
  requestId: string;
  provider: "gemini" | "featherless";
}

const responseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    frame_score: { type: SchemaType.INTEGER },
    offer_score: { type: SchemaType.INTEGER },
    desire_score: { type: SchemaType.INTEGER },
    weakest_slide: { type: SchemaType.INTEGER },
    strongest_archetype: { type: SchemaType.STRING, enum: ["frame_control", "grand_slam", "desire_amp"] },
    narration_script: { type: SchemaType.STRING },
    slide_critiques: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          idx: { type: SchemaType.INTEGER },
          frame: { type: SchemaType.STRING },
          offer: { type: SchemaType.STRING },
          desire: { type: SchemaType.STRING },
          notes: { type: SchemaType.STRING },
        },
        required: ["idx", "frame", "offer", "desire"],
      },
    },
    rewrites: {
      type: SchemaType.OBJECT,
      properties: {
        frame_control: { type: SchemaType.ARRAY, items: rewriteItem() },
        grand_slam: { type: SchemaType.ARRAY, items: rewriteItem() },
        desire_amp: { type: SchemaType.ARRAY, items: rewriteItem() },
      },
      required: ["frame_control", "grand_slam", "desire_amp"],
    },
  },
  required: [
    "frame_score", "offer_score", "desire_score",
    "weakest_slide", "strongest_archetype", "narration_script",
    "slide_critiques", "rewrites",
  ],
};

function rewriteItem() {
  return {
    type: SchemaType.OBJECT,
    properties: {
      slide_idx: { type: SchemaType.INTEGER },
      original_text: { type: SchemaType.STRING },
      rewritten_text: { type: SchemaType.STRING },
      rationale: { type: SchemaType.STRING },
    },
    required: ["slide_idx", "original_text", "rewritten_text", "rationale"],
  };
}

export async function runPitchCouncil(slides: ExtractedSlide[]): Promise<CouncilResult> {
  const requestId = `pitch-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  const { data, provider } = await withProviderFallback(
    () => runGeminiCouncil(slides),
    () => runFeatherlessCouncil(slides),
    { label: "pitch-council" },
  );

  return {
    analysis: data,
    requestId,
    provider: provider === "primary" ? "gemini" : "featherless",
  };
}

async function runGeminiCouncil(slides: ExtractedSlide[]): Promise<PitchAnalysis> {
  const e = env();
  const genai = new GoogleGenerativeAI(e.GEMINI_API_KEY);
  const model = genai.getGenerativeModel({
    model: e.GEMINI_MODEL,
    systemInstruction: PITCH_COUNCIL_SYSTEM,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema,
      temperature: 0.4,
    },
  });

  const parts = slides.flatMap((s) => [
    { text: `Slide ${s.idx + 1} text:\n${s.text || "(no extractable text)"}\nSlide ${s.idx + 1} image:` },
    {
      inlineData: {
        data: s.imageBuffer.toString("base64"),
        mimeType: s.imageMime,
      },
    },
  ]);

  const result = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [
          { text: `Deck has ${slides.length} slides. Analyze and respond as instructed.` },
          ...parts,
        ],
      },
    ],
  });

  const text = result.response.text();
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error("Gemini returned non-JSON output. Retry — this is usually transient.");
  }
  const parsed = PitchAnalysisSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error(`Gemini council returned invalid shape: ${parsed.error.message}`);
  }
  return parsed.data;
}

async function runFeatherlessCouncil(slides: ExtractedSlide[]): Promise<PitchAnalysis> {
  const e = env();
  // Featherless is text-only — fallback uses extracted slide text, no images.
  const slideBlock = slides
    .map((s) => `Slide ${s.idx + 1}:\n${s.text || "(no extractable text)"}`)
    .join("\n\n");

  const user = [
    `Deck has ${slides.length} slides. Analyze it and respond with a single JSON object`,
    "matching the required PitchAnalysis shape (frame_score, offer_score, desire_score 0–10;",
    "weakest_slide index; strongest_archetype one of frame_control/grand_slam/desire_amp;",
    "narration_script ~30s; slide_critiques array; rewrites object with 3 archetype arrays).",
    "",
    "Slides:",
    slideBlock,
  ].join("\n");

  const r = await callFeatherless({
    model: e.FEATHERLESS_MODEL_PITCH,
    system: PITCH_COUNCIL_SYSTEM,
    user,
    jsonOnly: true,
    temperature: 0.4,
    maxTokens: 4096,
  });

  if (!r.parsed) {
    throw new Error(`Featherless fallback returned non-JSON output: ${r.content.slice(0, 200)}`);
  }
  const parsed = PitchAnalysisSchema.safeParse(r.parsed);
  if (!parsed.success) {
    throw new Error(`Featherless fallback returned invalid shape: ${parsed.error.message}`);
  }
  return parsed.data;
}
