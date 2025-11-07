# Implementation Details - Li.Fi Plugin

This document provides in-depth technical details about the Li.Fi plugin implementation.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Data Flow](#data-flow)
- [API Integration](#api-integration)
- [Resilience Patterns](#resilience-patterns)
- [Contract Compliance](#contract-compliance)
- [Testing Strategy](#testing-strategy)

---

## Architecture Overview

### Component Structure

```
DataProviderService (service.ts)
    ├── Rate Limiter (Token Bucket Algorithm)
    ├── Retry Logic (Exponential Backoff)
    ├── Metadata Cache (Chains & Tokens)
    └── API Clients
        ├── Li.Fi API Client
        └── DefiLlama API Client

Plugin (index.ts)
    ├── Configuration (Variables + Secrets)
    ├── Initialization (Service Setup)
    └── Router (oRPC Endpoints)

Contract (contract.ts)
    └── Type Definitions (Zod Schemas)
```

### Dependencies

| Package | Purpose | Version |
|---------|---------|---------|
| `every-plugin` | Plugin framework | latest |
| `effect` | Functional error handling | ^3.18.1 |
| `zod` | Runtime type validation | latest |
| `msw` | HTTP mocking for tests | ^2.3.0 |
| `vitest` | Test runner | ^3.2.4 |

---

## Data Flow

### Snapshot Request Flow

```
User Request
    ↓
[getSnapshot Endpoint]
    ↓
[ensureMetadataLoaded]
    ├─→ [fetchChains] → Li.Fi /chains
    └─→ [fetchTokens] → Li.Fi /tokens
    ↓
[Parallel Execution]
    ├─→ [getVolumes] → DefiLlama /bridge/lifi
    ├─→ [getRates] → Li.Fi /quote (per route × notional)
    ├─→ [getLiquidity] → Li.Fi /quote (test amounts)
    └─→ [getListedAssets] → From cached tokens
    ↓
[Aggregate Results]
    ↓
[Return ProviderSnapshot]
```

### Error Handling Flow

```
API Request
    ↓
[Rate Limiter] ← Token bucket check
    ↓
[fetchWithRetry]
    ├─ Success → Return response
    └─ Failure
        ├─ Attempt < MAX_RETRIES?
        │   ├─ Yes → Wait (exponential) → Retry
        │   └─ No → Throw error
        └─ Catch in caller
            └─ Log error + Return empty/null
```

---

## API Integration

### 1. Li.Fi Chains Endpoint

**Purpose**: Discover supported blockchains

```typescript
GET https://li.quest/v1/chains

Response:
{
  chains: [
    {
      id: 1,
      name: "Ethereum",
      key: "eth",
      chainType: "EVM",
      nativeToken: { symbol, decimals, address, ... },
      mainnet: true
    },
    ...
  ]
}
```

**Caching**: Loaded once per service instance (lazy)

### 2. Li.Fi Tokens Endpoint

**Purpose**: List all supported tokens per chain

```typescript
GET https://li.quest/v1/tokens

Response:
{
  tokens: {
    "1": [
      {
        address: "0x...",
        symbol: "USDC",
        decimals: 6,
        chainId: 1,
        name: "USD Coin",
        priceUSD: "1.00"
      },
      ...
    ],
    "137": [...],
    ...
  }
}
```

**Caching**: Loaded once per service instance (lazy)

### 3. Li.Fi Quote Endpoint

**Purpose**: Get swap/bridge quotes with fees and gas estimates

```typescript
GET https://li.quest/v1/quote?
  fromChain=1&
  toChain=137&
  fromToken=0xA0b86a33E6442e082877a094f204b01BF645Fe0&
  toToken=0x2791Bca1f2de4661ED88A30C99A7a9449Aa8417&
  fromAmount=1000000&
  fromAddress=0x...

Response:
{
  id: "...",
  type: "lifi",
  tool: "hop",
  estimate: {
    fromAmount: "1000000",
    toAmount: "998000",
    toAmountMin: "995000",
    feeCosts: [
      {
        name: "Bridge Fee",
        amount: "2000",
        amountUSD: "2.00"
      }
    ],
    gasCosts: [
      {
        type: "SEND",
        amount: "4500000000000000",
        amountUSD: "11.25"
      }
    ]
  }
}
```

**Rate Limiting**: Applied per request
**Retry Logic**: 3 attempts with exponential backoff

### 4. DefiLlama Bridge Endpoint

**Purpose**: Historical volume data

```typescript
GET https://bridges.llama.fi/bridge/lifi

Response:
{
  id: "lifi",
  displayName: "LI.FI",
  lastDailyVolume: 1500000,
  lastWeeklyVolume: 10500000,
  lastMonthlyVolume: 45000000
}
```

**Caching**: 10-minute TTL
**Fallback**: Returns empty volumes array on failure

---

## Resilience Patterns

### 1. Rate Limiting (Token Bucket Algorithm)

```typescript
class RateLimiter {
  private tokens: number;
  private readonly maxTokens: number;
  private readonly refillRate: number; // tokens per second
  private lastRefill: number;

  async acquire(): Promise<void> {
    this.refill(); // Add tokens based on time elapsed

    if (this.tokens >= 1) {
      this.tokens -= 1;
      return; // Proceed immediately
    }

    // Calculate wait time
    const waitTime = ((1 - this.tokens) / this.refillRate) * 1000;
    await new Promise(resolve => setTimeout(resolve, waitTime));
    this.tokens = 0;
  }

  private refill() {
    const now = Date.now();
    const timePassed = (now - this.lastRefill) / 1000;
    const tokensToAdd = timePassed * this.refillRate;
    this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }
}
```

**Configuration**:
- Default: 10 requests/second
- ENV: `MAX_REQUESTS_PER_SECOND`

**Behavior**:
- Smooth rate distribution (not burst)
- Non-blocking (async wait)
- Per-service instance

### 2. Exponential Backoff

```typescript
async fetchWithRetry(
  url: string,
  options: RequestInit = {},
  attempt = 0
): Promise<Response> {
  await this.rateLimiter.acquire();

  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    this.timeout
  );

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response;

  } catch (error) {
    clearTimeout(timeoutId);

    if (attempt < this.MAX_RETRIES - 1) {
      const delay = this.RETRY_DELAYS[attempt];
      await new Promise(resolve => setTimeout(resolve, delay));
      return this.fetchWithRetry(url, options, attempt + 1);
    }

    throw error;
  }
}
```

**Retry Schedule**:
1. Immediate attempt
2. Wait 1s → Retry
3. Wait 2s → Retry
4. Wait 4s → Retry
5. Fail (total: 3 retries)

**Timeout**: 15s per attempt (configurable via ENV)

### 3. Graceful Degradation

```typescript
// Volume fetching - fails gracefully
private async getVolumes(windows: Array<"24h" | "7d" | "30d">): Promise<VolumeWindowType[]> {
  try {
    const bridgeData = await this.fetchDefiLlamaVolumes();
    if (!bridgeData) {
      console.warn("[Li.Fi] No volume data available");
      return []; // Empty array, not error
    }
    // ... process data
  } catch (error) {
    console.error("[Li.Fi] Failed to fetch volumes:", error);
    return []; // Empty array, not error
  }
}

// Rate fetching - continues on individual failures
for (const route of routes) {
  for (const notional of notionals) {
    try {
      const quote = await this.fetchQuoteWithRetry(...);
      // ... process quote
    } catch (error) {
      console.error("[Li.Fi] Failed to get quote:", error);
      // Continue to next route/notional
    }
  }
}
```

**Philosophy**: Partial data is better than complete failure

---

## Contract Compliance

### Input Validation

```typescript
// Zod schemas enforce contract at runtime
const input = z.object({
  routes: z.array(z.object({
    source: Asset,
    destination: Asset
  })).min(1), // ← Requires at least one route

  notionals: z.array(z.string()).min(1), // ← Requires at least one notional

  includeWindows: z.array(z.enum(["24h", "7d", "30d"]))
    .default(["24h"])
    .optional()
});
```

### Output Guarantees

```typescript
// Always returns complete structure, never partial
return {
  volumes: VolumeWindow[],      // May be empty []
  rates: Rate[],                 // May be empty []
  liquidity: LiquidityDepth[],   // May be empty []
  listedAssets: {
    assets: Asset[],             // May be empty []
    measuredAt: string
  }
};
```

### Decimal Normalization

```typescript
// Effective rate calculation
const fromAmount = BigInt(quote.estimate.fromAmount);
const toAmount = BigInt(quote.estimate.toAmount);

const effectiveRate =
  (Number(toAmount) / Math.pow(10, destination.decimals)) /
  (Number(fromAmount) / Math.pow(10, source.decimals));

// Example:
// From: 1,000,000 USDC (6 decimals) = 1.0 USDC
// To:     998,000 USDC (6 decimals) = 0.998 USDC
// Rate: 0.998 / 1.0 = 0.998
```

### Liquidity Thresholds

```typescript
// Required: 50bps and 100bps minimum
liquidity: {
  route,
  thresholds: [
    { maxAmountIn: "100000000000", slippageBps: 50 },  // Max for ≤0.5% slippage
    { maxAmountIn: "1000000000000", slippageBps: 100 } // Max for ≤1.0% slippage
  ],
  measuredAt: ISO datetime
}
```

**Implementation**: Progressive quote testing with real slippage calculation

**Algorithm** (`findMaxAmountForSlippage` in service.ts:311-380):
1. **Baseline**: Get quote for 100 units, calculate normalized rate
2. **Progressive testing**: Test amounts [100, 1K, 10K, 100K, 500K, 1M, 5M, 10M]
3. **Slippage calculation**: For each amount:
   ```typescript
   slippage = |baselineRate - actualRate| / baselineRate
   ```
4. **Find maximum**: Record largest amount where `slippage ≤ threshold`
5. **Stop early**: When slippage exceeds threshold or quote fails

**Validation**: Tests verify that `maxAmountAt100bps >= maxAmountAt50bps`

---

## Testing Strategy

### Unit Tests (`service.test.ts`)

**Purpose**: Validate core business logic in isolation

**Approach**:
- MSW mocks all HTTP requests
- No real API calls
- Fast execution (~600ms)

**Coverage**:
```typescript
✓ Complete snapshot structure
✓ Volume windows (24h, 7d, 30d)
✓ Rate generation (route × notional combinations)
✓ Liquidity thresholds (50bps, 100bps)
✓ Asset listing
✓ Multiple routes
✓ Ping/health check
```

### Integration Tests (`plugin.test.ts`)

**Purpose**: Validate plugin lifecycle and contract compliance

**Approach**:
- Full plugin initialization via `createLocalPluginRuntime`
- oRPC client calls
- Contract validation

**Coverage**:
```typescript
✓ Plugin initialization
✓ Complete snapshot via client
✓ Volume data structure
✓ Rate data structure
✓ Liquidity data structure
✓ Asset data structure
✓ Multiple routes handling
✓ Input validation (routes/notionals required)
✓ Ping via client
```

### Mock Data Design

**Realistic**:
- Based on actual Li.Fi API responses
- Correct data types and structures
- Realistic values (fees, gas, amounts)

**Example** (handlers.ts):
```typescript
function createMockQuote(params: URLSearchParams) {
  const fromAmount = params.get('fromAmount') || '1000000';

  // 0.998 rate (0.2% fee)
  const outputAmount = (BigInt(fromAmount) * BigInt(998) / BigInt(1000)).toString();

  return {
    estimate: {
      fromAmount,
      toAmount: outputAmount,
      feeCosts: [{
        name: "Bridge Fee",
        amount: "2000",
        amountUSD: "2.00"
      }],
      gasCosts: [{
        type: "SEND",
        amount: "4500000000000000",
        amountUSD: "11.25"
      }]
    }
  };
}
```

---

## Performance Considerations

### Optimization Strategies

1. **Lazy Metadata Loading**
   - Chains/tokens loaded only on first `getSnapshot` call
   - Cached for lifetime of service instance

2. **Parallel Fetching**
   - `Promise.all` for independent data sources:
     ```typescript
     const [volumes, rates, liquidity, assets] = await Promise.all([
       this.getVolumes(windows),
       this.getRates(routes, notionals),
       this.getLiquidity(routes),
       this.getListedAssets()
     ]);
     ```

3. **Volume Caching**
   - 10-minute TTL on DefiLlama data
   - Reduces API calls by ~6x for frequent requests

4. **Request Batching**
   - Multiple routes processed in single snapshot call
   - Amortizes metadata loading overhead

### Typical Performance

**First Request** (cold start):
- Metadata loading: ~500ms
- Volume fetch: ~200ms
- Quotes (2 routes × 2 notionals): ~800ms
- **Total**: ~1.5s

**Subsequent Requests** (warm):
- Metadata: 0ms (cached)
- Volume: 0ms (cached for 10min)
- Quotes: ~800ms
- **Total**: ~800ms

---

## Security Considerations

### API Key Handling

```typescript
// Plugin configuration (index.ts)
secrets: z.object({
  apiKey: z.string().default("not-required")
})

// Service usage (service.ts)
const headers: HeadersInit = { 'Accept': 'application/json' };
if (this.apiKey && this.apiKey !== 'not-required') {
  headers['x-lifi-api-key'] = this.apiKey;
}
```

**Best Practices**:
- Never hardcode keys
- Use environment variables
- Default to "not-required" for development

### Input Sanitization

**Contract-level** (Zod schemas):
```typescript
chainId: z.string()        // No SQL injection risk
assetId: z.string()        // URL-encoded in API calls
decimals: z.number().int().min(0)
```

**API-level**:
```typescript
// URL params automatically encoded by URLSearchParams
const url = new URL(`${this.baseUrl}/quote`);
url.searchParams.set('fromToken', source.assetId); // Auto-encoded
```

### Error Disclosure

```typescript
// Never expose sensitive details in errors
console.error('[Li.Fi] Failed to fetch quote:', error);
// Logs to server, not returned to client

// Return generic empty data
return [];
```

---

## Future Enhancements

### Potential Improvements

1. **Parallel Quote Fetching**
   ```typescript
   // Current: Sequential
   for (const route of routes) {
     for (const notional of notionals) {
       await fetchQuote(...);
     }
   }

   // Improved: Parallel
   const quotePromises = routes.flatMap(route =>
     notionals.map(notional => fetchQuote(route, notional))
   );
   await Promise.all(quotePromises);
   ```

2. **Token/Chain Cache Persistence**
   - Redis or file-based cache
   - Share across service instances
   - Reduce cold start times

3. **WebSocket Support**
   - Real-time rate updates
   - Subscribe to specific routes
   - Lower latency for UI

4. **Advanced Liquidity Analysis**
   - ✓ **Already implemented**: Progressive quote testing for accurate depth
   - Additional slippage thresholds (25bps, 200bps, 500bps)
   - Price impact curves visualization
   - Historical liquidity trends over time
   - Binary search optimization for faster threshold finding

5. **Metrics & Monitoring**
   - Request latencies
   - Error rates by endpoint
   - Cache hit/miss ratios
   - Rate limit usage

---

## Troubleshooting

### Common Issues

**Issue**: Tests timeout
```bash
Error: Test timed out in 10000ms
```
**Solution**: Ensure MSW mocks are loaded in `vitest.config.ts`:
```typescript
setupFiles: ["./src/__tests__/setup.ts"]
```

**Issue**: Rate limit errors
```bash
429 Too Many Requests
```
**Solution**: Reduce `MAX_REQUESTS_PER_SECOND` or add API key

**Issue**: No volume data
```bash
[Li.Fi] No volume data available from DefiLlama
```
**Solution**:
- Check DefiLlama API status
- Verify network connectivity
- Accept empty array (graceful degradation)

**Issue**: Plugin ID mismatch
```bash
Plugin ID mismatch: expected @every-plugin/template, got @0xjesus/lifi-plugin
```
**Solution**: Update `id` in `src/index.ts` to match test expectations

---

## References

### Official Documentation
- [Li.Fi API Docs](https://docs.li.fi/)
- [Li.Fi SDK](https://docs.li.fi/integrate-li.fi-sdk)
- [DefiLlama Bridge API](https://defillama.com/docs/api)
- [every-plugin Framework](https://github.com/NEARBuilders/every-plugin)

### Related Standards
- [EIP-2612 (Permit)](https://eips.ethereum.org/EIPS/eip-2612)
- [ERC-20 Token Standard](https://eips.ethereum.org/EIPS/eip-20)
- [JSON-RPC 2.0](https://www.jsonrpc.org/specification)

---

**Last Updated**: 2025-01-03
**Version**: 1.0.0
