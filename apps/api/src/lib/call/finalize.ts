import { and, eq } from "drizzle-orm";
import { getDb, calls } from "@revagent/db";
import type { SwitchChart } from "@revagent/shared";
import { generateFollowUps } from "./jtbd-decoder";

export async function finalizeCall(callId: string, founderId: string) {
  const db = getDb();
  const rows = await db.select().from(calls)
    .where(and(eq(calls.id, callId), eq(calls.founderId, founderId)))
    .limit(1);
  const row = rows[0];
  if (!row) return null;

  const chart = (row.switchChart ?? { push: [], pull: [], anxiety: [], habit: [] }) as SwitchChart;

  let followUps: string[] = [];
  try {
    const r = await generateFollowUps({ switchChart: chart });
    followUps = r.questions;
  } catch (err) {
    console.warn("[call follow-ups]", err);
  }

  await db.update(calls).set({
    endedAt: row.endedAt ?? new Date(),
    followUps,
  }).where(eq(calls.id, callId));

  return {
    call_id: row.id,
    switch_chart: chart,
    follow_ups: followUps,
    speechmatics_session_id: row.speechmaticsSessionId,
  };
}
