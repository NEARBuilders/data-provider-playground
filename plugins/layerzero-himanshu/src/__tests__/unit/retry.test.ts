import { describe, expect, it, vi } from "vitest";
import { withRetry } from "../../utils/retry";

describe("withRetry", () => {
  it("should succeed on first attempt", async () => {
    const fn = vi.fn().mockResolvedValue("success");

    const result = await withRetry(fn, { maxRetries: 3 });

    expect(result).toBe("success");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("should retry on failure and eventually succeed", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error("fail 1"))
      .mockRejectedValueOnce(new Error("fail 2"))
      .mockResolvedValue("success");

    const result = await withRetry(fn, { maxRetries: 3 });

    expect(result).toBe("success");
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("should throw after max retries", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("always fails"));

    await expect(
      withRetry(fn, { maxRetries: 2 })
    ).rejects.toThrow("always fails");

    expect(fn).toHaveBeenCalledTimes(3); // initial + 2 retries
  });

  it("should retry on 429 status", async () => {
    const error429 = { status: 429, message: "Rate limited" };
    const fn = vi
      .fn()
      .mockRejectedValueOnce(error429)
      .mockResolvedValue("success");

    const result = await withRetry(fn, { maxRetries: 3 });

    expect(result).toBe("success");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("should retry on 5xx status", async () => {
    const error500 = { status: 500, message: "Server error" };
    const fn = vi
      .fn()
      .mockRejectedValueOnce(error500)
      .mockResolvedValue("success");

    const result = await withRetry(fn, { maxRetries: 3 });

    expect(result).toBe("success");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("should not retry on 4xx status (except 429)", async () => {
    const error404 = { status: 404, message: "Not found" };
    const fn = vi.fn().mockRejectedValue(error404);

    await expect(
      withRetry(fn, { maxRetries: 3 })
    ).rejects.toEqual(error404);

    expect(fn).toHaveBeenCalledTimes(1); // No retries
  });

  it("should respect custom shouldRetry predicate", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("custom error"));

    await expect(
      withRetry(fn, {
        maxRetries: 3,
        shouldRetry: () => false, // Never retry
      })
    ).rejects.toThrow("custom error");

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("should apply exponential backoff with jitter", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error("fail 1"))
      .mockRejectedValueOnce(new Error("fail 2"))
      .mockResolvedValue("success");

    const start = Date.now();
    await withRetry(fn, {
      maxRetries: 3,
      baseDelayMs: 100,
      maxDelayMs: 1000,
    });
    const duration = Date.now() - start;

    // Should have some delay (at least base delay for 2 retries)
    expect(duration).toBeGreaterThan(100);
    // But not too long (max delay cap)
    expect(duration).toBeLessThan(3000);
  });

  it("should cap delay at maxDelayMs", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error("fail 1"))
      .mockRejectedValueOnce(new Error("fail 2"))
      .mockResolvedValue("success");

    const start = Date.now();
    await withRetry(fn, {
      maxRetries: 5,
      baseDelayMs: 1000,
      maxDelayMs: 500, // Cap is lower than base
    });
    const duration = Date.now() - start;

    // Should respect max delay cap
    expect(duration).toBeLessThan(2000);
  });
});
