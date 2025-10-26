# Li.Fi Adapter for NEAR Intents

Production-ready Li.Fi bridge data adapter for NEAR Intents data collection bounty. Collects rates, liquidity depth, and available assets from Li.Fi provider with deterministic contract compliance.

## Quick Start

Requirements: Node 18+, npm

```bash
# Install dependencies
npm install

# Run tests
cd packages/lifi-adapter && npm test

# Build adapter
cd packages/lifi-adapter && npm run build

# Type check
cd packages/lifi-adapter && npm run type-check
```

## Provider Details

**Li.Fi** - Cross-chain bridge aggregator (https://li.fi/)
- API: https://docs.li.fi/api-reference/introduction
- Endpoints: `GET /tokens`, `GET /quote`

## Metrics Provided

- **Rates**: Real-time quotes with precise fee calculations using decimal.js
- **Liquidity Depth**: Binary-search probing for ≤0.5% and ≤1.0% slippage thresholds
- **Available Assets**: Token list across supported chains
- **Volume**: Empty array (Li.Fi API limitation)

## Environment Variables

- `LIFI_API_KEY` - Optional API key (default: none)
- `LIFI_BASE_URL` - Base URL (default: `https://li.quest/v1`)
- `LIFI_TIMEOUT` - Request timeout in ms (default: `10000`)
- `RATE_LIMIT_CONCURRENCY` - Max concurrent requests (default: `5`)
- `RATE_LIMIT_MIN_TIME_MS` - Min time between requests (default: `200`)

## Implementation Features

- **Precision**: decimal.js for arithmetic, raw token amounts as strings
- **Resilience**: Exponential backoff, jitter, retry logic, Bottleneck rate limiting
- **Liquidity Algorithm**: Bounded binary search with conservative fallbacks
- **Error Handling**: Graceful degradation, deterministic fallbacks
- **Contract**: oRPC compliance with `getSnapshot` and `ping` methods
- **Testing**: Deterministic tests with mocked fetch (Vitest)

## Project Structure

```
lifi-adapter-for-near/
├── packages/
│   ├── lifi-adapter/               # Main Li.Fi adapter implementation
│   │   ├── src/
│   │   │   ├── __tests__/          # Test suite (unit + integration)
│   │   │   │   ├── integration/    # Plugin and server integration tests
│   │   │   │   ├── mocks/          # MSW mock handlers and server
│   │   │   │   ├── unit/           # Unit tests for service and utils
│   │   │   │   └── setup.ts        # Test setup configuration
│   │   │   ├── utils/              # Utility modules
│   │   │   │   ├── decimal.ts      # Precise arithmetic with decimal.js
│   │   │   │   ├── http.ts         # Rate limiting and retry logic
│   │   │   │   └── liquidity.ts    # Binary search liquidity probing
│   │   │   ├── contract.ts         # oRPC contract definition
│   │   │   ├── index.ts            # Plugin entry point
│   │   │   └── service.ts          # Core DataProviderService
│   │   ├── dev/                    # Development and demo tools
│   │   │   ├── demo.mjs            # JavaScript demo script
│   │   │   ├── demo.ts             # TypeScript demo script
│   │   │   ├── server.mjs          # JavaScript demo server
│   │   │   └── server.ts           # TypeScript demo server
│   │   ├── .env.example            # Environment variables template
│   │   ├── DEMO.md                 # Demo usage instructions
│   │   └── package.json            # Dependencies and scripts
│   ├── api/                        # API runtime for plugin system
│   │   ├── src/
│   │   │   ├── routers/            # API route definitions
│   │   │   ├── context.ts          # Request context
│   │   │   ├── index.ts            # API entry point
│   │   │   └── runtime.ts          # Runtime configuration
│   │   └── package.json
│   └── _plugin_template/           # Original template (reference)
│       ├── src/
│       │   ├── __tests__/          # Template test structure
│       │   ├── contract.ts         # Template contract
│       │   ├── index.ts            # Template entry
│       │   └── service.ts          # Template service
│       └── README.md               # Template documentation
├── apps/
│   └── web/                        # Web UI for plugin testing
│       ├── src/
│       │   ├── app/                # Next.js app router
│       │   ├── components/         # React components
│       │   ├── lib/                # Utility libraries
│       │   └── utils/              # Helper functions
│       └── package.json
├── types/                          # TypeScript type definitions
├── .gitignore                      # Git ignore rules
├── package.json                    # Root package configuration
├── tsconfig.json                   # TypeScript configuration
└── turbo.json                      # Turborepo configuration
```

## Limitations

1. No aggregated volume data (Li.Fi API limitation)
2. Liquidity estimates from quote probing, not orderbook snapshots
3. Chain coverage limited to Li.Fi supported networks
4. Conservative rate limiting defaults (tune via environment variables)