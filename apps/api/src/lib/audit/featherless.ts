import { env } from "../env";

export interface FeatherlessCallArgs {
  model: string;
  system: string;
  user: string;
  jsonOnly?: boolean;
  temperature?: number;
  maxTokens?: number;
}

export interface FeatherlessResponse<T = unknown> {
  content: string;
  parsed: T | null;
  model: string;
}

/**
 * Call Featherless via the OpenAI-compatible /chat/completions endpoint.
 * Featherless hosts open-source models; the API shape mirrors OpenAI exactly.
 */
export async function callFeatherless<T = unknown>(args: FeatherlessCallArgs): Promise<FeatherlessResponse<T>> {
  const e = env();
  const r = await fetch(`${e.FEATHERLESS_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${e.FEATHERLESS_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: args.model,
      messages: [
        { role: "system", content: args.system },
        { role: "user", content: args.user },
      ],
      temperature: args.temperature ?? 0.3,
      max_tokens: args.maxTokens ?? 2048,
      ...(args.jsonOnly ? { response_format: { type: "json_object" } } : {}),
    }),
  });

  if (!r.ok) {
    throw new Error(`Featherless ${args.model} failed: ${r.status} ${await r.text()}`);
  }
  const json = await r.json() as {
    choices: Array<{ message: { content: string } }>;
    model: string;
  };
  const content = json.choices[0]?.message.content ?? "";
  let parsed: T | null = null;
  if (args.jsonOnly) {
    try { parsed = JSON.parse(content) as T; } catch { parsed = null; }
  }
  return { content, parsed, model: json.model };
}
