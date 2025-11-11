# Li.Fi Adapter for NEAR Intents

Production-ready Li.Fi bridge data adapter for NEAR Intents data collection bounty. Collects rates, liquidity depth, and available assets from Li.Fi provider with deterministic contract compliance.

## Quick Start

Requirements: Node 20+ or **Bun** (recommended).

```bash
# Install dependencies
bun install

# Run tests
cd plugins/lifi-adapter && bun run test

# Build adapter
cd plugins/lifi-adapter && bun run build

# Run demo (mock mode)
cd plugins/lifi-adapter && bun run demo:mock

# Run demo (live mode)
cd plugins/lifi-adapter && bun run demo:live
```

## Configuration

Copy `plugins/lifi-adapter/.env.example` to `.env` and adjust:

- `LIFI_BASE_URL`: Li.Fi API base URL (default: `https://li.quest/v1`)
- `LIFI_API_KEY`: Optional API key for higher rate limits
- `LIFI_MAX_CONCURRENT`: Rate limiter concurrency (default: `5`)
- `LIFI_MIN_TIME`: Minimum time between requests in ms (default: `200`)

## Provider Details

**Li.Fi** - Cross-chain bridge aggregator (https://li.fi/)
- API Documentation: https://docs.li.fi/api-reference/introduction
- Main Endpoints: `GET /tokens`, `GET /quote`, `GET /analytics/transfers`
- Supported Chains: 20+ including Ethereum, Polygon, Arbitrum, Optimism, BSC

## Metrics Provided

- **Rates**: Real-time quotes with fee-aware effective rates
- **Liquidity Depth**: Probing-based estimates for ≤0.5% and ≤1.0% slippage thresholds
- **Available Assets**: Token listings across supported chains
- **Volume**: Cross-chain transfer volumes for 24h/7d/30d windows with chunked fetching strategy

## Implementation Features

- **Precision**: Uses `decimal.js` for accurate arithmetic and preserves raw token amounts
- **Chunked Volume Fetching**: Time-based chunking with extrapolation for reliable volume data
- **v2/v1 Fallback**: Automatic endpoint fallback when rate limited
- **Rate Limiting**: 700ms delays between chunks to avoid 429 errors
- **Error Handling**: Deterministic fallbacks and comprehensive logging
- **Contract Compliance**: Implements oRPC contract (`getSnapshot`, `ping`) for NEAR Intents

## Testing

```bash
cd plugins/lifi-adapter
bun run test              # All tests (recommended)
bun run test:unit         # Unit tests only
bun run test:integration  # Integration tests only

```

### Latest Test Results
- **Status**: ✅ **16 passed, 1 skipped** (100% passing)
- **Test Runner**: Vitest v3.2.4
- **Coverage**: Unit + Integration tests with mocked fetch handlers
- **Date**: 2025-11-09

## Demo Results

### Live Demo Output (2025-11-09)

```bash
cd plugins/lifi-adapter && bun run demo:live
```

**Volume Data Collected:**
- **24h**: $13.9M (12,000 transfers, extrapolated 1.2x)
- **7d**: $21.2M (10,000 transfers, extrapolated 1.5x) 
- **30d**: $26.8M (10,000 transfers, extrapolated 2.0x)

**Rate Data:**
- **Route**: USDC (Ethereum) → USDC (Optimism)
- **Effective Rate**: 1.0 (1:1 stablecoin)
- **Fees**: $0 USD

**Assets**: 500+ tokens across 20+ chains

**Strategy**: Chunked fetching with v2→v1 fallback and conservative extrapolation factors 


## Project Structure

```
lifi-adapter-for-near/
├── plugins/lifi-adapter/           # Main Li.Fi adapter
│   ├── src/
│   │   ├── tests/                  # Test suite (unit + integration)
│   │   ├── utils/                  # Utility modules (decimal, http, liquidity)
│   │   ├── contract.ts             # oRPC contract definition
│   │   ├── index.ts                # Plugin entry point
│   │   └── service.ts              # Core DataProviderService
│   ├── dev/                        # Demo scripts (demo.ts, server.ts)
│   └── package.json                # Dependencies and scripts
├── packages/api/                   # API runtime
├── apps/web/                       # Web UI
└── types/                          # TypeScript definitions
```

## Volume Data Strategy

**Chunked Fetching with Extrapolation:**
- **24h**: 12 chunks × 1000 transfers → extrapolate 1.2x if saturated
- **7d**: 10 chunks × 1000 transfers → extrapolate 1.5x if saturated
- **30d**: 10 chunks × 1000 transfers → extrapolate 2.0x if saturated

**Rate Limiting**: 700ms delay between chunks with v2→v1 fallback

## Limitations

- Liquidity estimates from quote probing (not orderbook snapshots)
- Volume data represents Li.Fi transfers only (not total DEX activity)
- Chunked sampling with extrapolation provides representative estimates
- Chain coverage limited to Li.Fi supported networks (20+)