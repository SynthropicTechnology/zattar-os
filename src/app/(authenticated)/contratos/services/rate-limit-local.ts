const RATE_LIMIT_STORE = new Map<string, { count: number; resetAt: number }>();

export interface RateLimitInput {
  key: string;
  budget: number;
  windowMs: number;
}

/**
 * Simple in-memory rate limiter. Suitable for a single Node process.
 * For multi-instance deployments, swap for a Redis-backed limiter later.
 */
export function checkRateLimit(input: RateLimitInput): boolean {
  const now = Date.now();
  const entry = RATE_LIMIT_STORE.get(input.key);

  if (!entry || entry.resetAt <= now) {
    RATE_LIMIT_STORE.set(input.key, {
      count: 1,
      resetAt: now + input.windowMs,
    });
    return true;
  }

  if (entry.count >= input.budget) {
    return false;
  }

  entry.count += 1;
  return true;
}
