/**
 * Custom error classes for better error handling and debugging
 */

export class AcrossAPIError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly endpoint?: string,
    public readonly retryable: boolean = false
  ) {
    super(message);
    this.name = 'AcrossAPIError';
  }
}

export class RateLimitError extends AcrossAPIError {
  constructor(
    message: string,
    public readonly retryAfter?: number,
    endpoint?: string
  ) {
    super(message, 429, endpoint, true);
    this.name = 'RateLimitError';
  }
}

export class TimeoutError extends AcrossAPIError {
  constructor(message: string, endpoint?: string) {
    super(message, undefined, endpoint, true);
    this.name = 'TimeoutError';
  }
}

export class ValidationError extends AcrossAPIError {
  constructor(message: string, public readonly field?: string) {
    super(message, 400, undefined, false);
    this.name = 'ValidationError';
  }
}

export class CircuitBreakerError extends AcrossAPIError {
  constructor(message: string, public readonly failureCount: number) {
    super(message, undefined, undefined, false);
    this.name = 'CircuitBreakerError';
  }
}

