/**
 * Token bucket rate limiter for API request throttling
 */

export class TokenBucketRateLimiter {
  private tokens: number;
  private lastRefill: number;

  constructor(
    private readonly maxTokens: number,
    private readonly refillRate: number // tokens per second
  ) {
    this.tokens = maxTokens;
    this.lastRefill = Date.now();
  }

  /**
   * Refill tokens based on elapsed time
   */
  private refill(): void {
    const now = Date.now();
    const elapsedSeconds = (now - this.lastRefill) / 1000;
    const tokensToAdd = elapsedSeconds * this.refillRate;

    this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  /**
   * Try to consume a token, return true if successful
   */
  tryConsume(tokens: number = 1): boolean {
    this.refill();

    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }

    return false;
  }

  /**
   * Wait until token is available and consume it
   */
  async consume(tokens: number = 1): Promise<void> {
    while (!this.tryConsume(tokens)) {
      const waitTime = this.getWaitTime(tokens);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  /**
   * Calculate time to wait for tokens to be available
   */
  private getWaitTime(tokens: number): number {
    this.refill();
    const tokensNeeded = tokens - this.tokens;
    if (tokensNeeded <= 0) return 0;
    return (tokensNeeded / this.refillRate) * 1000; // ms
  }

  /**
   * Get current token count
   */
  getAvailableTokens(): number {
    this.refill();
    return this.tokens;
  }

  /**
   * Reset rate limiter
   */
  reset(): void {
    this.tokens = this.maxTokens;
    this.lastRefill = Date.now();
  }
}

