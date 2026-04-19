import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RateLimiter } from './rate-limiter.js';

describe('RateLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(1000);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('should allow requests under the limit', () => {
    const limiter = new RateLimiter(5);
    for (let i = 0; i < 5; i++) {
      expect(limiter.check()).toBe(true);
    }
  });

  it('should reject requests over the limit', () => {
    const limiter = new RateLimiter(3);
    expect(limiter.check()).toBe(true);
    expect(limiter.check()).toBe(true);
    expect(limiter.check()).toBe(true);
    expect(limiter.check()).toBe(false);
  });

  it('should reset after 1 second', () => {
    const limiter = new RateLimiter(2);
    expect(limiter.check()).toBe(true);
    expect(limiter.check()).toBe(true);
    expect(limiter.check()).toBe(false);

    vi.setSystemTime(2001);
    expect(limiter.check()).toBe(true);
  });

  it('should default to 100 per second', () => {
    const limiter = new RateLimiter();
    for (let i = 0; i < 100; i++) {
      expect(limiter.check()).toBe(true);
    }
    expect(limiter.check()).toBe(false);
  });
});
