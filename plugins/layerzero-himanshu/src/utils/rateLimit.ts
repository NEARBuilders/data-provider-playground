/**
 * Token bucket rate limiter for API requests
 * Ensures we don't exceed the specified requests per second
 */
export class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly maxTokens: number;
  private readonly refillRate: number; // tokens per millisecond

  constructor(requestsPerSecond: number) {
    this.maxTokens = requestsPerSecond;
    this.tokens = requestsPerSecond;
    this.lastRefill = Date.now();
    this.refillRate = requestsPerSecond / 1000;
  }

  /**
   * Wait until a token is available, then consume it
   */
  async acquire(): Promise<void> {
    while (true) {
      this.refill();

      if (this.tokens >= 1) {
        this.tokens -= 1;
        return;
      }

      // Wait for next token to be available
      const tokensNeeded = 1 - this.tokens;
      const waitTime = Math.ceil(tokensNeeded / this.refillRate);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }

  private refill(): void {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    const tokensToAdd = timePassed * this.refillRate;

    this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }
}
