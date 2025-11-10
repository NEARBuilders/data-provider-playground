# Li.Fi Bridge Data Provider Plugin

> **Provider:** [Li.Fi](https://li.fi/) - Multi-chain bridge aggregator
> **Bounty:** NEAR Intents Data Collection System

## 🎯 Quick Verification (For Judges)

### ✅ Requirements Checklist

- [x] **Single Provider**: Li.Fi only (no other providers)
- [x] **Required Metrics**: Volume ✓ | Rates/Fees ✓ | Liquidity Depth ✓ | Available Assets ✓
- [x] **ENV Configuration**: All settings configurable via environment variables
- [x] **Resilience**: Exponential backoff (1s, 2s, 4s) + Rate limiting (10 req/s default)
- [x] **Contract Compliance**: Implements `getSnapshot` endpoint per specification
- [x] **Tests**: All 15 tests passing (7 unit + 8 integration)
- [x] **Documentation**: Complete setup, API usage, and implementation details

### 🚀 Quick Test

```bash
# Install dependencies
npm install

# Run all tests (should show 15/15 passing)
npm test

# Run the plugin locally
npm run dev
```

**Expected Output:** All tests pass ✓

---

## 📋 Provider Implementation

### About Li.Fi

Li.Fi is a cross-chain bridge aggregator that connects multiple bridges and DEXes:
- **Bridges**: Hop, Connext, Across, Stargate, Synapse, etc.
- **Chains**: 30+ networks (Ethereum, Polygon, Arbitrum, Optimism, BSC, etc.)
- **API**: REST API at `https://li.quest/v1`
- **Volume Data**: Aggregated from DefiLlama bridge analytics

### Data Sources

| Metric | Source | Endpoint |
|--------|--------|----------|
| **Volume** | DefiLlama | `https://bridges.llama.fi/bridge/lifi` |
| **Rates & Fees** | Li.Fi API | `https://li.quest/v1/quote` |
| **Liquidity Depth** | Li.Fi API | `https://li.quest/v1/quote` (with varying amounts) |
| **Assets** | Li.Fi API | `https://li.quest/v1/tokens` |

---

## 📦 Setup & Installation

### Prerequisites

- Node.js 18+ or Bun
- npm or bun package manager

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd lifi-plugin/packages/_plugin_template

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env
```

### Environment Variables

Create a `.env` file:

```bash
# Li.Fi API Configuration
BASE_URL=https://li.quest/v1
DEFILLAMA_BASE_URL=https://bridges.llama.fi
TIMEOUT=15000
MAX_REQUESTS_PER_SECOND=10

# API Key (optional - increases rate limits)
# Without key: ~200 requests per 2 hours
# With key: ~200 requests per minute
API_KEY=not-required
```

---

## 🧪 Testing

### Run All Tests

```bash
npm test
```

### Test Coverage

**Unit Tests** (7 tests) - `src/__tests__/unit/service.test.ts`
- ✓ Complete snapshot structure validation
- ✓ Volume data for multiple time windows (24h, 7d, 30d)
- ✓ Rate generation for all route/notional combinations
- ✓ Liquidity depth at 50bps and 100bps thresholds
- ✓ Listed assets structure validation
- ✓ Multiple routes handling
- ✓ Ping/health check

**Integration Tests** (8 tests) - `src/__tests__/integration/plugin.test.ts`
- ✓ Full plugin initialization
- ✓ End-to-end snapshot retrieval
- ✓ Contract compliance validation
- ✓ Input validation (routes and notionals required)

### Test Output

```
Test Files  2 passed (2)
     Tests  15 passed (15)
  Duration  ~1.3s
```

---

## 🏗️ Implementation Details

### Architecture

```
src/
├── contract.ts          # oRPC contract specification
├── service.ts           # Core Li.Fi API integration
├── index.ts            # Plugin entry point
└── __tests__/
    ├── mocks/          # MSW HTTP mocks for testing
    │   ├── handlers.ts
    │   └── server.ts
    ├── setup.ts        # Test configuration
    ├── unit/           # Unit tests
    └── integration/    # Integration tests
```

### Key Features

#### 1. **Rate Limiting**
```typescript
class RateLimiter {
  // Token bucket algorithm
  // Default: 10 requests/second, configurable via ENV
  async acquire(): Promise<void>
}
```

#### 2. **Exponential Backoff**
```typescript
// Retry delays: 1s, 2s, 4s (3 attempts max)
private readonly RETRY_DELAYS = [1000, 2000, 4000];
```

#### 3. **Decimal Normalization**
```typescript
// Rates normalized considering token decimals
const effectiveRate =
  (Number(toAmount) / 10^destinationDecimals) /
  (Number(fromAmount) / 10^sourceDecimals);
```

#### 4. **Liquidity Depth Thresholds**
Progressive quote testing to find maximum tradeable amounts:
- **50 bps (0.5% slippage)**: Maximum amount tradeable with ≤0.5% slippage
- **100 bps (1.0% slippage)**: Maximum amount tradeable with ≤1.0% slippage
- **Method**: Tests amounts [100, 1K, 10K, 100K, 500K, 1M, 5M, 10M] units
- **Calculation**: Compares actual rate vs baseline rate to measure slippage

---

## 📊 Metrics Specification

### Volume

**Time Windows**: 24h, 7d, 30d

```typescript
{
  window: "24h" | "7d" | "30d",
  volumeUsd: number,
  measuredAt: string (ISO datetime)
}
```

### Rates & Fees

```typescript
{
  source: Asset,
  destination: Asset,
  amountIn: string,           // Smallest units (e.g., wei)
  amountOut: string,          // Smallest units
  effectiveRate: number,      // Normalized for decimals
  totalFeesUsd: number | null,
  quotedAt: string (ISO datetime)
}
```

### Liquidity Depth

```typescript
{
  route: { source: Asset, destination: Asset },
  thresholds: [
    { maxAmountIn: string, slippageBps: 50 },   // Max for ≤0.5% slippage
    { maxAmountIn: string, slippageBps: 100 }   // Max for ≤1.0% slippage
  ],
  measuredAt: string (ISO datetime)
}
```

**How it works:**
1. Gets baseline rate with 100 unit quote
2. Progressively tests larger amounts: [100, 1K, 10K, 100K, 500K, 1M, 5M, 10M]
3. For each amount, calculates: `slippage = |baselineRate - actualRate| / baselineRate`
4. Records the largest amount where slippage ≤ threshold
5. Ensures 100bps max ≥ 50bps max (validated in tests)

### Listed Assets

```typescript
{
  assets: Array<{
    chainId: string,
    assetId: string,        // Token contract address
    symbol: string,
    decimals: number
  }>,
  measuredAt: string (ISO datetime)
}
```

---

## 🔧 API Contract

### `getSnapshot`

**Endpoint**: `GET /snapshot`

**Input**:
```typescript
{
  routes: Array<{
    source: Asset,
    destination: Asset
  }>,
  notionals: string[],                      // Amounts to quote
  includeWindows?: ("24h" | "7d" | "30d")[] // Default: ["24h"]
}
```

**Output**:
```typescript
{
  volumes: VolumeWindow[],
  rates: Rate[],
  liquidity: LiquidityDepth[],
  listedAssets: ListedAssets
}
```

### `ping`

**Endpoint**: `GET /ping`

**Output**:
```typescript
{
  status: "ok",
  timestamp: string
}
```

---

## 🔍 Error Handling

### Rate Limits
- **Without API Key**: ~200 requests per 2 hours
- **With API Key**: ~200 requests per minute
- **Behavior**: Automatic retry with exponential backoff

### Network Errors
- **Timeout**: Configurable (default 15s)
- **Retries**: 3 attempts with exponential backoff
- **Graceful Degradation**: Returns empty arrays on failure, logs errors

### API Errors
- **No Quote Available**: Returns empty rates/liquidity arrays
- **Invalid Tokens**: Logged and skipped
- **Insufficient Liquidity**: Returns null for that route

---

## 📚 Li.Fi API Reference

### Endpoints Used

| Endpoint | Purpose | Rate Limited |
|----------|---------|--------------|
| `GET /chains` | List supported blockchains | ✓ |
| `GET /tokens` | List supported tokens per chain | ✓ |
| `GET /quote` | Get swap/bridge quote | ✓ |

### External APIs

| Service | Endpoint | Purpose |
|---------|----------|---------|
| DefiLlama | `/bridge/lifi` | Historical volume data |

---

## 🚀 Development

### Run Development Server

```bash
npm run dev
```

The plugin will be available at `http://localhost:3000/remoteEntry.js`

### Build for Production

```bash
npm run build
```

Output: `dist/` directory with compiled plugin

### Type Checking

```bash
npm run type-check
```

---

## 📝 Notes

### Design Decisions

1. **Volume Source**: Using DefiLlama instead of on-chain aggregation for reliability and reduced API calls
2. **Caching**: 10-minute TTL on volume data to respect rate limits
3. **Liquidity Estimation**: Based on progressive quote testing rather than pool depth queries
4. **Asset Discovery**: Lazy-loaded on first snapshot request to minimize initialization time

### Limitations

- **Historical Data**: Volume windows depend on DefiLlama's data freshness
- **Liquidity Depth**: Estimated via quotes, not direct pool queries
- **Rate Accuracy**: Subject to market volatility between quote and execution

### Future Improvements

- Implement caching for token/chain metadata
- Add WebSocket support for real-time rate updates
- Parallel quote fetching for multiple routes
- Custom slippage thresholds beyond 50/100 bps

---

## 📄 License

Part of the NEAR Intents Builder Bounty program.

---

## 🤝 Support

For questions or issues:
- Telegram: https://t.me/+Xfx2Mx6pbRYxMzA5
- GitHub Issues: [Create an issue](../../issues)

---

**Built with** [every-plugin](https://github.com/NEARBuilders/every-plugin) framework
