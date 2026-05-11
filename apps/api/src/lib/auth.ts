import { createHmac, timingSafeEqual } from "node:crypto";
import { Context, MiddlewareHandler } from "hono";
import { env } from "./env";

const DEMO_FOUNDER_HEADER = "x-founder-id";

export function signedToken(founderId: string): string {
  const sig = createHmac("sha256", env().APP_SHARED_SECRET).update(founderId).digest("hex");
  return `${founderId}.${sig}`;
}

export function verifyToken(token: string): string | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [founderId, sig] = parts as [string, string];
  const expected = createHmac("sha256", env().APP_SHARED_SECRET).update(founderId).digest("hex");
  const a = Buffer.from(sig, "hex");
  const b = Buffer.from(expected, "hex");
  if (a.length !== b.length) return null;
  return timingSafeEqual(a, b) ? founderId : null;
}

export function verifyWebhookSignature(body: string, signatureHeader: string | null): boolean {
  if (!signatureHeader) return false;
  const expected = createHmac("sha256", env().APP_SHARED_SECRET).update(body).digest("hex");
  const a = Buffer.from(signatureHeader.replace(/^sha256=/, ""), "hex");
  const b = Buffer.from(expected, "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export const requireFounder: MiddlewareHandler<{ Variables: { founderId: string } }> = async (c, next) => {
  const auth = c.req.header("authorization");
  const headerFounder = c.req.header(DEMO_FOUNDER_HEADER);

  let founderId: string | null = null;
  if (auth?.startsWith("Bearer ")) {
    founderId = verifyToken(auth.slice("Bearer ".length));
  } else if (headerFounder) {
    // Demo path: single-tenant header for fast hackathon iteration.
    founderId = headerFounder;
  }
  if (!founderId) return c.json({ error: "Unauthorized" }, 401);
  c.set("founderId", founderId);
  await next();
};

export function getFounderId(c: Context<{ Variables: { founderId: string } }>): string {
  return c.get("founderId");
}
