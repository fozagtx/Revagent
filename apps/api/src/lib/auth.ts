import { createHmac, timingSafeEqual } from "node:crypto";
import { Context, MiddlewareHandler } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { eq } from "drizzle-orm";
import { getDb, founders } from "@revagent/db";
import { env } from "./env";

export const SESSION_COOKIE = "session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export function isAuthDisabled(): boolean {
  return env().AUTH_DISABLED === "true";
}

let _demoFounderId: string | null = null;
export async function getDemoFounderId(): Promise<string> {
  if (_demoFounderId) return _demoFounderId;
  const db = getDb();
  const email = env().DEV_DEMO_EMAIL;
  const existing = await db.select().from(founders).where(eq(founders.email, email)).limit(1);
  let row = existing[0];
  if (!row) {
    const [inserted] = await db.insert(founders).values({
      email,
      displayName: "Demo Founder",
    }).returning();
    row = inserted;
  }
  if (!row) throw new Error("Failed to bootstrap demo founder");
  const id = row.id;
  _demoFounderId = id;
  return id;
}

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

export function setSessionCookie(c: Context, founderId: string): void {
  setCookie(c, SESSION_COOKIE, signedToken(founderId), {
    httpOnly: true,
    sameSite: "Lax",
    secure: env().NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export function clearSessionCookie(c: Context): void {
  deleteCookie(c, SESSION_COOKIE, { path: "/" });
}

export async function readFounderFromRequest(req: Request): Promise<string | null> {
  const cookieHeader = req.headers.get("cookie") ?? "";
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]+)`));
  if (match?.[1]) {
    const id = verifyToken(decodeURIComponent(match[1]));
    if (id) return id;
  }
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    const id = verifyToken(auth.slice("Bearer ".length));
    if (id) return id;
  }
  if (isAuthDisabled()) return await getDemoFounderId();
  return null;
}

export const requireFounder: MiddlewareHandler<{ Variables: { founderId: string } }> = async (c, next) => {
  let founderId: string | null = null;

  const cookieToken = getCookie(c, SESSION_COOKIE);
  if (cookieToken) founderId = verifyToken(cookieToken);

  if (!founderId) {
    const auth = c.req.header("authorization");
    if (auth?.startsWith("Bearer ")) {
      founderId = verifyToken(auth.slice("Bearer ".length));
    }
  }

  if (!founderId && isAuthDisabled()) {
    founderId = await getDemoFounderId();
  }

  if (!founderId) return c.json({ error: "Unauthorized" }, 401);
  c.set("founderId", founderId);
  await next();
};

export function getFounderId(c: Context<{ Variables: { founderId: string } }>): string {
  return c.get("founderId");
}
