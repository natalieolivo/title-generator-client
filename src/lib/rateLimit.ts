// Best-effort, in-memory, per-warm-instance rate limiter. Not distributed —
// resets on cold start, and each concurrent serverless instance has its own
// counters. Acceptable for a portfolio demo; it blunts casual API-cost spam,
// it isn't meant to withstand a determined abuser.
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
