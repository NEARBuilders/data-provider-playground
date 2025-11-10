import type { PluginConfigInput } from 'every-plugin';
import type Plugin from './src/index';
import packageJson from './package.json' with { type: 'json' };

// Example cross-chain route for testing: Ethereum USDC → Polygon USDC
// Modify this for running your tests
export const sampleRoute = {
  source: {
    chainId: "1",  // Ethereum Mainnet
    assetId: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",  // USDC on Ethereum
    symbol: "USDC",
    decimals: 6,
  },
  destination: {
    chainId: "137",  // Polygon
    assetId: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",  // USDC on Polygon
    symbol: "USDC",
    decimals: 6,
  }
};

export const testRoutes = [
  {
    source: {
      chainId: "1",
      assetId: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      symbol: "USDC",
      decimals: 6,
    },
    destination: {
      chainId: "137",
      assetId: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
      symbol: "USDC",
      decimals: 6,
    }
  },
  {
    source: {
      chainId: "42161",
      assetId: "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8",
      symbol: "USDC",
      decimals: 6,
    },
    destination: {
      chainId: "1",
      assetId: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      symbol: "USDC",
      decimals: 6,
    }
  }
];

export const testNotionals = ["1000000", "10000000"];

export default {
  pluginId: packageJson.name, // DO NOT CHANGE
  port: 3019,
  config: {
    // Update these variables to what's required for your plugin
    variables: {
      baseUrl: "https://li.quest/v1",
      defillamaBaseUrl: "https://bridges.llama.fi",
      timeout: 15000,
      maxRequestsPerSecond: 10,
    },
    secrets: {
      apiKey: "not-required"
    }
  } satisfies PluginConfigInput<typeof Plugin>
}
