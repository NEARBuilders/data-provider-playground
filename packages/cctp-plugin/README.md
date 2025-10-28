# CCTP Data Provider Plugin

Circle's Cross-Chain Transfer Protocol (CCTP) data provider plugin for the NEAR Intents data collection system.

## Overview

This plugin collects bridge metrics from Circle's CCTP, including:
- **Volume data** from Celer cBridge API
- **Rate quotes and fees** from CCTP public API
- **Liquidity depth** from CCTP fast burn allowance API
- **Supported USDC assets** across all CCTP-enabled chains

### Key Features
- ✅ **No API key required** - CCTP APIs are completely public
- ✅ **Rate limiting** - 35 requests/second with exponential backoff retry
- ✅ **Error resilience** - Automatic retries for transient failures
- ✅ **Multi-chain support** - Ethereum, Avalanche, Base, Arbitrum, Optimism, Polygon

## Installation

```bash
# Install dependencies
bun install

# Build the plugin
bun run build
```

## Configuration

### Environment Variables

No environment variables are required since CCTP APIs are public. Optional configuration:

```bash
# Optional - defaults shown
CCTP_BASE_URL=https://iris-api.circle.com
CCTP_TIMEOUT=10000
CCTP_MAX_RETRIES=3
CCTP_INITIAL_BACKOFF_MS=1000
```

### Plugin Configuration

When initializing the plugin, you can configure:

```typescript
{
  variables: {
    baseUrl: "https://iris-api.circle.com",  // CCTP API base URL
    timeout: 10000,                          // Request timeout in ms
    maxRetries: 3,                           // Max retry attempts
    initialBackoffMs: 1000                   // Initial backoff delay
  },
  secrets: {
    apiKey: ""  // Not required for CCTP
  }
}
```

## Data Sources

### Volume Metrics
**Source**: Celer cBridge API  
**Endpoint**: `https://cbridge-prod2.celer.app/v1/transferHistory`  
**Method**: Aggregates USDC transfer history across time windows (24h, 7d, 30d)

### Rate Quotes
**Source**: CCTP Public API  
**Endpoint**: `https://iris-api.circle.com/v1/circleUsdcConfig`  
**Method**: Extracts fee structure and calculates effective rates for route/notional combinations

### Liquidity Depth
**Source**: CCTP Fast Burn Allowance API  
**Endpoint**: `https://iris-api.circle.com/v1/fastBurnAllowance`  
**Method**: Queries max transfer amounts at 50bps and 100bps slippage thresholds

### Listed Assets
**Source**: Hardcoded USDC addresses  
**Method**: Returns USDC contract addresses for all CCTP-supported chains

## Supported Chains

| Chain | Chain ID | USDC Address |
|-------|----------|--------------|
| Ethereum | 1 | 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48 |
| Polygon | 137 | 0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359 |
| Avalanche | 43114 | 0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E |
| Arbitrum | 42161 | 0xaf88d065e77c8cC2239327C5EDb3A432268e5831 |
| Optimism | 10 | 0x0b2C639c533813f4Aa9D7837CAf62653d671Eeee |
| Base | 8453 | 0x833589fCD6eDb6E08f4c7C32D4f71b1566dA8b60 |

## Running Tests

```bash
# Run all tests
bun test

# Run in watch mode
bun test:watch

# Run integration tests
bun test:integration

# Check code coverage
bun run coverage
```

## Development

```bash
# Start development server
bun run dev

# Type check
bun run type-check

# Build for production
bun run build
```

## API Constraints

### Rate Limiting
- **Limit**: 35 requests per second
- **Enforcement**: Server-side automatic blocks
- **Block Duration**: 5 minutes (HTTP 429)
- **Implementation**: Client-side rate limiting with windowed counter

### Retry Strategy
- **Max Retries**: 3 attempts (configurable)
- **Backoff**: Exponential (1s, 2s, 4s by default)
- **Retryable Errors**: 
  - 429 (Rate Limited)
  - 503 (Service Unavailable)
  - 504 (Gateway Timeout)
  - Timeout/Abort errors

## Contract Specification

The plugin implements the standard data provider contract:

```typescript
getSnapshot(params: {
  routes: Array<{ source: Asset; destination: Asset }>;
  notionals: string[];
  includeWindows?: Array<"24h" | "7d" | "30d">;
}): Promise<ProviderSnapshot>
```

Returns:
- **volumes**: Volume metrics for each time window
- **rates**: Rate quotes for each route/notional combination
- **liquidity**: Liquidity depth at 50bps and 100bps slippage
- **listedAssets**: List of all supported USDC assets

## Architecture

```
CCTPService
├── getSnapshot()          # Main entry point
│   ├── getVolumes()       # Fetch from Celer API
│   ├── getRates()         # Fetch from CCTP config API
│   ├── getLiquidityDepth() # Fetch from fast burn API
│   └── getListedAssets()  # Return hardcoded USDC data
│
├── Rate Limiting
│   ├── enforceRateLimit() # 35 req/sec limit
│   └── makeRequestWithRetry() # Exponential backoff
│
└── Error Handling
    └── isRetryable()      # Determine retry eligibility
```

## Known Limitations

1. **CCTP API Status**:
   - ✅ **Liquidity Depth**: Using real data from `/v2/fastBurn/USDC/allowance` (WORKING!)
   - ❌ **Rates/Fees**: `/v2/burn/USDC/fees` returns 404, using 6 bps fallback
   - ✅ **Volume**: Using Celer cBridge API (WORKING!)
   - ✅ **Assets**: Hardcoded USDC addresses (WORKING!)

2. **Rate Estimation**: Uses fallback 6 basis points (0.06%) when fees API unavailable

3. **Volume Data Accuracy**: Depends on Celer cBridge API having complete transfer history

See [API_STATUS.md](./API_STATUS.md) for detailed information about API availability and alternatives.

## References

- **CCTP Documentation**: https://developers.circle.com/cctp
- **CCTP APIs**: https://developers.circle.com/stablecoins/cctp-apis
- **Celer cBridge**: https://cbridge-docs.celer.network/
- **NEAR Intents Bounty**: [bounty.md](../../bounty.md)
- **LLM Implementation Guide**: [LLM.txt](./LLM.txt)
- **API Status**: [API_STATUS.md](./API_STATUS.md)

## License

Part of the NEAR Intents data collection system. Built for the NEAR Builders bounty program.
