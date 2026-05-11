import { GoogleGenerativeAI, type SchemaType } from "@google/generative-ai";
import { PitchAnalysisSchema, type PitchAnalysis } from "@revagent/shared";
import { env } from "../env";
import { PITCH_COUNCIL_SYSTEM } from "../../prompts/pitch-council";
import type { ExtractedSlide } from "./deck-extract";

export interface CouncilResult {
  analysis: PitchAnalysis;
  requestId: string;
}

const responseSchema = {
  type: "object" as SchemaType,
  properties: {
    frame_score: { type: "integer" },
    offer_score: { type: "integer" },
    desire_score: { type: "integer" },
    weakest_slide: { type: "integer" },
    strongest_archetype: { type: "string", enum: ["frame_control", "grand_slam", "desire_amp"] },
    narration_script: { type: "string" },
    slide_critiques: {
      type: "array",
      items: {
        type: "object",
        properties: {
          idx: { type: "integer" },
          frame: { type: "string" },
          offer: { type: "string" },
          desire: { type: "string" },
          notes: { type: "string" },
        },
        required: ["idx", "frame", "offer", "desire"],
      },
    },
    rewrites: {
      type: "object",
      properties: {
        frame_control: { type: "array", items: rewriteItem() },
        grand_slam: { type: "array", items: rewriteItem() },
        desire_amp: { type: "array", items: rewriteItem() },
      },
      required: ["frame_control", "grand_slam", "desire_amp"],
    },
  },
  required: [
    "frame_score", "offer_score", "desire_score",
    "weakest_slide", "strongest_archetype", "narration_script",
    "slide_critiques", "rewrites",
  ],
} as const;

function rewriteItem() {
  return {
    type: "object",
    properties: {
      slide_idx: { type: "integer" },
      original_text: { type: "string" },
      rewritten_text: { type: "string" },
      rationale: { type: "string" },
    },
    required: ["slide_idx", "original_text", "rewritten_text", "rationale"],
  } as const;
}

export async function runPitchCouncil(slides: ExtractedSlide[]): Promise<CouncilResult> {
  const e = env();
  const genai = new GoogleGenerativeAI(e.GEMINI_API_KEY);
  const model = genai.getGenerativeModel({
    model: e.GEMINI_MODEL,
    systemInstruction: PITCH_COUNCIL_SYSTEM,
    generationConfig: {
      // @ts-expect-error responseSchema typing differs between SDK versions
      responseMimeType: "application/json",
      // @ts-expect-error see above
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

  const requestId = `pitch-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: `Deck has ${slides.length} slides. Analyze and respond as instructed.` }, ...parts] }],
  });

  const text = result.response.text();
  const json = JSON.parse(text);
  const parsed = PitchAnalysisSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error(`Gemini council returned invalid shape: ${parsed.error.message}`);
  }
  return { analysis: parsed.data, requestId };
}
