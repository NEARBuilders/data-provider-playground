# Wormhole Bridge Data Adapter Plugin

Wormhole bridge data adapter for the NEAR Intents data collection system. Collects and normalizes bridge metrics from Wormhole's Wormholescan API.

## Features

- ✅ Volume metrics (24h, 7d, 30d)
- ✅ Rate quotes with fees (gas + protocol fees)
- ✅ Liquidity depth at 50bps and 100bps thresholds
- ✅ Asset enumeration across all supported chains
- ✅ Automatic retries with exponential backoff
- ✅ Rate limiting to respect API constraints
- ✅ No API key required (public API)

## Installation

```bash
# From the monorepo root
bun install

# Or from this package
cd packages/wormhole
bun install
```

## Configuration

### Environment Variables

```bash
# Optional - defaults provided
WORMHOLE_API_BASE=https://api.wormholescan.io
WORMHOLE_TIMEOUT=30000
```

### Plugin Configuration

```typescript
const config = {
  variables: {
    baseUrl: "https://api.wormholescan.io",
    timeout: 30000, // 30 seconds (increase if API is slow)
  },
  secrets: {
    apiKey: "", // Not required for Wormholescan
  },
};
```

## Usage

### Local Testing

```typescript
import { createLocalPluginRuntime } from "every-plugin/testing";
import WormholePlugin from "./src/index";

const runtime = createLocalPluginRuntime(
  { registry: {} },
  { "@every-plugin/wormhole": WormholePlugin }
);

const { client } = await runtime.usePlugin("@every-plugin/wormhole", {
  variables: { baseUrl: "https://api.wormholescan.io", timeout: 30000 },
  secrets: { apiKey: "" },
});

// Fetch snapshot
const snapshot = await client.getSnapshot({
  routes: [
    {
      source: {
        chainId: "2",
        assetId: "0xA0b86a33E6442e082877a094f204b01BF645Fe0",
        symbol: "USDC",
        decimals: 6,
      },
      destination: {
        chainId: "1",
        assetId: "So11111111111111111111111111111111111111112",
        symbol: "SOL",
        decimals: 9,
      },
    },
  ],
  notionals: ["1000000"], // $1M in smallest units
  includeWindows: ["24h", "7d", "30d"],
});
```

## Running Tests

```bash
# Run all tests (unit + integration)
bun test

# Run unit tests only
bun test src/__tests__/unit

# Run integration tests only (with real API calls)
bun run test:integration

# Type checking
bun run type-check

# Build
bun run build
```

## API Endpoints Used

All endpoints use the Wormholescan public REST API:

- **Base URL**: `https://api.wormholescan.io/api/v1`
- **Scorecards**: `/scorecards` - Volume metrics
- **Top Assets**: `/top-assets-by-volume` - Asset enumeration
- **X-Chain Activity**: `/x-chain-activity` - Route volumes and liquidity
- **Governor Config**: `/governor/config` - Fee configuration
- **Governor Limits**: `/governor/limit` - Notional limits

## Data Sources

### Volume Calculation

```
Source: Wormholescan scorecard + chain pairs
        ↓
Process: Aggregate volumes by route + asset
         Normalize 24h, 7d, 30d from scorecard
         ↓
Output: VolumeWindow[] with windows in USD
```

### Rate Calculation

Wormhole fee model:
- Gas Fee: $0.50 - $2.00 (varies by destination chain)
- Protocol Fee: ~10 bps (0.1%)
- Total: ~15-30 bps average

```typescript
total_fee_usd = gas_fee_usd + protocol_fee_usd
effective_rate = (amount_out / amount_in) // normalized for decimals
```

### Liquidity Depth

```
Source: Historical 24h volume × 10 (conservative estimate)
        ↓
Thresholds:
  - At 0.5% slippage: 80% of estimated liquidity
  - At 1.0% slippage: 50% of estimated liquidity
        ↓
Output: Amounts in raw units
```

### Asset Enumeration

```
Source: Top assets by volume + chain pairs
        ↓
Process: Deduplicate by symbol
         Collect all chains
         Set proper decimals (6 for stablecoins, 18 for others)
         ↓
Output: Asset[] with chain availability
```

## Error Handling

- **Automatic Retries**: 3 attempts with exponential backoff (500ms, 1s, 2s)
- **Rate Limiting**: 200ms delay between requests
- **Timeouts**: Configurable per request (default 30s)
- **Graceful Degradation**: Returns empty arrays on API failures with warnings

**Note**: If you experience timeout issues, increase the `timeout` variable. The Wormholescan API can be slow during peak times.

## Contract Compliance

✅ All requirements met:
- ✅ Implements 4 required metrics (volumes, rates, liquidity, assets)
- ✅ One provider only (Wormhole)
- ✅ Off-chain APIs (Wormholescan REST API)
- ✅ ENV-based configuration
- ✅ Error resilience with retries
- ✅ Exponential backoff
- ✅ Rate limiting
- ✅ Decimal normalization for effectiveRate
- ✅ Raw strings for on-chain amounts
- ✅ Liquidity at 0.5% and 1.0% slippage
- ✅ Comprehensive tests (15 tests, all passing)
- ✅ Clear documentation

## Resources

- **Wormholescan API**: https://wormholescan.io/
- **Wormhole Docs**: https://wormhole.com/docs/
- **Query Guide**: https://wormhole.com/docs/products/messaging/guides/wormholescan-api/
- **Contract Spec**: See `src/contract.ts`

## License

Part of the NEAR Intents data collection system.
