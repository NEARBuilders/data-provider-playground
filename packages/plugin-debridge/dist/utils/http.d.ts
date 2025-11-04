/**
 * HTTP utilities with rate limiting and retry logic
 * Production-grade patterns for API resilience
 */
export declare class HttpUtils {
    private static limiter;
    private static lastConfig;
    /**
     * Configure the internal rate limiter. Call this early during plugin initialization
     * to apply env-driven rate limits.
     */
    static configure(options: {
        maxConcurrent?: number;
        minTime?: number;
    }): void;
    /**
     * Return the last applied limiter settings (useful for tests and diagnostics).
     */
    static getLimiterConfig(): {
        maxConcurrent: number;
        minTime: number;
    } | null;
    /**
     * Fetch with exponential backoff, jitter, and rate limiting
     */
    static fetchWithRetry<T>(url: string, options?: RequestInit, maxRetries?: number, baseDelay?: number): Promise<T>;
    /**
     * Calculate exponential backoff with jitter
     */
    private static calculateBackoffDelay;
    private static sleep;
}
