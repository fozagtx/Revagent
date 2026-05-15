import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),

  DATABASE_URL: z.string().url(),

  GEMINI_API_KEY: z.string().min(1),
  GEMINI_MODEL: z.string().default("gemini-2.5-pro"),

  SPEECHMATICS_API_KEY: z.string().min(1),
  SPEECHMATICS_RT_URL: z.string().default("wss://eu.rt.speechmatics.com/v2"),

  FEATHERLESS_API_KEY: z.string().min(1),
  FEATHERLESS_BASE_URL: z.string().default("https://api.featherless.ai/v1"),
  FEATHERLESS_MODEL_OBJECTIONS: z.string().default("Qwen/Qwen2.5-32B-Instruct"),
  FEATHERLESS_MODEL_JTBD: z.string().default("meta-llama/Meta-Llama-3.1-8B-Instruct"),
  FEATHERLESS_MODEL_CLASSIFIER: z.string().default("mistralai/Mistral-7B-Instruct-v0.3"),
  FEATHERLESS_MODEL_VOICE: z.string().default("meta-llama/Meta-Llama-3.1-8B-Instruct"),
  // Used when Gemini rate-limits the pitch council / JTBD decoder.
  FEATHERLESS_MODEL_PITCH: z.string().default("Qwen/Qwen2.5-32B-Instruct"),
  FEATHERLESS_MODEL_JTBD_FALLBACK: z.string().default("Qwen/Qwen2.5-32B-Instruct"),

  VULTR_S3_ENDPOINT: z.string().url(),
  VULTR_S3_REGION: z.string().default("ewr1"),
  VULTR_S3_BUCKET: z.string().default("revagent"),
  VULTR_S3_ACCESS_KEY: z.string().min(1),
  VULTR_S3_SECRET_KEY: z.string().min(1),

  RESEND_API_KEY: z.string().min(1),
  RESEND_FROM: z.string().default("digests@revagent.ai"),

  APP_BASE_URL: z.string().default("http://localhost:3000"),
  API_BASE_URL: z.string().default("http://localhost:4000"),
  APP_SHARED_SECRET: z.string().min(16),

  // Dev escape hatch — when "true", skip auth and use DEV_DEMO_EMAIL as the founder.
  AUTH_DISABLED: z.string().optional(),
  DEV_DEMO_EMAIL: z.string().email().default("demo@revagent.local"),
});

export type Env = z.infer<typeof EnvSchema>;

let _env: Env | null = null;
export function env(): Env {
  if (_env) return _env;
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error("❌ Invalid environment:");
    for (const issue of parsed.error.issues) {
      console.error(`  ${issue.path.join(".")}: ${issue.message}`);
    }
    throw new Error("Invalid environment configuration");
  }
  _env = parsed.data;
  return _env;
}

// Lax env for ephemeral commands (CI typecheck, smoke tests) that don't need real secrets.
export function envLax(): Partial<Env> {
  try { return env(); } catch { return process.env as unknown as Partial<Env>; }
}
