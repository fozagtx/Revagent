/**
 * Generic primary → fallback wrapper for LLM calls.
 * Falls over to the secondary provider only on rate-limit / quota errors.
 * Other errors (auth, parse, network) re-throw — fallback isn't a free panic button.
 */

export interface FallbackResult<T> {
  data: T;
  provider: "primary" | "fallback";
}

export async function withProviderFallback<T>(
  primary: () => Promise<T>,
  fallback: () => Promise<T>,
  opts: { label?: string } = {},
): Promise<FallbackResult<T>> {
  try {
    const data = await primary();
    return { data, provider: "primary" };
  } catch (err) {
    if (!isRateLimitOrQuota(err)) throw err;
    const label = opts.label ?? "llm";
    console.warn(`[${label}] primary rate-limited → falling back to secondary provider`);
    const data = await fallback();
    return { data, provider: "fallback" };
  }
}

export function isRateLimitOrQuota(err: unknown): boolean {
  const m = err instanceof Error ? err.message : String(err);
  return /\b429\b|quota|rate[\s-]?limit|exceeded|resource[_\s]exhausted/i.test(m);
}
