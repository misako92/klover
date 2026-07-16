import "server-only";

/**
 * Simple in-memory rate limiter for server actions.
 * Uses a sliding window approach per key.
 *
 * For production at scale, replace with @upstash/ratelimit + Redis.
 */

interface RateLimitEntry {
  timestamps: number[];
}

const stores = new Map<string, Map<string, RateLimitEntry>>();

/**
 * Creates a rate limiter for a specific action.
 * @param action - Unique action name (e.g. "login", "register")
 * @param maxAttempts - Maximum attempts allowed within the window
 * @param windowMs - Time window in milliseconds
 */
export function rateLimiter(action: string, maxAttempts: number, windowMs: number) {
  if (!stores.has(action)) {
    stores.set(action, new Map());
  }
  const store = stores.get(action)!;

  return {
    /**
     * Check if the key is within rate limits.
     * @param key - Unique identifier (e.g. email, IP)
     * @returns true if allowed, false if rate limited
     */
    check(key: string): boolean {
      const now = Date.now();
      const entry = store.get(key);

      if (!entry) {
        store.set(key, { timestamps: [now] });
        return true;
      }

      // Remove timestamps outside the window
      entry.timestamps = entry.timestamps.filter((ts) => now - ts < windowMs);

      if (entry.timestamps.length >= maxAttempts) {
        return false;
      }

      entry.timestamps.push(now);
      return true;
    },
  };
}
