/**
 * Enhanced HTTP client with retry, caching, rate limiting, and circuit breaker
 */

import { AcrossAPIError, RateLimitError, TimeoutError } from './errors';
import { withRetry } from './retry';
import { SimpleCache, generateCacheKey } from './cache';
import { TokenBucketRateLimiter } from './rateLimiter';
import { CircuitBreaker, CircuitState } from './circuitBreaker';
import { MetricsCollector, type RequestMetrics } from './metrics';

export interface HttpClientConfig {
  baseUrl: string;
  timeout: number;
  apiKey?: string;
  maxRetries: number;
  retryBaseDelayMs: number;
  cacheTTLMs: number;
  rateLimitPerSecond: number;
  circuitBreakerFailureThreshold: number;
  circuitBreakerTimeout: number;
  enableMetrics: boolean;
  enableLogging: boolean;
}

export class EnhancedHttpClient {
  private readonly cache: SimpleCache<unknown>;
  private readonly rateLimiter: TokenBucketRateLimiter;
  private readonly circuitBreaker: CircuitBreaker;
  private readonly metrics: MetricsCollector;

  constructor(private readonly config: HttpClientConfig) {
    this.cache = new SimpleCache(config.cacheTTLMs);
    this.rateLimiter = new TokenBucketRateLimiter(
      config.rateLimitPerSecond * 2, // Bucket size: 2x rate
      config.rateLimitPerSecond
    );
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: config.circuitBreakerFailureThreshold,
      successThreshold: 2,
      timeout: config.circuitBreakerTimeout,
      onStateChange: (state) => {
        if (config.enableLogging) {
          console.log(`[HttpClient] Circuit breaker state changed to: ${state}`);
        }
      },
    });
    this.metrics = new MetricsCollector();
  }

  /**
   * Perform GET request with full enhancement stack
   */
  async get<T>(
    path: string,
    params: Record<string, string> = {},
    options: { cacheable?: boolean; skipRateLimit?: boolean } = {}
  ): Promise<T> {
    const { cacheable = true, skipRateLimit = false } = options;

    // Check cache first
    if (cacheable) {
      const cacheKey = generateCacheKey(`GET:${path}`, params);
      const cached = this.cache.get(cacheKey);
      if (cached !== undefined) {
        if (this.config.enableLogging) {
          console.log(`[HttpClient] Cache hit: ${path}`);
        }
        this.recordMetric(path, 'GET', 200, 0, true, true, 0);
        return cached as T;
      }
    }

    // Rate limiting
    if (!skipRateLimit) {
      await this.rateLimiter.consume();
    }

    // Execute with circuit breaker and retry
    const startTime = Date.now();
    let retryCount = 0;

    try {
      const result = await this.circuitBreaker.execute(() =>
        withRetry(
          async () => {
            const response = await this.performRequest<T>(path, params);
            return response;
          },
          {
            maxAttempts: this.config.maxRetries,
            baseDelayMs: this.config.retryBaseDelayMs,
            maxDelayMs: 10000,
            shouldRetry: (error) => {
              if (error instanceof AcrossAPIError) {
                return error.retryable;
              }
              return false;
            },
            onRetry: (attempt) => {
              retryCount = attempt;
              if (this.config.enableLogging) {
                console.log(`[HttpClient] Retry attempt ${attempt} for ${path}`);
              }
            },
          }
        )
      );

      // Cache successful result
      if (cacheable) {
        const cacheKey = generateCacheKey(`GET:${path}`, params);
        this.cache.set(cacheKey, result);
      }

      const duration = Date.now() - startTime;
      this.recordMetric(path, 'GET', 200, duration, true, false, retryCount);

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const statusCode = error instanceof AcrossAPIError ? error.statusCode : undefined;
      this.recordMetric(path, 'GET', statusCode, duration, false, false, retryCount);
      throw error;
    }
  }

  /**
   * Perform actual HTTP request
   */
  private async performRequest<T>(path: string, params: Record<string, string>): Promise<T> {
    const url = new URL(path.startsWith('http') ? path : `${this.config.baseUrl}${path}`);
    
    // Add query parameters
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: this.getHeaders(),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle different status codes
      if (!response.ok) {
        const text = await response.text();

        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          throw new RateLimitError(
            'Rate limit exceeded',
            retryAfter ? parseInt(retryAfter, 10) : undefined,
            path
          );
        }

        throw new AcrossAPIError(
          `HTTP ${response.status}: ${text}`,
          response.status,
          path,
          response.status >= 500 // 5xx errors are retryable
        );
      }

      return (await response.json()) as T;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof AcrossAPIError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new TimeoutError(`Request timeout after ${this.config.timeout}ms`, path);
        }
        throw new AcrossAPIError(error.message, undefined, path, true);
      }

      throw new AcrossAPIError('Unknown error occurred', undefined, path, true);
    }
  }

  /**
   * Get HTTP headers
   */
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'Across-Data-Adapter/1.0',
    };

    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    return headers;
  }

  /**
   * Record request metrics
   */
  private recordMetric(
    endpoint: string,
    method: string,
    statusCode: number | undefined,
    durationMs: number,
    success: boolean,
    cached: boolean,
    retryCount: number
  ): void {
    if (!this.config.enableMetrics) return;

    this.metrics.recordRequest({
      endpoint,
      method,
      statusCode,
      durationMs,
      success,
      cached,
      retryCount,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get metrics summary
   */
  getMetrics() {
    return this.metrics.getSummary();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return this.cache.getStats();
  }

  /**
   * Get rate limiter status
   */
  getRateLimiterStatus() {
    return {
      availableTokens: this.rateLimiter.getAvailableTokens(),
      maxTokens: this.config.rateLimitPerSecond * 2,
    };
  }

  /**
   * Get circuit breaker status
   */
  getCircuitBreakerStatus() {
    return this.circuitBreaker.getStats();
  }

  /**
   * Get comprehensive health status
   */
  getHealthStatus() {
    const metrics = this.metrics.getSummary();
    const circuitBreaker = this.circuitBreaker.getStats();

    return {
      healthy: circuitBreaker.state === CircuitState.CLOSED && metrics.errorRate < 0.5,
      metrics,
      cache: this.cache.getStats(),
      rateLimiter: this.getRateLimiterStatus(),
      circuitBreaker,
      recentErrors: this.metrics.getRecentErrors(5),
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Reset circuit breaker
   */
  resetCircuitBreaker(): void {
    this.circuitBreaker.reset();
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.cache.destroy();
  }
}

