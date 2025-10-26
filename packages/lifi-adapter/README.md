# Li.Fi Data Provider Plugin

Production-ready Li.Fi bridge data adapter for the NEAR Intents data collection system.

## Provider: Li.Fi

**Chosen Provider**: [Li.Fi](https://li.fi/) - Cross-chain bridge aggregator  
**API Documentation**: https://docs.li.fi/api-reference/introduction

## Metrics Provided

### ✅ Available Metrics
- **Rates (Fees)**: Real-time quotes with precise fee calculations
- **Liquidity Depth**: Binary search probing at ≤0.5% and ≤1.0% slippage thresholds
- **Available Assets**: Comprehensive token list across supported chains

### ❌ Unavailable Metrics  
- **Volume**: Li.Fi API doesn't provide aggregated volume data (returns empty array)

## API Endpoints Used

- `GET /tokens` - Supported tokens across all chains
- `GET /quote` - Route quotes with fees and slippage parameters

## Environment Variables

```bash
# Optional - Li.Fi public endpoints don't require authentication
LIFI_API_KEY=your_api_key_if_needed

# Configuration (with defaults)
LIFI_BASE_URL=https://li.quest/v1
LIFI_TIMEOUT=10000
```

## Setup & Installation

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build plugin
npm run build

# Type check
npm run type-check
```

## Local Development

```bash
# Run tests with watch mode
npm run test:watch

# Run integration tests
npm run test:integration
```

## Implementation Details

### Precision & Reliability
- **Decimal.js**: Precise arithmetic for `effectiveRate` calculations
- **Raw strings preserved**: On-chain smallest units maintained as strings
- **Exponential backoff**: Retry logic with jitter for API resilience
- **Rate limiting**: 5 concurrent requests, 200ms minimum interval

### Liquidity Depth Algorithm
Uses bounded binary search to find maximum input amounts:
1. Start with reasonable bounds (1 USDC to 100k USDC)
2. Binary search with slippage parameters (50bps, 100bps)
3. Limited to 3 iterations for performance
4. Fallback to conservative estimates on failure

### Error Handling
- Graceful degradation for missing data
- Comprehensive retry mechanisms
- Detailed logging for debugging
- Fallback responses for API failures

## Contract Compliance

Implements the standard oRPC contract:
- **getSnapshot**: Returns volumes, rates, liquidity, listedAssets
- **ping**: Health check endpoint
- All field names and shapes preserved as specified

## API Access Constraints

- **Rate Limits**: Self-imposed 5 concurrent, 200ms intervals
- **Authentication**: Optional (public endpoints available)
- **Timeout**: 10 second default per request
- **Retry Policy**: 3 attempts with exponential backoff

## Testing

- **15 tests**: 7 unit + 8 integration tests
- **Deterministic mocks**: No external API calls during testing
- **100% pass rate**: All tests validate contract compliance
- **Fast execution**: <300ms test runtime

## Limitations

1. **No Volume Data**: Li.Fi doesn't expose aggregated trading volumes
2. **Liquidity Estimation**: Based on quote probing, not real-time depth
3. **Chain Support**: Limited to Li.Fi supported networks
4. **Rate Limits**: Conservative limits to ensure reliability

## Production Deployment

This plugin is designed for:
- NEAR Intents competitive analysis dashboard
- Real-time rate comparison across bridge providers
- Liquidity depth analysis for routing decisions
- Cross-chain asset availability tracking

## License

Part of the NEAR Intents data collection system.