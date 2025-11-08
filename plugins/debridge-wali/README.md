# deBridge DLN Data Provider Plugin

Production-ready data provider for collecting cross-chain bridge metrics from the **deBridge Liquidity Network (DLN)**.  
Provides real-time rates, liquidity depth, volume, and available assets across 30+ blockchains.

---

## What Makes This Different

This plugin introduces **Route Intelligence Analysis** — it probes actual routes to find real limits instead of guessing.

You get:
- **Max Capacity Discovery** – Tests route limits ($1k–$5M)  
- **Optimal Trade Size Range** – Finds the sweet spot for best rates  
- **Fee Efficiency Score** – 0–100 rating for route quality  
- **Price Impact Analysis** – Measures rate degradation at scale  

---

## How It Works

This plugin fetches data from three official sources:
1. **deBridge API** – Real-time quotes and liquidity  
2. **DefiLlama** – Aggregated bridge volumes  
3. **deBridge Token List** – Supported assets  

All data is real. If an API fails, you get an empty array instead of fake data.

---

## What You Get

- **Assets**: 7,862 tokens from the official token list  
- **Volume**: Real 24h/7d/30d data from DefiLlama (~$6.7M yesterday)  
- **Rates**: Live quotes with actual fees included  
- **Liquidity**: Single API call using `maxTheoreticalAmount`  
- **Intelligence**: Optional deep route analysis  

Performance: ~6–7 seconds for a full snapshot (all tests pass when not rate-limited).

---

## Setup

```bash
bun install
bun run build
bun test
```

No API keys required — deBridge endpoints are public.

---

## Configuration

Create a `.env` file in the plugin directory:

```bash
DEBRIDGE_TIMEOUT=30000
DEBRIDGE_RATE_LIMIT_MIN_TIME_MS=200
```

---

## Technical Overview

- Uses **Effect.ts** for robust error handling  
- **Decimal.js** for precise financial math  
- **Retry logic** with exponential backoff  
- Structured logging with performance tracking  
- 24 tests covering all major flows  
- Follows oRPC contract specification  

---

## API Endpoints

1. **Quote Endpoint**  
   `GET https://dln.debridge.finance/v1.0/dln/order/create-tx`  
   - Used for rate and liquidity depth  
   - Docs: [Order Creation API](https://docs.debridge.com/dln-details/integration-guidelines/order-creation)

2. **Volume Endpoint**  
   `POST https://stats-api.dln.trade/api/Orders/filteredList`  
   - Used for historical volume tracking  
   - Docs: [Order Tracking API](https://docs.debridge.com/dln-details/integration-guidelines/order-tracking)

3. **Assets Endpoint**  
   `GET https://dln.debridge.finance/v1.0/supported-chains-info`  
   - Used to list supported tokens  
   - Docs: [Specifying Assets](https://docs.debridge.com/dln-details/integration-guidelines/specifying-assets)

---

## Implementation Highlights

- **Enterprise-Grade Resilience**: Caching, deduplication, circuit breakers  
- **Precision**: All financial calculations via `decimal.js`  
- **Observability**: Context-aware structured logging  
- **Rate Limiting**: Bottleneck library manages concurrency  

---

## Testing
Run tests with:
```bash
npm test
```

Covers:
- Snapshot validation  
- Volume/rate calculations  
- Liquidity depth detection  
- Asset listing  
- Error handling  
- Contract compliance  

---

## Architecture

```
index.ts         → Plugin entry  
service.ts       → Core logic  
utils/cache.ts   → TTL cache and circuit breaker  
utils/logger.ts  → Structured logging  
utils/http.ts    → Retry + rate limiting  
```

---

## Documentation Links

- [deBridge DLN Docs](https://docs.debridge.com)  
- [Order Creation API](https://docs.debridge.com/dln-details/integration-guidelines/order-creation)  
- [Order Tracking API](https://docs.debridge.com/dln-details/integration-guidelines/order-tracking)  
- [Specifying Assets](https://docs.debridge.com/dln-details/integration-guidelines/specifying-assets)
