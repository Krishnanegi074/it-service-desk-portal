interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitOptions {
  limit: number;
  windowMs: number;
  now?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

const processState = globalThis as typeof globalThis & {
  __triagePortalRateLimits?: Map<string, RateLimitEntry>;
};

const entries = processState.__triagePortalRateLimits ?? new Map<string, RateLimitEntry>();
processState.__triagePortalRateLimits = entries;

export function consumeRateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  const now = options.now ?? Date.now();
  const existing = entries.get(key);
  const entry = !existing || existing.resetAt <= now
    ? { count: 0, resetAt: now + options.windowMs }
    : existing;

  entry.count += 1;
  entries.set(key, entry);

  return {
    allowed: entry.count <= options.limit,
    remaining: Math.max(0, options.limit - entry.count),
    resetAt: entry.resetAt
  };
}

export function resetRateLimits() {
  entries.clear();
}
