import { beforeEach, describe, expect, it } from 'vitest';
import { consumeRateLimit, resetRateLimits } from '../../src/lib/rate-limit';

describe('Rate limiter', () => {
  beforeEach(() => resetRateLimits());

  it('rejects requests above the limit and resets after the window', () => {
    expect(consumeRateLimit('user-1', { limit: 2, windowMs: 1000, now: 0 }).allowed).toBe(true);
    expect(consumeRateLimit('user-1', { limit: 2, windowMs: 1000, now: 1 }).allowed).toBe(true);
    expect(consumeRateLimit('user-1', { limit: 2, windowMs: 1000, now: 2 }).allowed).toBe(false);
    expect(consumeRateLimit('user-1', { limit: 2, windowMs: 1000, now: 1000 }).allowed).toBe(true);
  });
});
