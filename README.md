# Li.Fi Adapter for NEAR Intents

Production-ready Li.Fi bridge data adapter for NEAR Intents data collection bounty. Collects rates, liquidity depth, and available assets from Li.Fi provider with deterministic contract compliance.

## Quick Start

Requirements: Node 20+, npm

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

- **Rates**: Real-time quotes and fee-aware effective rates (calculated with precise decimal arithmetic).
- **Liquidity Depth**: Probing-based estimates using a bounded binary search for ≤0.5% and ≤1.0% slippage thresholds.
- **Available Assets**: Token listing across supported chains retrieved from the provider API.
- **Volume**: Not available from Li.Fi API — returned as an empty array.


## Implementation Features

- **Precision**: Uses `decimal.js` to avoid floating-point errors and preserve raw token smallest-unit strings.
- **Resilience**: Exponential backoff with jitter, retries, and Bottleneck-based rate limiting to avoid provider throttling.
- **Liquidity Algorithm**: Conservative, bounded binary-search probing for maximum input amounts meeting slippage thresholds; falls back gracefully on failures.
- **Error Handling**: Deterministic fallbacks and clear logging to make snapshots robust for downstream consumers.
- **Contract Compliance**: Implements the oRPC contract (`getSnapshot`, `ping`) expected by the NEAR Intents system.
- **Testing**: Deterministic unit & integration tests using Vitest with mocked fetch handlers to avoid network flakiness.

## Test summary

Short test results (important outputs):

- Date: 2025-10-28
- Test runner: Vitest v3.2.4
- Location: `packages/lifi-adapter`
- Test files executed: 4
- Total tests: 17
- Passed: 17 / 17 (100%)
- Duration: ~27s (end-to-end)

Type checking

- TypeScript compiler: `tsc` v5.9.3
- Type check: Passed (ran `tsc -p tsconfig.build.json --noEmit` in `packages/lifi-adapter`)


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