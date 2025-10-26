# Li.Fi Adapter for NEAR Intents

Production-ready Li.Fi bridge data adapter for the NEAR Intents data collection bounty.

## 🎯 Bounty Submission

**Provider**: Li.Fi (https://li.fi/)  
**Repository**: Forked from [data-provider-playground](https://github.com/NEARBuilders/data-provider-playground)  
**Plugin Location**: `packages/lifi-adapter/`

## ✅ Requirements Fulfilled

### Metrics Implemented
- ✅ **Rates (Fees)**: Real-time quotes with precise decimal calculations
- ✅ **Liquidity Depth**: Binary search probing at ≤0.5% and ≤1.0% slippage
- ✅ **Available Assets**: Comprehensive token list across supported chains
- ⚠️ **Volume**: Li.Fi API doesn't provide aggregated volume data (returns empty array)

### Technical Requirements
- ✅ **Contract Compliance**: Implements oRPC contract specification
- ✅ **Type Safety**: Full TypeScript implementation with zero errors
- ✅ **Resilience**: Exponential backoff, jitter, and rate limiting
- ✅ **ENV Configuration**: Flexible environment-based setup
- ✅ **Documentation**: Comprehensive setup and usage guides
- ✅ **Tests**: 15/15 tests passing (100% success rate)

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run tests
cd packages/lifi-adapter && npm test

# Build plugin
cd packages/lifi-adapter && npm run build

# Type check
cd packages/lifi-adapter && npm run type-check
```

## 📊 Test Results

```
✓ Unit Tests: 7/7 passed
✓ Integration Tests: 8/8 passed
✓ Total: 15/15 tests passed (100%)
✓ TypeScript: Zero errors
✓ Build: Successful
```

## 🔧 Implementation Highlights

### Precision & Reliability
- **Decimal.js**: Precise arithmetic for `effectiveRate` calculations
- **Raw strings preserved**: On-chain smallest units maintained
- **Bottleneck**: Rate limiting (5 concurrent, 200ms intervals)
- **Exponential backoff**: Retry logic with jitter

### Advanced Features
- **Binary search liquidity probing**: Accurate depth estimation
- **Graceful degradation**: Fallback responses for API failures
- **Comprehensive error handling**: Detailed logging and recovery
- **Production-ready**: Built for high-availability environments

## 📋 API Endpoints Used

- `GET /tokens` - Supported tokens across all chains
- `GET /quote` - Route quotes with fees and slippage parameters

## 🌐 Environment Configuration

```bash
# Optional - Li.Fi public endpoints don't require authentication
LIFI_API_KEY=your_api_key_if_needed

# Configuration (with defaults)
LIFI_BASE_URL=https://li.quest/v1
LIFI_TIMEOUT=10000
```

## 📝 API Access Constraints

- **Rate Limits**: Self-imposed 5 concurrent requests, 200ms minimum interval
- **Authentication**: Optional (public endpoints available)
- **Timeout**: 10 second default per request
- **Retry Policy**: 3 attempts with exponential backoff + jitter

## 🎯 For NEAR Intents Dashboard

This plugin provides:
- Real-time Li.Fi rate comparison data
- Liquidity depth analysis for routing decisions
- Cross-chain asset availability tracking
- Production-ready reliability for 24/7 operations

## 📄 License

Part of the NEAR Intents data collection system.