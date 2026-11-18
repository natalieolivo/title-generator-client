// In-memory and per instance: counters reset on cold start and aren't shared
// across serverless instances. Blunts casual spam only.
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 5;
const hits = new Map<string, number[]>();

export function checkRateLimit(key: string): { allowed: boolean } {
  const now = Date.now();
  const timestamps = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    hits.set(key, timestamps);
    return { allowed: false };
  }
  timestamps.push(now);
  hits.set(key, timestamps);
  return { allowed: true };
}
