/**
 * TTL (Time-To-Live) Cache implementation
 * Reduces API load by caching frequently accessed data
 */
export declare class TTLCache<K, V> {
    private cache;
    private readonly ttlMs;
    private readonly maxSize;
    constructor(ttlMs: number, maxSize?: number);
    /**
     * Get cached value if not expired
     */
    get(key: K): V | undefined;
    /**
     * Set value with TTL
     */
    set(key: K, value: V): void;
    /**
     * Check if key exists and is not expired
     */
    has(key: K): boolean;
    /**
     * Clear all cached entries
     */
    clear(): void;
    /**
     * Get cache statistics
     */
    stats(): {
        size: number;
        maxSize: number;
        ttlMs: number;
    };
}
/**
 * Request Deduplicator - prevents duplicate concurrent requests
 * If the same request is made while one is in-flight, return the existing promise
 */
export declare class RequestDeduplicator<T> {
    private pending;
    /**
     * Deduplicate concurrent requests with the same key
     */
    deduplicate(key: string, fn: () => Promise<T>): Promise<T>;
    /**
     * Clear all pending requests
     */
    clear(): void;
    /**
     * Get number of pending requests
     */
    pendingCount(): number;
}
/**
 * Circuit Breaker - fail fast when external service is down
 * Prevents cascading failures and reduces load on failing services
 */
export declare class CircuitBreaker {
    private readonly failureThreshold;
    private readonly cooldownMs;
    private readonly successThreshold;
    private state;
    private failureCount;
    private successCount;
    private nextAttemptTime;
    constructor(failureThreshold: number, cooldownMs: number, successThreshold?: number);
    /**
     * Execute function with circuit breaker protection
     */
    execute<T>(fn: () => Promise<T>): Promise<T>;
    private onSuccess;
    private onFailure;
    /**
     * Get current state
     */
    getState(): {
        state: string;
        failureCount: number;
        successCount: number;
    };
    /**
     * Force reset to CLOSED state
     */
    reset(): void;
}
