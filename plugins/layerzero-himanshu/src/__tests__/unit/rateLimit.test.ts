import { describe, expect, it, beforeEach } from "vitest";
import { RateLimiter } from "../../utils/rateLimit";

describe("RateLimiter", () => {
  it("should allow requests up to the limit", async () => {
    const limiter = new RateLimiter(5); // 5 requests per second

    const start = Date.now();

    // Should allow 5 requests immediately
    await Promise.all([
      limiter.acquire(),
      limiter.acquire(),
      limiter.acquire(),
      limiter.acquire(),
      limiter.acquire(),
    ]);

    const duration = Date.now() - start;

    // Should complete quickly (within 100ms)
    expect(duration).toBeLessThan(100);
  });

  it("should throttle requests beyond the limit", async () => {
    const limiter = new RateLimiter(2); // 2 requests per second

    const start = Date.now();

    // First 2 should be immediate, 3rd should wait
    await limiter.acquire();
    await limiter.acquire();
    await limiter.acquire(); // This should wait ~500ms

    const duration = Date.now() - start;

    // Should have waited for token refill
    expect(duration).toBeGreaterThan(400);
    expect(duration).toBeLessThan(700);
  });

  it("should refill tokens over time", async () => {
    const limiter = new RateLimiter(10); // 10 rps

    // Use all tokens
    await Promise.all(Array(10).fill(0).map(() => limiter.acquire()));

    // Wait for refill (100ms = 1 token at 10 rps)
    await new Promise((resolve) => setTimeout(resolve, 150));

    const start = Date.now();
    await limiter.acquire(); // Should have refilled token
    const duration = Date.now() - start;

    // Should be immediate (token available)
    expect(duration).toBeLessThan(50);
  });

  it("should handle concurrent requests correctly", async () => {
    const limiter = new RateLimiter(5); // 5 rps

    const results: number[] = [];
    const start = Date.now();

    // 10 concurrent requests
    await Promise.all(
      Array(10)
        .fill(0)
        .map(async (_, i) => {
          await limiter.acquire();
          results.push(Date.now() - start);
        })
    );

    // First 5 should be immediate
    expect(results.slice(0, 5).every((t) => t < 100)).toBe(true);

    // Next 5 should be delayed
    expect(results.slice(5).every((t) => t > 800)).toBe(true);
  });

  it("should work with high request rates", async () => {
    const limiter = new RateLimiter(100); // 100 rps

    const start = Date.now();

    // 100 requests should complete quickly
    await Promise.all(Array(100).fill(0).map(() => limiter.acquire()));

    const duration = Date.now() - start;

    // Should complete within reasonable time
    expect(duration).toBeLessThan(200);
  });

  it("should work with low request rates", async () => {
    const limiter = new RateLimiter(1); // 1 rps

    const start = Date.now();

    await limiter.acquire();
    await limiter.acquire(); // Should wait ~1 second

    const duration = Date.now() - start;

    expect(duration).toBeGreaterThan(900);
    expect(duration).toBeLessThan(1200);
  });

  it("should handle fractional tokens correctly", async () => {
    const limiter = new RateLimiter(3); // 3 rps = 0.003 tokens/ms

    // Use all tokens
    await limiter.acquire();
    await limiter.acquire();
    await limiter.acquire();

    // Wait for partial refill
    await new Promise((resolve) => setTimeout(resolve, 200)); // ~0.6 tokens

    const start = Date.now();
    await limiter.acquire(); // Should wait for remaining ~0.4 tokens
    const duration = Date.now() - start;

    // Should wait for the remaining time
    expect(duration).toBeGreaterThan(100);
    expect(duration).toBeLessThan(250);
  });
});
