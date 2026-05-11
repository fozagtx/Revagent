import { Resend } from "resend";
import { eq } from "drizzle-orm";
import { getDb, founders, weeklyDigests } from "@revagent/db";
import { env } from "../env";

let _resend: Resend | null = null;
function client(): Resend {
  if (_resend) return _resend;
  _resend = new Resend(env().RESEND_API_KEY);
  return _resend;
}

export async function sendDigestEmail(founderId: string, pdfUrl: string, auditIds: string[]) {
  const db = getDb();
  const [founder] = await db.select().from(founders).where(eq(founders.id, founderId)).limit(1);
  if (!founder) throw new Error(`Founder ${founderId} not found`);

  const e = env();
  const trackingPixel = `${e.API_BASE_URL}/api/audit/digest/_pixel/${founderId}.png`;

  const html = `
    <div style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto;">
      <h1 style="color: #1f3a5f;">Your RevAgent Win-Loss Digest</h1>
      <p>The pipeline finished analyzing ${auditIds.length} deal${auditIds.length === 1 ? "" : "s"}.</p>
      <p><a href="${pdfUrl}" style="background:#1f3a5f;color:#fff;padding:10px 16px;text-decoration:none;border-radius:6px;">Open the PDF →</a></p>
      <p style="color:#888;font-size:12px;">Sent by RevAgent · ${new Date().toLocaleDateString()}</p>
      <img src="${trackingPixel}" alt="" width="1" height="1" />
    </div>
  `.trim();

  const r = await client().emails.send({
    from: e.RESEND_FROM,
    to: founder.email,
    subject: "Your RevAgent win-loss digest is ready",
    html,
  });
  if (r.error) throw new Error(`Resend failed: ${r.error.message}`);

  // Persist the digest record.
  const weekStarting = new Date();
  weekStarting.setDate(weekStarting.getDate() - weekStarting.getDay());
  await db.insert(weeklyDigests).values({
    founderId,
    weekStarting: weekStarting.toISOString().slice(0, 10),
    auditIds,
    pdfUrl,
    sentAt: new Date(),
  });
}
