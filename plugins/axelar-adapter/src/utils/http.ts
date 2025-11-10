/**
 * HTTP utilities for rate limiting, retries, and resilience
 * Uses simple in-memory rate limiting without external dependencies
 */

export interface HttpUtilsConfig {
  maxConcurrent: number;
  minTime: number;
}

/**
 * Simple rate limiter implementation (in-memory, no external deps)
 * Limits concurrent requests and enforces minimum time between requests
 */
class SimpleRateLimiter {
  private concurrent = 0;
  private queue: Array<(value?: unknown) => void> = [];
  private lastRequestTime = 0;
  private maxConcurrent: number;
  private minTime: number;

  constructor(maxConcurrent: number = 5, minTime: number = 200) {
    this.maxConcurrent = maxConcurrent;
    this.minTime = minTime;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Wait for slot to be available
    while (
      this.concurrent >= this.maxConcurrent ||
      Date.now() - this.lastRequestTime < this.minTime
    ) {
      await new Promise((resolve) => {
        this.queue.push(resolve);
        setTimeout(() => resolve(undefined), this.minTime);
      });
    }

    this.concurrent++;
    this.lastRequestTime = Date.now();

    try {
      return await fn();
    } finally {
      this.concurrent--;
      const resolve = this.queue.shift();
      if (resolve) resolve();
    }
  }

  configure(config: Partial<HttpUtilsConfig>) {
    if (config.maxConcurrent) this.maxConcurrent = config.maxConcurrent;
    if (config.minTime) this.minTime = config.minTime;
  }
}

/**
 * HTTP utilities singleton
 */
export class HttpUtils {
  private static limiter = new SimpleRateLimiter(5, 200);

  /**
   * Configure rate limiter
   */
  static configure(config: HttpUtilsConfig) {
    HttpUtils.limiter.configure(config);
  }

  /**
   * Make a rate-limited fetch request with retries
   * 
   * @param url URL to fetch
   * @param options Fetch options
   * @param retries Number of retry attempts (default: 3)
   * @returns Fetch response
   */
  static async fetch(
    url: string,
    options: RequestInit = {},
    retries: number = 3
  ): Promise<Response> {
    return HttpUtils.limiter.execute(async () => {
      let lastError: Error | null = null;

      for (let attempt = 0; attempt < retries; attempt++) {
        try {
          const response = await fetch(url, {
            ...options,
            // Add timeout via AbortSignal
            signal: options.signal ||
              (AbortSignal as any).timeout?.(10000) || undefined,
          } as any);

          // Check for rate limiting
          if (response.status === 429) {
            const retryAfter = response.headers.get("retry-after");
            const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 1000;
            await new Promise((resolve) => setTimeout(resolve, waitTime));
            continue;
          }

          if (!response.ok && attempt < retries - 1) {
            lastError = new Error(
              `HTTP ${response.status}: ${response.statusText}`
            );
            // Exponential backoff
            await new Promise((resolve) =>
              setTimeout(resolve, Math.pow(2, attempt) * 100)
            );
            continue;
          }

          return response;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          if (attempt < retries - 1) {
            // Exponential backoff
            await new Promise((resolve) =>
              setTimeout(resolve, Math.pow(2, attempt) * 100)
            );
          }
        }
      }

      throw lastError || new Error("Max retries exceeded");
    });
  }

  /**
   * Make a rate-limited JSON request
   * 
   * @param url URL to fetch
   * @param options Fetch options
   * @returns Parsed JSON response
   */
  static async fetchJson<T = any>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await HttpUtils.fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json() as Promise<T>;
  }

  /**
   * Make a rate-limited POST request
   * 
   * @param url URL to fetch
   * @param body Request body
   * @param options Fetch options
   * @returns Parsed JSON response
   */
  static async post<T = any>(
    url: string,
    body?: any,
    options: RequestInit = {}
  ): Promise<T> {
    return HttpUtils.fetchJson(url, {
      ...options,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * Make a rate-limited GET request
   * 
   * @param url URL to fetch
   * @param options Fetch options
   * @returns Parsed JSON response
   */
  static async get<T = any>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    return HttpUtils.fetchJson(url, {
      ...options,
      method: "GET",
    });
  }
}
