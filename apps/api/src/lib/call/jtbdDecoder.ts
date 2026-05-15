import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { z } from "zod";
import { env } from "../env";
import { callFeatherless } from "../audit/featherless";
import { withProviderFallback } from "../llm/withFallback";
import type { TranscriptUtterance, Quadrant, SwitchEvidence } from "@revagent/shared";

const DecodeResultSchema = z.object({
  signals: z.array(z.object({
    quadrant: z.enum(["push", "pull", "anxiety", "habit"]),
    quote: z.string(),
    confidence: z.number().min(0).max(1),
    rationale: z.string().optional(),
  })),
});

type DecodeResult = z.infer<typeof DecodeResultSchema>;

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

async function geminiDecode(transcript: string): Promise<DecodeResult> {
  const result = await model().generateContent({
    contents: [{ role: "user", parts: [{ text: `Transcript window:\n${transcript}` }] }],
  });
  const text = result.response.text();
  const parsed = DecodeResultSchema.safeParse(JSON.parse(text));
  if (!parsed.success) return { signals: [] };
  return parsed.data;
}

async function featherlessDecode(transcript: string): Promise<DecodeResult> {
  const e = env();
  const r = await callFeatherless({
    model: e.FEATHERLESS_MODEL_JTBD_FALLBACK,
    system: SYSTEM,
    user: `Transcript window:\n${transcript}\n\nRespond with JSON: { "signals": [...] }.`,
    jsonOnly: true,
    temperature: 0.2,
    maxTokens: 768,
  });
  if (!r.parsed) return { signals: [] };
  const parsed = DecodeResultSchema.safeParse(r.parsed);
  return parsed.success ? parsed.data : { signals: [] };
}

export async function decodeWindow(
  window: TranscriptUtterance[],
  alreadyEmittedQuotes: Set<string>,
): Promise<DecodedSignal[]> {
  if (window.length === 0) return [];

  const buyerOnly = window.filter((u) => u.speaker !== "S1"); // assume founder is S1; tune later
  if (buyerOnly.length === 0) return [];

  const transcript = window.map((u) => `[${u.speaker} @ ${u.ts_start.toFixed(1)}s] ${u.text}`).join("\n");

  let decoded: DecodeResult;
  try {
    const r = await withProviderFallback(
      () => geminiDecode(transcript),
      () => featherlessDecode(transcript),
      { label: "jtbd-decode" },
    );
    decoded = r.data;
  } catch {
    // Live call: never propagate decoder failures — just emit no signals this tick.
    return [];
  }

  const out: DecodedSignal[] = [];
  for (const s of decoded.signals) {
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

async function geminiFollowUps(chart: FollowUpSet["questions"] extends never ? never : Parameters<typeof generateFollowUps>[0]["switchChart"]): Promise<FollowUpSet> {
  const e = env();
  const genai = new GoogleGenerativeAI(e.GEMINI_API_KEY);
  const m = genai.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          questions: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        },
        required: ["questions"],
      },
      temperature: 0.5,
    },
  });
  const prompt = followUpsPrompt(chart);
  const r = await m.generateContent({ contents: [{ role: "user", parts: [{ text: prompt }] }] });
  const parsed = z.object({ questions: z.array(z.string()).length(3) }).safeParse(JSON.parse(r.response.text()));
  return parsed.success ? parsed.data : { questions: [] };
}

async function featherlessFollowUps(chart: Parameters<typeof generateFollowUps>[0]["switchChart"]): Promise<FollowUpSet> {
  const e = env();
  const r = await callFeatherless({
    model: e.FEATHERLESS_MODEL_JTBD_FALLBACK,
    system: "You generate short, high-leverage post-call follow-up questions for a B2B founder based on a JTBD switch chart.",
    user: followUpsPrompt(chart),
    jsonOnly: true,
    temperature: 0.5,
    maxTokens: 512,
  });
  if (!r.parsed) return { questions: [] };
  const parsed = z.object({ questions: z.array(z.string()).length(3) }).safeParse(r.parsed);
  return parsed.success ? parsed.data : { questions: [] };
}

function followUpsPrompt(chart: Parameters<typeof generateFollowUps>[0]["switchChart"]): string {
  return `Switch chart from a discovery call:
${JSON.stringify(chart, null, 2)}

Generate exactly 3 high-leverage follow-up questions the founder should send the buyer after this call. Prioritize quadrants with the weakest evidence. Output JSON: { "questions": [string, string, string] }.`;
}

export async function generateFollowUps(args: {
  switchChart: { push: SwitchEvidence[]; pull: SwitchEvidence[]; anxiety: SwitchEvidence[]; habit: SwitchEvidence[] };
}): Promise<FollowUpSet> {
  try {
    const r = await withProviderFallback(
      () => geminiFollowUps(args.switchChart),
      () => featherlessFollowUps(args.switchChart),
      { label: "jtbd-follow-ups" },
    );
    return r.data;
  } catch {
    return { questions: [] };
  }
}
