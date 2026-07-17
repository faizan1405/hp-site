import "server-only";

/**
 * Best-effort, per-process in-memory rate limiter. It stops accidental
 * double-submits and casual scripted spam within a single warm Vercel
 * function instance, but it is NOT shared across concurrently-scaled
 * instances or reset-on-cold-start — it is not a durable limit. For a
 * guaranteed multi-instance limit, swap this for a durable store (e.g.
 * Upstash Redis via the Vercel Marketplace); `checkRateLimit`'s call sites
 * would not need to change.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/** Crude memory guard for a long-lived warm instance — not a precise LRU. */
const MAX_TRACKED_KEYS = 5000;

export type RateLimitResult =
  | { success: true }
  | { success: false; retryAfterSeconds: number };

export function checkRateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number },
): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    if (buckets.size >= MAX_TRACKED_KEYS) buckets.clear();
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true };
  }

  if (existing.count >= limit) {
    return {
      success: false,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  return { success: true };
}
