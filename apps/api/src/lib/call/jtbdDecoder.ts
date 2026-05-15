import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { z } from "zod";
import { env } from "../env";
import type { TranscriptUtterance, Quadrant, SwitchEvidence } from "@revagent/shared";

const DecodeResultSchema = z.object({
  signals: z.array(z.object({
    quadrant: z.enum(["push", "pull", "anxiety", "habit"]),
    quote: z.string(),
    confidence: z.number().min(0).max(1),
    rationale: z.string().optional(),
  })),
});

const responseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    signals: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          quadrant: { type: SchemaType.STRING, enum: ["push", "pull", "anxiety", "habit"] },
          quote: { type: SchemaType.STRING },
          confidence: { type: SchemaType.NUMBER },
          rationale: { type: SchemaType.STRING },
        },
        required: ["quadrant", "quote", "confidence"],
      },
    },
  },
  required: ["signals"],
};

const SYSTEM = `You are a real-time JTBD switch-interview decoder. You read a rolling 5-second window of a sales discovery-call transcript and identify any new evidence of:

- PUSH: friction with current solution / what's broken about today
- PULL: desired outcome / new state the buyer wants
- ANXIETY: concerns about switching / fear of regret
- HABIT: status-quo inertia / why they haven't switched already

Rules:
- Only emit signals that are clearly evidenced in the transcript window. Skip ambiguous statements.
- Quote verbatim from the buyer's words. Do not paraphrase.
- Confidence: 0.5 weak, 0.7 reasonable, 0.9 unmistakable.
- If no signals, return { "signals": [] }.
- Output JSON only.`;

let _model: ReturnType<GoogleGenerativeAI["getGenerativeModel"]> | null = null;
function model() {
  if (_model) return _model;
  const e = env();
  const genai = new GoogleGenerativeAI(e.GEMINI_API_KEY);
  _model = genai.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: SYSTEM,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema,
      temperature: 0.2,
    },
  });
  return _model;
}

export interface DecodedSignal {
  quadrant: Quadrant;
  evidence: SwitchEvidence;
}

export async function decodeWindow(
  window: TranscriptUtterance[],
  alreadyEmittedQuotes: Set<string>,
): Promise<DecodedSignal[]> {
  if (window.length === 0) return [];

  const buyerOnly = window.filter((u) => u.speaker !== "S1"); // assume founder is S1; tune later
  if (buyerOnly.length === 0) return [];

  const transcript = window.map((u) => `[${u.speaker} @ ${u.ts_start.toFixed(1)}s] ${u.text}`).join("\n");

  const result = await model().generateContent({
    contents: [{ role: "user", parts: [{ text: `Transcript window:\n${transcript}` }] }],
  });
  const text = result.response.text();
  const parsed = DecodeResultSchema.safeParse(JSON.parse(text));
  if (!parsed.success) return [];

  const out: DecodedSignal[] = [];
  for (const s of parsed.data.signals) {
    if (alreadyEmittedQuotes.has(s.quote)) continue;
    const matching = window.find((u) => u.text.includes(s.quote)) ?? window[window.length - 1]!;
    out.push({
      quadrant: s.quadrant,
      evidence: {
        quote: s.quote,
        ts: matching.ts_start,
        speaker: matching.speaker,
        confidence: s.confidence,
      },
    });
    alreadyEmittedQuotes.add(s.quote);
  }
  return out;
}

export interface FollowUpSet { questions: string[] }

export async function generateFollowUps(args: {
  switchChart: { push: SwitchEvidence[]; pull: SwitchEvidence[]; anxiety: SwitchEvidence[]; habit: SwitchEvidence[] };
}): Promise<FollowUpSet> {
  const e = env();
  const genai = new GoogleGenerativeAI(e.GEMINI_API_KEY);
  const m = genai.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          questions: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
          },
        },
        required: ["questions"],
      },
      temperature: 0.5,
    },
  });
  const prompt = `Switch chart from a discovery call:
${JSON.stringify(args.switchChart, null, 2)}

Generate exactly 3 high-leverage follow-up questions the founder should send the buyer after this call. Prioritize quadrants with the weakest evidence. Output JSON: { "questions": [string, string, string] }.`;
  const r = await m.generateContent({ contents: [{ role: "user", parts: [{ text: prompt }] }] });
  const parsed = z.object({ questions: z.array(z.string()).length(3) }).safeParse(JSON.parse(r.response.text()));
  if (!parsed.success) return { questions: [] };
  return parsed.data;
}
