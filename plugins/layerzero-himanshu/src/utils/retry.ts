/**
 * Exponential backoff with jitter for API retries
 * Formula: backoff = base * 2^attempt + random(0, base)
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries: number;
    baseDelayMs?: number;
    maxDelayMs?: number;
    shouldRetry?: (error: unknown) => boolean;
  }
): Promise<T> {
  const {
    maxRetries,
    baseDelayMs = 500,
    maxDelayMs = 3000,
    shouldRetry = (error) => {
      if (error && typeof error === "object" && "status" in error) {
        const status = (error as { status: number }).status;
        return status === 429 || status >= 500;
      }
      return true;
    },
  } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries || !shouldRetry(error)) {
        throw error;
      }

      // Calculate backoff with jitter
      const exponentialDelay = baseDelayMs * Math.pow(2, attempt);
      const jitter = Math.random() * baseDelayMs;
      const delay = Math.min(exponentialDelay + jitter, maxDelayMs);

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
