import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { PitchAnalysisSchema, type PitchAnalysis } from "@revagent/shared";
import { env } from "../env";
import { PITCH_COUNCIL_SYSTEM } from "../../prompts/pitchCouncil";
import type { ExtractedSlide } from "./deckExtract";

export interface CouncilResult {
  analysis: PitchAnalysis;
  requestId: string;
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

  const requestId = `pitch-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  let result;
  try {
    result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: `Deck has ${slides.length} slides. Analyze and respond as instructed.` }, ...parts] }],
    });
  } catch (err) {
    const m = err instanceof Error ? err.message : String(err);
    if (m.includes("429") || /quota|rate limit/i.test(m)) {
      throw new Error(`Gemini quota exceeded for ${e.GEMINI_MODEL}. Switch GEMINI_MODEL to gemini-2.5-flash or wait for quota reset.`);
    }
    throw err;
  }

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
  return { analysis: parsed.data, requestId };
}
