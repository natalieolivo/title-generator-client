// In-memory and per instance: counters reset on cold start and aren't shared
// across serverless instances. Blunts casual spam only.
const WINDOW_MS = 60_000;
// Units, not requests: one unit per paid Claude call.
const MAX_UNITS_PER_WINDOW = 6;
const hits = new Map<string, number[]>();

export function checkRateLimit(
  key: string,
  cost = 1,
): { allowed: boolean } {
  const now = Date.now();
  const timestamps = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (timestamps.length + cost > MAX_UNITS_PER_WINDOW) {
    hits.set(key, timestamps);
    return { allowed: false };
  }
  for (let i = 0; i < cost; i++) timestamps.push(now);
  hits.set(key, timestamps);
  return { allowed: true };
}
