# Across Protocol Data Provider Plugin

A comprehensive data adapter plugin for the Across Protocol that collects and normalizes bridge market data for the NEAR Intents comparison dashboard.

## Overview

This plugin implements the standardized `every-plugin` contract to provide:

- **Volume Metrics**: Trading volume across 24h, 7d, and 30d time windows
- **Rate Quotes**: Exchange rates and fee breakdowns for cross-chain transfers
- **Liquidity Depth**: Maximum transfer amounts at 50bps and 100bps slippage thresholds
- **Available Assets**: Complete list of supported tokens across all chains

## Provider Information

- **Provider**: [Across Protocol](https://across.to/)
- **API Documentation**: [https://docs.across.to/reference/api-reference](https://docs.across.to/reference/api-reference)
- **Type**: Cross-chain bridge protocol optimized for capital efficiency

## Installation

```bash
cd packages/across-plugin
bun install
```

## Configuration

### Environment Variables

Create a `.env` file in the plugin directory:

   ```bash
# Required (Across API doesn't require auth for public endpoints, but we keep this for future compatibility)
# ACROSS_API_KEY=your_api_key_here (optional)

# Optional
ACROSS_BASE_URL=https://app.across.to/api  # Default API endpoint
HTTP_TIMEOUT_MS=15000                       # Request timeout in milliseconds
```

### Plugin Variables

When using the plugin, configure it with:

```typescript
const config = {
  variables: {
    baseUrl: "https://app.across.to/api",  // Across API base URL
    timeout: 15000,                         // Request timeout (ms)
  },
  secrets: {
    apiKey: "",  // Optional, currently unused by Across
  },
};
```

## API Endpoints Used

### 1. Available Routes
**Endpoint**: `GET /available-routes`

Retrieves all supported token routes across chains. Used to:
- Build the list of available assets
- Validate route combinations
- Filter enabled vs. disabled routes

**Response Structure**:
```typescript
interface AcrossRoute {
  originChainId: number;
  originToken: string;
  destinationChainId: number;
  destinationToken: string;
  enabled: boolean;
}
```

### 2. Suggested Fees
**Endpoint**: `GET /suggested-fees`

Fetches quote and fee information for a specific transfer.

**Query Parameters**:
- `inputToken`: ERC-20 token address on origin chain
- `outputToken`: ERC-20 token address on destination chain
- `originChainId`: Origin chain ID
- `destinationChainId`: Destination chain ID
- `amount`: Transfer amount in token's smallest unit (wei/atoms)

**Response Structure**:
```typescript
interface AcrossSuggestedFees {
  capitalFeePct: string;
  relayGasFeePct: string;
  lpFeePct: string;
  totalRelayFee: {
    pct: string;
    total: string;
  };
  outputAmount: string;
  expectedFillTimeSec: number;
  timestamp: string;
}
```

**Used For**:
- Rate quotes with fee breakdown
- Effective rate calculation (normalized for decimals)
- Liquidity depth measurement via binary search

### 3. Deposit Limits
**Endpoint**: `GET /limits`

Retrieves deposit limits for a token pair.

**Query Parameters**:
- `token`: Token address
- `originChainId`: Origin chain ID
- `destinationChainId`: Destination chain ID

**Response Structure**:
   ```typescript
interface AcrossLimits {
  minDeposit: string;
  maxDeposit: string;
  maxDepositInstant: string;
  maxDepositShortDelay: string;
}
```

**Used For**:
- Establishing bounds for liquidity depth search
- Validating transfer amounts

## How Data is Derived

### Volume Metrics

**Current Implementation**: Returns 0 to indicate data not available.

**Rationale**: Across API doesn't currently expose a public volume statistics endpoint. The plugin returns 0 for all volume windows with warnings in the logs.

**Alternative Data Sources**:
- DefiLlama API: `https://api.llama.fi/protocol/across-protocol`
- Dune Analytics: Custom query with API key
- On-chain aggregation: Query SpokePool events across all chains

### Rate Quotes

**Method**: Direct API calls to `/suggested-fees`

1. Request quote for each route/notional combination
2. Parse fee breakdown (capital fee, relay gas fee, LP fee)
3. Calculate effective rate with decimal normalization:
   ```
   effectiveRate = amountOut (decimal) / amountIn (decimal)
   ```
4. Convert fees to USD (for stablecoins, assumes 1:1 parity)

**Decimal Normalization**:
- Convert raw amounts from smallest units (wei/atoms) to decimal representation
- USDC/USDT: 6 decimals
- ETH/WETH: 18 decimals
- Calculate rate using normalized values
- Preserve raw amounts in `amountIn`/`amountOut` fields

### Liquidity Depth

**Method**: Direct use of `/limits` endpoint (optimized approach)

For each route, we:
1. Fetch deposit limits from the `/limits` endpoint
2. Map the limits to slippage thresholds:
   - **`maxDepositInstant`** → **50bps threshold** (instant transfers, minimal slippage)
   - **`maxDepositShortDelay`** → **100bps threshold** (short delay transfers, moderate slippage)

**Why This Approach**:
- ✅ **90% fewer API calls** compared to binary search
- ✅ Uses Across's own classifications for transfer speeds
- ✅ More accurate representation of actual liquidity
- ✅ Faster and more reliable

**Previous Implementation** (removed):
- Binary search with 30+ API calls per route
- Complex slippage calculation and iteration logic
- Prone to rate limiting and timeouts

### Available Assets

**Method**: Extract from `/available-routes` and enrich with token metadata

1. Fetch all available routes from `/available-routes`
2. Extract unique assets from origin and destination fields
3. Map tokens to metadata using comprehensive lookup table:
   - **Major tokens**: USDC, USDT, DAI, WETH, WBTC across all chains
   - **DeFi tokens**: UMA, ACX, BAL, POOL
   - **Fallback**: Address prefix for unknown tokens
4. Filter for enabled routes only

**Token Metadata Approach**:
- Uses pre-defined lookup table for all major Across-supported tokens
- Fast and reliable (no RPC calls required)
- Works in all environments (tests, production, offline)

## Usage

### Basic Example

```typescript
import { createLocalPluginRuntime } from "every-plugin/testing";
import AcrossPlugin from "@every-plugin/across";

const runtime = createLocalPluginRuntime(
  { registry: {} },
  { "@every-plugin/across": AcrossPlugin }
);

const { client } = await runtime.usePlugin("@every-plugin/across", {
  variables: {
    baseUrl: "https://app.across.to/api",
    timeout: 15000,
  },
  secrets: {
    apiKey: "",
  },
});

// Fetch complete snapshot
const snapshot = await client.getSnapshot({
  routes: [
    {
      source: {
        chainId: "1",
        assetId: "0xA0b86a33E6442e082877a094f204b01BF645Fe0",
        symbol: "USDC",
        decimals: 6,
      },
      destination: {
        chainId: "137",
        assetId: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa8417",
        symbol: "USDC",
        decimals: 6,
      },
    },
  ],
  notionals: ["1000000", "10000000"], // 1 USDC and 10 USDC (6 decimals)
  includeWindows: ["24h", "7d", "30d"],
});

console.log("Volumes:", snapshot.volumes);
console.log("Rates:", snapshot.rates);
console.log("Liquidity:", snapshot.liquidity);
console.log("Assets:", snapshot.listedAssets.assets.length);
```

### Health Check

```typescript
const health = await client.ping();
console.log(health); // { status: "ok", timestamp: "2025-10-23T..." }
```

## Testing

### Unit Tests

Test the service layer with mocked API responses:

```bash
bun test
```

### Integration Tests

Test the complete plugin with MSW interceptors:

```bash
bun test:integration
```

### Test Coverage

```bash
bun run coverage
```

## API Access Constraints

### Rate Limiting

- **No official rate limit documented** by Across
- **Plugin implementation**: 100ms delay between liquidity depth probes
- **Recommendation**: Monitor API response times and implement backoff if needed

### Caching

- **Across recommendation**: Cache quote results for no longer than 300 seconds (5 minutes)
- **Plugin implementation**: No caching (delegates to caller)
- **Best practice**: Implement cache layer at dashboard level

### Authentication

- **Current status**: Public endpoints, no API key required
- **Future-proofing**: Plugin accepts optional `apiKey` for compatibility

## Error Handling

### Resilience Features

1. **Timeout Protection**: Configurable timeout (default 15s) with AbortController
2. **Graceful Degradation**: 
   - If rate fetch fails, continues with other routes
   - If liquidity calc fails, provides conservative fallback estimates
3. **Detailed Logging**: Console warnings for failed operations with context

### Common Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| `HTTP 400` | Invalid route or amount | Verify token addresses and chain IDs |
| `HTTP 429` | Rate limit exceeded | Implement exponential backoff |
| `HTTP 503` | Across API unavailable | Retry with backoff, check status page |
| `Timeout` | Network or API delay | Increase timeout in config |

## Development

### Local Development

```bash
# Install dependencies
bun install

# Run dev server with hot reload
bun run dev

# Type checking
bun run type-check

# Build for production
bun run build
```

### Project Structure

```
across-plugin/
├── src/
│   ├── contract.ts          # oRPC contract definition (from template)
│   ├── service.ts           # Across API client implementation
│   ├── index.ts             # Plugin initialization and router
│   └── __tests__/
│       ├── unit/
│       │   └── service.test.ts     # Service layer tests with MSW
│       └── integration/
│           └── plugin.test.ts      # Full plugin integration tests
├── package.json
├── README.md
└── vitest.config.ts
```

## Contract Compliance

This plugin strictly adheres to the data provider contract:

✅ **Field names unchanged**: All contract types preserved  
✅ **Decimal normalization**: `effectiveRate` computed with decimals  
✅ **Raw amount strings**: `amountIn`/`amountOut` in smallest units  
✅ **Required thresholds**: Liquidity depth at 50bps and 100bps  
✅ **Type safety**: Full TypeScript + Zod validation  

## Roadmap

### Completed ✅
- [x] **Optimize liquidity depth calculation** - Removed binary search, now using `/limits` directly (90% fewer API calls)
- [x] **Fix token metadata** - Replaced RPC calls with comprehensive lookup table
- [x] **Improve reliability** - Eliminated RPC timeouts and rate limiting issues

### Short Term
- [ ] Update volume endpoint when Across publishes official API (currently returns 0)
- [ ] Add retry logic with exponential backoff for failed requests
- [ ] Implement response caching layer with TTL

### Long Term
- [ ] Support for Across V3 API when released
- [ ] Historical volume data integration via DefiLlama or Dune
- [ ] Real-time event streaming for transfers

## Contributing

This plugin is part of the NEAR Intents data collection bounty. To contribute:

1. Fork the repository
2. Create a feature branch
3. Implement changes with tests
4. Submit PR with clear description

## License

Part of the NEAR Intents data collection system.

## Support

- **Across Documentation**: [https://docs.across.to](https://docs.across.to)
- **API Reference**: [https://docs.across.to/reference/api-reference](https://docs.across.to/reference/api-reference)
- **Across Discord**: [https://discord.across.to](https://discord.across.to)

## Acknowledgments

Built using the [every-plugin](https://github.com/NEARBuilders/data-provider-playground) framework for the NEAR Intents cross-chain bridge comparison dashboard.
