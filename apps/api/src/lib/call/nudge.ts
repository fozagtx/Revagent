import { suggestProbe } from "../../prompts/jtbdProbes";
import type { Quadrant, SwitchChart } from "@revagent/shared";

export const NUDGE_AFTER_MS = 8 * 60 * 1000;

export function maybeNudge(args: {
  callStartedAt: number;
  switchChart: SwitchChart;
  alreadyNudged: Set<Quadrant>;
  askedProbes: string[];
}): { quadrant: Quadrant; suggested_question: string } | null {
  if (Date.now() - args.callStartedAt < NUDGE_AFTER_MS) return null;

  const empty: Quadrant[] = (["push", "pull", "anxiety", "habit"] as Quadrant[])
    .filter((q) => args.switchChart[q].length === 0 && !args.alreadyNudged.has(q));

  if (empty.length === 0) return null;
  const target = empty[0]!;
  args.alreadyNudged.add(target);
  return {
    quadrant: target,
    suggested_question: suggestProbe(target, args.askedProbes),
  };
}
