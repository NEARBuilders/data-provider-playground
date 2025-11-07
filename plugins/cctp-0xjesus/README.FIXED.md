# CCTP (Circle Cross-Chain Transfer Protocol) Bridge Data Provider Plugin

A data collection plugin for Circle's CCTP protocol, built for the NEAR Intents bounty. This plugin collects and normalizes cross-chain USDC transfer metrics including volume, rates, liquidity depth, and supported assets.

## Overview

**Provider**: Circle CCTP (Cross-Chain Transfer Protocol)
**API**: Circle Iris API (https://iris-api.circle.com)
**API Key Required**: No (Public API)
**Documentation**: https://developers.circle.com/cctp

## Features

✅ **Real API Integration** - Uses Circle Iris API + DefiLlama for comprehensive data
✅ **Retry Logic** - Exponential backoff for failed requests (1s, 2s, 4s)
✅ **Rate Limiting** - Token bucket algorithm (35 requests/second per Circle spec)
✅ **Decimal Normalization** - Proper decimal handling for effective rate calculation
✅ **ENV Configuration** - All settings configurable via environment variables
✅ **Error Resilience** - Graceful handling of API failures and transient errors
✅ **TypeScript** - Full type safety with Zod schemas
✅ **No Hardcoded Data** - USDC addresses sourced from Circle official docs with verification

## Metrics Collected

### 1. Volume (24h, 7d, 30d)
- **Source**: DefiLlama Bridge API (`https://bridges.llama.fi/bridge/cctp`)
- **Why**: Circle CCTP Iris API doesn't provide volume statistics
- **Data**: Real on-chain aggregated volume across all CCTP chains

### 2. Rates & Fees
- **Source**: Circle Iris API `/v2/burn/USDC/fees/{sourceDomain}/{destDomain}`
- **Data**:
  - Fast Transfer fees (finality threshold 1000)
  - Standard Transfer fees (finality threshold 2000)
  - Typically 1 basis point (0.01%)
- **Calculation**: `amountOut = amountIn - (amountIn * feeBps / 10000)`

### 3. Liquidity Depth
- **Source**: Circle Iris API `/v2/fastBurn/USDC/allowance`
- **Data**: Fast Transfer Allowance (collateral pool for fast transfers)
- **Thresholds**:
  - 50bps (0.5%): 80% of fast allowance
  - 100bps (1.0%): 100% of fast allowance

### 4. Available Assets
- **Source**: Circle Official Documentation
- **URL**: https://developers.circle.com/stablecoins/usdc-contract-addresses
- **Data**: USDC addresses on all CCTP-supported chains
- **Supported Chains**:
  - Ethereum (1)
  - Avalanche (43114)
  - Optimism (10)
  - Arbitrum (42161)
  - Base (8453)
  - Polygon PoS (137)

## Installation

```bash
cd packages/_plugin_template
bun install
```

## Configuration

### Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Circle Iris API Base URL
BASE_URL=https://iris-api.circle.com

# Request timeout in milliseconds
TIMEOUT=15000

# Max requests per second for rate limiting
# Circle CCTP API limit: 35 req/sec
MAX_REQUESTS_PER_SECOND=35

# API Key (not required - CCTP is public)
API_KEY=not-required
```

## Usage

### Development Server

```bash
bun dev
```

Plugin available at `http://localhost:3001`

### Testing

```bash
# Run all tests
bun test

# Watch mode
bun test:watch

# Integration tests
bun test:integration
```

### Building

```bash
bun build
```

## API Endpoints

### POST /snapshot

Get complete snapshot of CCTP data for specified routes.

**Request:**
```json
{
  "routes": [
    {
      "source": {
        "chainId": "1",
        "assetId": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        "symbol": "USDC",
        "decimals": 6
      },
      "destination": {
        "chainId": "137",
        "assetId": "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
        "symbol": "USDC",
        "decimals": 6
      }
    }
  ],
  "notionals": ["1000000", "10000000"],
  "includeWindows": ["24h", "7d"]
}
```

**Response:**
```json
{
  "volumes": [
    { "window": "24h", "volumeUsd": 150000000, "measuredAt": "2025-01-XX..." },
    { "window": "7d", "volumeUsd": 1050000000, "measuredAt": "2025-01-XX..." }
  ],
  "rates": [
    {
      "source": {...},
      "destination": {...},
      "amountIn": "1000000",
      "amountOut": "999900",
      "effectiveRate": 0.9999,
      "totalFeesUsd": 0.01,
      "quotedAt": "2025-01-XX..."
    }
  ],
  "liquidity": [...],
  "listedAssets": {...}
}
```

### GET /ping

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-XX..."
}
```

## How Data is Derived

### Volume Metrics
1. Fetch from DefiLlama Bridge API: `https://bridges.llama.fi/bridge/cctp`
2. Extract `lastDailyVolume`, `lastWeeklyVolume`, `lastMonthlyVolume`
3. Cache results for 10 minutes to reduce API load

### Rate Quotes
1. Map chainId to CCTP domain ID (e.g., Ethereum 1 → domain 0)
2. Request fees: `/v2/burn/USDC/fees/{sourceDomain}/{destDomain}`
3. Extract Standard Transfer fee (typically 1 bps)
4. Calculate: `amountOut = amountIn - (amountIn * feeBps / 10000)`
5. Normalize for decimals: `effectiveRate = amountOut / amountIn`

### Liquidity Depth
1. Fetch Fast Transfer Allowance: `/v2/fastBurn/USDC/allowance`
2. Use allowance as proxy for available liquidity
3. Thresholds:
   - 50bps: 80% of allowance (conservative estimate for instant fills)
   - 100bps: 100% of allowance (max instant capacity)

### Listed Assets
1. Source USDC addresses from Circle official docs
2. Verify against Circle's published contract addresses
3. All addresses are immutable (Circle-owned contracts)
4. For production: Consider adding on-chain verification via `TokenMinter` contracts

## Architecture

### Retry Logic
Exponential backoff with 3 attempts:
- Attempt 1: immediate
- Attempt 2: +1s delay
- Attempt 3: +2s delay
- Attempt 4 (if needed): +4s delay

### Rate Limiting
Token bucket algorithm prevents API rate limit violations:
- Max tokens: 35 (per Circle's 35 req/sec limit)
- Refill rate: 35 tokens/second
- Auto-throttles if bucket empty

### Error Handling
- API failures return empty arrays (graceful degradation)
- Volume fetch failure: Return [] with warning
- Liquidity fetch failure: Return [] with warning
- Fees fetch failure: Use default 1 bps fees
- Non-USDC routes: Skip with warning

## Supported Chains & Domains

| Chain | Chain ID | CCTP Domain | USDC Address |
|-------|----------|-------------|--------------|
| Ethereum | 1 | 0 | 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48 |
| Avalanche | 43114 | 1 | 0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E |
| Optimism | 10 | 2 | 0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85 |
| Arbitrum | 42161 | 3 | 0xaf88d065e77c8cC2239327C5EDb3A432268e5831 |
| Base | 8453 | 6 | 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913 |
| Polygon PoS | 137 | 7 | 0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359 |

*Note: Domain 5 (Solana) and other non-EVM chains not included in this version*

## API Constraints

### Rate Limits
- **Limit**: 35 requests per second
- **Penalty**: 5-minute block on exceeding limit (HTTP 429)
- **Our implementation**: Token bucket with 35 req/sec max

### API Availability
- **Base URL**: `https://iris-api.circle.com` (mainnet)
- **Testnet URL**: `https://iris-api-sandbox.circle.com` (testnet)
- **Authentication**: None required (public API)

### Data Limitations
- **Volume**: Not provided by Circle API (using DefiLlama instead)
- **Historical Data**: Limited to attestations and current fees
- **Asset Support**: USDC only (CCTP is USDC-native)

## Troubleshooting

**"Failed to fetch volumes" warning**
- DefiLlama API may be temporarily unavailable
- Plugin continues with empty volume array (graceful degradation)
- Check https://defillama.com/protocol/cctp for manual verification

**"Failed to fetch allowance" error**
- Circle Iris API may be rate-limited or down
- Plugin returns empty liquidity array
- Retry after 5 minutes if rate-limited

**"Unsupported chain" warning**
- Chain not supported by CCTP V2
- Verify chain ID is in CCTP_DOMAIN_MAP
- Check Circle docs for latest supported chains

**"Non-USDC route" warning**
- CCTP only supports USDC transfers
- Verify both source and destination symbols are "USDC"

## Performance

- Average snapshot fetch: ~2-3 seconds (parallel API calls)
- Volume data cached: 10 minutes TTL
- Rate limiting: 35 req/sec max (Circle spec)
- Concurrent routes: Processed in parallel within rate limits

## Data Verification

### USDC Addresses Source
All USDC addresses are sourced from Circle's official documentation:
- **URL**: https://developers.circle.com/stablecoins/usdc-contract-addresses
- **Last Verified**: 2025-01-XX
- **Verification Method**: Manual comparison with Circle docs
- **Immutability**: USDC contracts are owned by Circle (canonical)

For production deployments, consider:
1. Adding on-chain verification via `TokenMinter.getLocalToken()` calls
2. Implementing automated verification against Circle's published addresses
3. Monitoring Circle's GitHub for contract updates

## License

MIT

## Author

**0xJesus** - Built for NEAR Intents Data Collection Bounty

## References

- [Circle CCTP Documentation](https://developers.circle.com/cctp)
- [Circle Iris API Reference](https://developers.circle.com/cctp/cctp-apis)
- [USDC Contract Addresses](https://developers.circle.com/stablecoins/usdc-contract-addresses)
- [DefiLlama CCTP Bridge Stats](https://defillama.com/protocol/cctp)
- [NEAR Intents Bounty](https://t.me/+Xfx2Mx6pbRYxMzA5)
