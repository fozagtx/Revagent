import { Hono } from "hono";
import { env } from "../lib/env";

const health = new Hono();

health.get("/", (c) => c.json({
  status: "ok",
  service: "revagent-api",
  commit_sha: process.env.COMMIT_SHA ?? "dev",
  timestamp: new Date().toISOString(),
}));

health.get("/integrations", async (c) => {
  const e = env();

  const [gemini, speechmatics, featherless, vultr] = await Promise.all([
    probeGemini(e.GEMINI_API_KEY),
    probeSpeechmatics(e.SPEECHMATICS_API_KEY),
    probeFeatherless(e.FEATHERLESS_BASE_URL, e.FEATHERLESS_API_KEY),
    probeVultr(e.VULTR_S3_ENDPOINT),
  ]);

  return c.json({
    gemini,
    speechmatics,
    featherless,
    vultr_object_storage: vultr,
    timestamp: new Date().toISOString(),
  });
});

async function probeGemini(key: string): Promise<"ok" | "fail" | "skip"> {
  if (!key || key === "ci-stub") return "skip";
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`, {
      signal: AbortSignal.timeout(5000),
    });
    return r.ok ? "ok" : "fail";
  } catch { return "fail"; }
}

async function probeSpeechmatics(key: string): Promise<"ok" | "fail" | "skip"> {
  if (!key || key === "ci-stub") return "skip";
  try {
    const r = await fetch("https://asr.api.speechmatics.com/v2/jobs/", {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(5000),
    });
    return r.status < 500 ? "ok" : "fail";
  } catch { return "fail"; }
}

async function probeFeatherless(baseUrl: string, key: string): Promise<"ok" | "fail" | "skip"> {
  if (!key || key === "ci-stub") return "skip";
  try {
    const r = await fetch(`${baseUrl}/models`, {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(5000),
    });
    return r.ok ? "ok" : "fail";
  } catch { return "fail"; }
}

async function probeVultr(endpoint: string): Promise<"ok" | "fail" | "skip"> {
  if (!endpoint) return "skip";
  try {
    const r = await fetch(endpoint, { signal: AbortSignal.timeout(5000) });
    // Any HTTP status means the endpoint is reachable.
    return r.status >= 0 ? "ok" : "fail";
  } catch { return "fail"; }
}

export default health;
