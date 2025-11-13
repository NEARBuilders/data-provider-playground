# @data-provider/plugin-utils

Shared utilities for data provider plugins. Provides HTTP client with rate limiting and retry logic, plus precise decimal math utilities.

## Installation

```bash
bun add @data-provider/plugin-utils
```

## Usage

### HTTP Client with Rate Limiting

```typescript
import { createHttpClient, createRateLimiter } from '@data-provider/plugin-utils';

class DataProviderService {
  private http = createHttpClient({
    baseUrl: 'https://api.example.com',
    rateLimiter: createRateLimiter(10), // 10 requests/second
    timeout: 30000,
    retries: 3
  });

  async fetchData() {
    // GET request with query params
    const data = await this.http.get('/endpoint', {
      params: { amount: '1000', token: 'USDC' }
    });

    // POST request with body
    const result = await this.http.post('/quote', {
      fromToken: 'USDC',
      toToken: 'ETH',
      amount: '1000000'
    });

    return result;
  }
}
```

### Decimal Math Utilities

```typescript
import { calculateEffectiveRate, sumFeesUsd } from '@data-provider/plugin-utils';

// Calculate exchange rate with proper decimal handling
const rate = calculateEffectiveRate(
  '1000000',    // amountIn (6 decimals for USDC)
  '950000',     // amountOut (6 decimals for USDC)
  6,            // decimalsIn
  6             // decimalsOut
);
// rate = 0.95 (5% fee)

const totalFees = sumFeesUsd([
  { amountUSD: '5.00' },
  { amountUSD: '2.50' }
]);
// totalFees = 7.5
```

## Features

### HTTP Client
- ✅ Automatic query parameter encoding
- ✅ JSON request/response handling
- ✅ Exponential backoff with jitter
- ✅ Rate limiting via Bottleneck
- ✅ Timeout and retry configuration
- ✅ Smart error handling (no retry on 4xx except 429)

### Decimal Math
- ✅ Precise decimal calculations
- ✅ Eliminates floating-point precision errors
- ✅ Proper normalization for different decimal places
- ✅ Safe fee aggregation

## API Reference

### HttpClient

```typescript
interface HttpClientConfig {
  baseUrl?: string;
  rateLimiter: Bottleneck;
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>;
}

class HttpClient {
  get<T>(path: string, options?: RequestOptions): Promise<T>
  post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T>
  put<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T>
  delete<T>(path: string, options?: RequestOptions): Promise<T>
}
```

### Rate Limiter

```typescript
function createRateLimiter(requestsPerSecond?: number): Bottleneck
```

### Decimal Utils

```typescript
function calculateEffectiveRate(
  amountIn: string,
  amountOut: string,
  decimalsIn: number,
  decimalsOut: number
): number

function sumFeesUsd(fees: Array<{ amountUSD?: string }>): number | null
```
