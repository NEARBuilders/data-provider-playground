import Bottleneck from 'bottleneck';

export class HttpUtils {
  private static limiter = new Bottleneck({
    maxConcurrent: 5,
    minTime: 200, // 200ms between requests
  });

  // store the last applied limiter configuration for diagnostics/tests
  private static lastConfig: { maxConcurrent: number; minTime: number } | null = {
    maxConcurrent: 5,
    minTime: 200,
  };

  /**
   * Configure the internal rate limiter. Call this early during plugin initialization
   * to apply env-driven rate limits.
   */
  static configure(options: { maxConcurrent?: number; minTime?: number }) {
    const cfg = {
      maxConcurrent: options.maxConcurrent ?? 5,
      minTime: options.minTime ?? 200,
    };
    this.limiter = new Bottleneck(cfg);
    this.lastConfig = cfg;
  }

  /**
   * Return the last applied limiter settings (useful for tests and diagnostics).
   */
  static getLimiterConfig() {
    return this.lastConfig;
  }

  /**
   * Fetch with exponential backoff, jitter, and rate limiting
   */
  static async fetchWithRetry<T>(
    url: string,
    options: RequestInit = {},
    maxRetries = 3,
    baseDelay = 1000
  ): Promise<T> {
    return this.limiter.schedule(async () => {
      let lastError: Error;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);

          const response = await fetch(url, {
            ...options,
            signal: controller.signal,
            headers: {
              'Content-Type': 'application/json',
              ...options.headers,
            },
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          return await response.json() as T;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          
          if (attempt < maxRetries) {
            const delay = this.calculateBackoffDelay(attempt, baseDelay);
            await this.sleep(delay);
          }
        }
      }

      throw lastError!;
    });
  }

  /**
   * Calculate exponential backoff with jitter
   */
  private static calculateBackoffDelay(attempt: number, baseDelay: number): number {
    const exponentialDelay = baseDelay * Math.pow(2, attempt);
    const jitter = Math.random() * 0.1 * exponentialDelay;
    return exponentialDelay + jitter;
  }

  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}