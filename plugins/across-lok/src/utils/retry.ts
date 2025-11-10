/**
 * Exponential backoff retry mechanism with jitter
 */

export interface RetryOptions {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  shouldRetry?: (error: unknown) => boolean;
  onRetry?: (attempt: number, error: unknown) => void;
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  baseDelayMs: 300,
  maxDelayMs: 10000,
  shouldRetry: (error: unknown) => {
    if (error instanceof Error) {
      // Retry on network errors, timeouts, and 5xx errors
      const message = error.message.toLowerCase();
      return (
        message.includes('timeout') ||
        message.includes('econnreset') ||
        message.includes('etimedout') ||
        message.includes('http 5')
      );
    }
    return false;
  },
};

/**
 * Calculate delay with exponential backoff and jitter
 */
function calculateDelay(attempt: number, baseDelayMs: number, maxDelayMs: number): number {
  const exponentialDelay = baseDelayMs * Math.pow(2, attempt);
  const jitter = Math.random() * 0.3 * exponentialDelay; // 0-30% jitter
  return Math.min(exponentialDelay + jitter, maxDelayMs);
}

/**
 * Execute function with exponential backoff retry
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: unknown;

  for (let attempt = 0; attempt < opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      const shouldRetry = opts.shouldRetry?.(error) ?? false;
      const isLastAttempt = attempt === opts.maxAttempts - 1;

      if (!shouldRetry || isLastAttempt) {
        throw error;
      }

      const delay = calculateDelay(attempt, opts.baseDelayMs, opts.maxDelayMs);
      
      opts.onRetry?.(attempt + 1, error);

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

