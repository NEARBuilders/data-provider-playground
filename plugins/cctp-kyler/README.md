# Circle CCTP Data Provider Plugin

Circle Cross-Chain Transfer Protocol (CCTP) data provider plugin for the NEAR Intents data collection system.

## Quick Start

1. **Install dependencies**:
   ```bash
   cd packages/cctp
   npm install
   ```

2. **Set environment variables** (create `.env` file in `packages/cctp/`):
   ```bash
   SUBGRAPH_API_KEY=your_subgraph_api_key
   ETHEREUM_SUBGRAPH_ID=E6iPLnDGEgrcc4gu9uiHJxENSRAAzTvUJqQqJcHZqJT1
   ARBITRUM_SUBGRAPH_ID=9DgSggKVrvfi4vdyYTdmSBuPgDfm3D7zfLZ1qaQFjYYW
   ```
   Tests automatically load environment variables from `.env` file using dotenv.

3. **Run tests**:
   ```bash
   npm test
   ```

## Running Tests

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration
```

Tests validate contract compliance and use The Graph subgraphs for volume and liquidity data.

## Environment Variables

Create a `.env` file in `packages/cctp/` with:

```bash
# Required
SUBGRAPH_API_KEY=your_subgraph_api_key

# Optional - Subgraph deployment IDs (defaults provided)
ETHEREUM_SUBGRAPH_ID=E6iPLnDGEgrcc4gu9uiHJxENSRAAzTvUJqQqJcHZqJT1
ARBITRUM_SUBGRAPH_ID=9DgSggKVrvfi4vdyYTdmSBuPgDfm3D7zfLZ1qaQFjYYW
```

Tests automatically load environment variables from `.env` file using dotenv.

## Contract

Single endpoint `getSnapshot` that takes routes, notional amounts, and time windows, returning:

- **volumes**: Trading volume for 24h/7d/30d windows (from The Graph subgraphs)
- **rates**: Exchange rates and fees for each route/notional (1:1 USDC with gas fees)
- **liquidity**: Max input amounts at 50bps and 100bps slippage (estimated from subgraph)
- **listedAssets**: Supported USDC assets across chains

## Notes

- **Burn-and-mint protocol**: CCTP uses 1:1 USDC transfers, so rates are always 1.0
- **Subgraph data source**: Volume and liquidity come from The Graph subgraphs (Ethereum, Arbitrum)
- **Circle API limitation**: Circle's API doesn't provide aggregate endpoints, so subgraph data is used instead
- **Liquidity estimation**: Based on historical transaction patterns, not real-time pool data
- **Error resilience**: Implements retries and rate limiting for subgraph queries

## License

Part of the NEAR Intents data collection system.
