/**
 * Resilience utilities for API calls with retry and rate limiting
 */
export class ResilienceUtils {
  private static rateLimitMap = new Map<string, number>();
  private static readonly DEFAULT_MIN_INTERVAL = 200; // ms

  /**
   * Execute function with retry and exponential backoff
   */
  static async withRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          throw lastError;
        }
        
        // Exponential backoff: 1s, 2s, 4s, 8s...
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError!;
  }

  /**
   * Rate limit API calls per endpoint
   */
  static async rateLimit(key: string, minInterval: number = this.DEFAULT_MIN_INTERVAL): Promise<void> {
    const now = Date.now();
    const lastCall = this.rateLimitMap.get(key) || 0;
    const timeSinceLastCall = now - lastCall;
    
    if (timeSinceLastCall < minInterval) {
      const waitTime = minInterval - timeSinceLastCall;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.rateLimitMap.set(key, Date.now());
  }

  /**
   * Combine rate limiting with retry mechanism
   */
  static async withRateLimitAndRetry<T>(
    fn: () => Promise<T>,
    rateLimitKey: string,
    options: {
      maxRetries?: number;
      baseDelay?: number;
      minInterval?: number;
    } = {}
  ): Promise<T> {
    const { maxRetries = 3, baseDelay = 1000, minInterval = this.DEFAULT_MIN_INTERVAL } = options;
    
    return this.withRetry(async () => {
      await this.rateLimit(rateLimitKey, minInterval);
      return fn();
    }, maxRetries, baseDelay);
  }
}