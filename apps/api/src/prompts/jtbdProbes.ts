import type { Quadrant } from "@revagent/shared";

export const JTBD_PROBES: Record<Quadrant, string[]> = {
  push: [
    "What's the most painful part of how you handle this today?",
    "When did you last get frustrated with your current setup — what triggered it?",
    "What forced you to start looking for an alternative?",
  ],
  pull: [
    "What would 'amazing' look like 12 months from now if this were solved?",
    "Which one outcome would justify the entire switch for you?",
    "What does the ideal version of this workflow do that yours doesn't?",
  ],
  anxiety: [
    "What are you worried might break if you swap solutions?",
    "What's stopped you from making this change already?",
    "Who else needs to bless this decision before you can move?",
  ],
  habit: [
    "Walk me through how you handle this today, step by step.",
    "What's the workaround you've gotten used to?",
    "If you did nothing — kept the status quo — what would actually happen?",
  ],
};

export function suggestProbe(quadrant: Quadrant, askedAlready: string[]): string {
  const probes = JTBD_PROBES[quadrant] ?? [];
  const pool = probes.filter((p) => !askedAlready.includes(p));
  return pool[0] ?? probes[0] ?? "What would you change about how this works today?";
}
