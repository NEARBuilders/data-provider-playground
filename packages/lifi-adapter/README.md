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

**Status**: Li.Fi does not expose aggregated volume metrics via its public API.

**Why This is a Design Choice**:
Li.Fi is a quote aggregator and router - it doesn't independently collect or expose trading volume data. Instead, Li.Fi routes trades through various DEX aggregators (1inch, 0x, etc.), bridges (Stargate, Connext, etc.), and other protocols. The volume data belongs to these underlying protocols, not to Li.Fi itself.

**Our Solution: The Graph Integration** ⭐

We propose integrating **The Graph** for decentralized volume data:

**Why The Graph?**
- ✅ **No API key required** - Public GraphQL endpoints
- ✅ **Real-time data** - On-chain event indexing
- ✅ **Historical data** - Complete blockchain history
- ✅ **Easy integration** - Standard GraphQL queries
- ✅ **Reliable** - Decentralized infrastructure
- ✅ **Multi-chain** - Subgraphs for multiple DEXs

**Current Implementation**:
The `getVolumes()` method returns an empty array `[]` with a TODO comment to implement The Graph integration:
- Stub method ready for implementation
- Query templates documented
- Endpoints configured (no auth needed)
- Fallback behavior: returns empty if query fails

**How It Works** (When Implemented):
```typescript
// Query The Graph for DEX volume data
1. Call The Graph API endpoint (no auth)
2. Query Uniswap/major DEX subgraphs
3. Aggregate volume for requested time window (24h/7d/30d)
4. Return volumeUSD for each period

Example Endpoint (No API Key):
https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3
```

**Available The Graph Endpoints** (No API Key):
- Uniswap V3: `https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3`
- Uniswap V2: `https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2`
- Aave: `https://api.thegraph.com/subgraphs/name/aave/protocol-v3`
- Many more available: https://thegraph.com/hosted-service

**Alternative Workarounds** (If Different Source Needed):

1. **Dune Analytics**: Query aggregated cross-chain bridge volumes
   - Website: https://dune.com/
   - Method: SQL queries or REST API
   - Data: Historical volume, bridge-specific stats

2. **Protocol-Specific APIs**: Contact underlying protocols directly
   - 1inch DEX API: https://docs.1inch.io/
   - 0x Protocol API: https://0x.org/docs/
   - Stargate Bridge: https://stargate.finance/
   - Connext Bridge: https://connext.technology/

3. **Other On-Chain Indexing**: Alternative indexing services
   - Chainbase: https://chainbase.com/ (Free tier available)
   - Covalent: https://www.covalenthq.com/ (Free tier available)

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

```bash
# Run all tests
bun run test

# Run specific test file
bun run test:unit
bun run test:integration

# Watch mode
bun run test:watch
```

All tests use MSW (Mock Service Worker) for deterministic API responses. See `src/__tests__/setup.ts` for mock configuration.

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
4. **Empty Volume Array**: Returns `[]` for volume metrics since Li.Fi doesn't provide aggregated data

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
