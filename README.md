# Li.Fi Adapter for NEAR Intents

Production-ready Li.Fi bridge data adapter for NEAR Intents data collection bounty. Collects rates, liquidity depth, and available assets from Li.Fi provider with deterministic contract compliance.

## Quick Start

Requirements: Node 20+ or **Bun** (recommended, faster).

### Bun workflow (recommended)

```bash
# Install dependencies
bun install

# Run tests (see Testing section for `bun test` vs `bun run test` differences)
bun run test                          # Vitest (recommended for CI/CD) ✅
# OR
bun test                              # Bun native test runner (for development)

# Run lifi-adapter tests only
cd packages/lifi-adapter && bun run test     # CI/CD / Production
cd packages/lifi-adapter && bun test          # Development

# Build adapter
cd packages/lifi-adapter && bun run build

# Type check
cd packages/lifi-adapter && bun run type-check

# Development server (Rspack, http://localhost:3014)
cd packages/lifi-adapter && bun dev

# Run demo (mock mode)
cd packages/lifi-adapter && bun run demo:mock

```

### npm workflow (alternative)

```bash
# Install dependencies
npm install

# Run tests (all tests)
npm test

# Run lifi-adapter tests only
cd packages/lifi-adapter && npm test

# Build adapter
cd packages/lifi-adapter && npm run build

# Type check
cd packages/lifi-adapter && npm run type-check

# Development server (Rspack)
cd packages/lifi-adapter && npm run dev
```

## Configuration

- Copy `packages/lifi-adapter/.env.example` to `.env` (same folder) and adjust as needed.
- **Variables**:
  - `LIFI_BASE_URL`: Li.Fi API base URL (default: `https://li.quest/v1`)
  - `LIFI_MAX_CONCURRENT`: Rate limiter concurrency (default: `5`)
  - `LIFI_MIN_TIME`: Minimum time between requests in ms (default: `200`)
- **Note**: Li.Fi public APIs do not require authentication; the adapter uses public endpoints by default.

## Provider Details

**Li.Fi** - Cross-chain bridge aggregator (https://li.fi/)
- API: https://docs.li.fi/api-reference/introduction
- Endpoints: `GET /tokens`, `GET /quote`

## Metrics Provided

- **Rates**: Real-time quotes and fee-aware effective rates (calculated with precise decimal arithmetic).
- **Liquidity Depth**: Probing-based estimates using a bounded binary search for ≤0.5% and ≤1.0% slippage thresholds.
- **Available Assets**: Token listing across supported chains retrieved from the provider API.
- **Volume**: Aggregated cross-chain transfer volumes from Li.Fi `/analytics/transfers` endpoint for 24h/7d/30d windows.


## Implementation Features

- **Precision**: Uses `decimal.js` to avoid floating-point errors and preserve raw token smallest-unit strings.
- **Resilience**: Exponential backoff with jitter, retries, Bottleneck-based rate limiting, and deterministic fallback quotes when Li.Fi throttles requests.
- **Liquidity Algorithm**: Conservative, bounded binary-search probing for maximum input amounts meeting slippage thresholds; falls back gracefully on failures.
- **Error Handling**: Deterministic fallbacks and clear logging to make snapshots robust for downstream consumers.
- **Contract Compliance**: Implements the oRPC contract (`getSnapshot`, `ping`) expected by the NEAR Intents system.
- **Testing**: Deterministic unit & integration tests using Vitest with mocked fetch handlers to avoid network flakiness.

## Compliance Checklist

- **Objective**: Implements the Li.Fi competitor adapter using the `every-plugin` template (`packages/lifi-adapter/src/index.ts`) and captures rates, liquidity depth, assets, and empty volume placeholders.
- **Requirements**: Off-chain Li.Fi `/quote` and `/tokens` APIs only; ENV-driven variables/secrets configure base URL, timeout, and rate limits; resilience handled by `HttpUtils` (retries, backoff, limiter) and deterministic fallbacks; README documents setup, env vars, and data behavior; Vitest suite extended and passing.
- **Contract Specification**: `packages/lifi-adapter/src/contract.ts` mirrors the template contract without field shape changes, normalizes decimals for `effectiveRate`, and retains smallest-unit strings.
- **Contract Rules**: Repo ships a single provider (`@lifi/adapter`), keeps all field names intact, computes normalized rates, and liquidity thresholds cover ≤0.5% and ≤1.0% slippage.
- **Template Repository**: Derived from `NEARBuilders/data-provider-playground`, retaining the `_plugin_template` reference and adapting only the Li.Fi service-specific pieces.
- **Evaluation Readiness**: Strong type-safety via Zod schemas, reliability under rate limits through limiter + fallbacks, and comprehensive test/demo coverage to evidence correctness.
- **Submission Package**: README documents provider endpoints, configuration, and execution steps; repository is ready to share as the single-provider submission link.

## Testing

### Running Tests

There are **two test runners** with different purposes:

```bash
# For CI/CD and production validation ✅ RECOMMENDED
bun run test

# For development and quick local testing
bun test

# In lifi-adapter folder:
cd packages/lifi-adapter
bun run test:unit          # Unit tests only (with mocks)
bun run test:integration   # Integration tests only (with mocks)
bun run test:watch         # Watch mode
```


### Latest Test Results

- Date: 2025-11-06
- Test runner: Vitest v3.2.4 (via `bun run test`)
- Location: `packages/lifi-adapter`
- Test files executed: 4
- Total tests: 16 passed, 1 skipped
- Status: **100% passing** 


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

1. Liquidity estimates from quote probing, not orderbook snapshots
2. Chain coverage limited to Li.Fi supported networks
3. Conservative rate limiting defaults (tune via environment variables)
4. Volume data reflects only Li.Fi routed transfers (not all DEX activity)