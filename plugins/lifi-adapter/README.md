# Li.Fi Data Provider Adapter

A NEAR data provider adapter for cross-chain bridge metrics using the Li.Fi API. This adapter implements the `DataProvider` contract to collect rate quotes, liquidity depth, and supported asset information.

## Features

- **Rate Quotes**: Fetch real-time cross-chain exchange rates via Li.Fi's `/quote` endpoint
- **Liquidity Depth**: Binary search to determine max liquidity at 50bps and 100bps slippage thresholds
- **Asset Discovery**: Get list of all supported tokens and chains from Li.Fi
- **Rate Limiting**: Configurable concurrent request limits and minimum time between requests
- **Error Handling**: Explicit error throwing for failed operations (no silent fallbacks)

## Configuration

### Environment Variables

```bash
# Base URL for Li.Fi API (default: https://li.quest/v1)
LIFI_BASE_URL=https://li.quest/v1

# Rate limiting configuration
LIFI_MAX_CONCURRENT=5           # Maximum concurrent requests (default: 5)
LIFI_MIN_TIME=200               # Minimum milliseconds between requests (default: 200ms)
```

## API Reference

See [Li.Fi API Documentation](https://docs.li.fi/api-reference) for complete API reference.

### Key Endpoints Used

- **GET `/tokens`** - Fetch list of supported tokens across all chains
  - Returns: `{ tokens: { [chainId]: Token[] } }`

- **GET `/quote`** - Get rate quote for a specific route with slippage parameters
  - Parameters: `fromChain`, `toChain`, `fromToken`, `toToken`, `fromAmount`, `slippage`
  - Returns: Quote with `estimate.toAmount` and `estimate.feeCosts`
  - Used for: Rate fetching and liquidity probing via binary search

## Implementation Details

### Volume Metrics (Strategy & Implementation)

**Status**: ✅ **IMPLEMENTED** using Li.Fi's native `/analytics/transfers` endpoint.

**How It Works**:

The `getVolumes()` method uses Li.Fi's **`GET /v2/analytics/transfers`** endpoint to aggregate cross-chain transfer volumes directly from Li.Fi's routing records.

```typescript
getVolumes(windows: ["24h", "7d", "30d"]) {
  1. For each time window, query /v2/analytics/transfers
  2. Filter by: status=DONE, fromTimestamp, toTimestamp
  3. Paginate through all transfers (cursor-based pagination)
  4. Sum all receiving.amountUSD values
  5. Return { window, volumeUsd, measuredAt }
}
```

**Why This Approach?**

✅ **Direct from Source**: Data from Li.Fi's own transaction records - most accurate
✅ **No External Dependencies**: No need for external indexing services
✅ **Self-Contained**: All required data comes from single provider
✅ **Production-Ready**: Rate limits manageable with caching

**Rate Limiting**:
- **Unauthenticated**: 200 requests per 2 hours (~1.6 req/min)
- **Authenticated** (with API key): 200 requests per minute (recommended for production)
- **Important**: Rate limits are enforced over a rolling 2-hour window
- **Recommendation**: Cache results for 30 minutes between updates to stay within limits

**Why v2 Over v1**:
- **v1 endpoint**: Max 1000 transfers per request, NO pagination support
- **v2 endpoint**: Paginated results with `hasNext`, `next`, `previous` fields for complete data
- **Verified by Li.Fi**: v2 is the recommended endpoint for accurate volume aggregation

**Alternative Endpoint - Not Suitable**:
- **`/v1/analytics/transfers/summary`**: Returns wallet-specific cross-chain transfer totals only
  - Limited to cross-chain transfers only (not all transfers)
  - Cannot be used for global volume aggregation
  - 30-day maximum range
  - Not recommended for this use case

**Example Response**:
```json
{
  "volumes": [
    {
      "window": "24h",
      "volumeUsd": 1250000.50,
      "measuredAt": "2025-11-04T23:48:31.832Z"
    },
    {
      "window": "7d",
      "volumeUsd": 8750000.25,
      "measuredAt": "2025-11-04T23:48:31.832Z"
    },
    {
      "window": "30d",
      "volumeUsd": 35000000.00,
      "measuredAt": "2025-11-04T23:48:31.832Z"
    }
  ]
}
```

**Li.Fi Analytics API Reference**:

- **GET `/v1/analytics/transfers`** - Basic transfers endpoint
  - Returns: Up to 1000 transfers per request
  - Parameters: `wallet`, `fromChain`, `toChain`, `fromToken`, `toToken`, `status`, `fromTimestamp`, `toTimestamp`, `integrator`

- **GET `/v2/analytics/transfers`** - Paginated transfers endpoint (RECOMMENDED)
  - Returns: Paginated results with cursor-based pagination
  - Parameters: Same as v1 + `limit`, `next`, `previous`
  - Response: `{ data, hasNext, next, previous }`

See [Li.Fi Analytics Documentation](https://docs.li.fi/api-reference/get-a-paginated-list-of-filtered-transfers) for complete details.

**Caching Strategy** (Recommended for Production):

```typescript
// Cache volume data for 30 minutes
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

// This ensures:
// - 2 requests per hour per window = 6 total per hour
// - Well within 200 req/2hr limit
// - Reduced API load
// - Faster response times
```

4. **Real-Time Volume From Quote Patterns**:
   - Monitor successful quotes to infer liquidity availability
   - Track quote failures to identify liquidity constraints
   - This adapter already uses this approach for liquidity depth measurement

### Liquidity Depth Measurement

Liquidity is determined via **binary search on the `/quote` endpoint**:

1. **How It Works**:
   - Start with a base amount (e.g., 100 USDC equivalent)
   - Call `/quote` with the amount and a fixed slippage threshold (50bps or 100bps)
   - If quote succeeds → liquidity exists at that amount
   - If quote fails → no liquidity at that amount
   - Binary search finds the maximum amount where a quote succeeds

2. **Slippage Thresholds**:
   - **50bps (0.5%)**: Tight tolerance - only for highly liquid pairs
   - **100bps (1.0%)**: Standard tolerance - for most trading pairs

3. **Documentation**:
   - Slippage parameter: https://docs.li.fi/api-reference/get-a-quote-for-a-token-transfer-1
   - Quote endpoint response includes `estimate.toAmountMin` which is calculated as: `toAmount * (1 - slippage)`

## Error Handling

**No Fallback Data**: The adapter throws explicit errors instead of returning stale or dummy data:

```typescript
// ❌ Bad: Returns dummy data on error
// return { maxAmountIn: '1000000', slippageBps: 50 };

// ✅ Good: Throws error for transparency
throw new Error(`Liquidity probing failed for 50bps: ${error.message}`);
```

This design ensures:
- Errors are visible and actionable
- Consumers can handle failures appropriately
- No silent data inaccuracy

## Testing

### Test Commands

```bash
# For CI/CD and production ✅ RECOMMENDED
bun run test

# For local development
bun test

# Watch mode (development)
bun run test:watch
```

### `bun run test` vs `bun test` - Which to Use?

| Use Case | Command | Why |
|----------|---------|-----|
| **Production Build** | `bun run test` ✅ | Deterministic with mocks, 100% pass |
| **CI/CD Pipeline** | `bun run test` ✅ | Consistent, no rate limiting |
| **Local Development** | `bun test` | Quick feedback, real API testing |
| **Debugging** | Both | Different perspectives on issues |

### Technical Details

| Aspect | `bun run test` (Vitest) | `bun test` (Bun native) |
|--------|---|---|
| **Runner** | Vitest ✅ | Bun native |
| **Mocks** | Loaded (`setup.ts`) | Not loaded |
| **API Calls** | Mocked (safe) | Real (rate-limited) |
| **Result** | 16 pass, 1 skip ✅ | May fail at rate limits |
| **For Production** | ✅ YES | ❌ NOT recommended |

**Why the difference?**
- `bun run test` = Runs vitest script from `package.json` → loads `src/__tests__/setup.ts` with mocks
- `bun test` = Bun's native test runner → doesn't load Vitest setup files → hits real Li.Fi API

### Test Organization

```bash
# Run all tests (CI/CD)
bun run test

# Run only unit tests
bun run test:unit

# Run only integration tests
bun run test:integration

# Development: Quick testing with real API
bun test
```

All tests use custom fetch mocking for deterministic responses. See `src/__tests__/setup.ts` for configuration details.


## Development

```bash
# Build the adapter
bun run build

# Type check
bun run type-check

# Demo server (manual testing)
bun run dev
```

## Architecture

```
src/
├── index.ts           # Plugin entry point and configuration
├── service.ts         # Core business logic for data collection
├── contract.ts        # Zod schemas for type-safe data validation
├── utils/
│   ├── decimal.ts     # Decimal.js utilities for precise calculations
│   ├── http.ts        # HTTP client with retry logic and rate limiting
│   └── liquidity.ts   # Binary search implementation for liquidity probing
└── __tests__/
    ├── unit/          # Unit tests for individual utilities
    ├── integration/   # Full adapter integration tests
    ├── mocks/         # MSW handlers and mock server setup
    └── setup.ts       # Test configuration
```

## Key Design Decisions

1. **Single Parameter Constructor**: Service only requires `baseUrl` to keep configuration minimal
2. **Explicit Errors Over Fallbacks**: All failures throw errors instead of returning dummy data
3. **Binary Search for Liquidity**: Determines max feasible amounts by probing quote endpoint
4. **Native Volume Data**: Uses Li.Fi's `/analytics/transfers` endpoint for volume aggregation (no external services required)

## Performance Considerations

- **Rate Limiting**: Configured to respect Li.Fi API rate limits
- **Binary Search Iterations**: Limited to 3 iterations per threshold for performance
- **Concurrent Requests**: Configurable via `LIFI_MAX_CONCURRENT` (default: 5)
- **Request Batching**: All snapshot components fetched in parallel

## Links

- **Li.Fi Documentation**: https://docs.li.fi/
- **API Reference**: https://docs.li.fi/api-reference
- **Quote Endpoint**: https://docs.li.fi/api-reference/get-a-quote-for-a-token-transfer-1
- **Tokens Endpoint**: https://docs.li.fi/api-reference/get-tokens
- **Li.Fi Explorer**: https://explorer.li.fi/

## License

Part of the every-plugin data provider framework.
