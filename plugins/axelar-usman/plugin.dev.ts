import type { PluginConfigInput } from 'every-plugin';
import type Plugin from './src/index';
import packageJson from './package.json' with { type: 'json' };

// Example cross-chain route for testing: Ethereum USDC → Polygon USDC
// Modify this for running your tests
export const sampleRoute = {
  source: {
    chainId: "1",  // Ethereum Mainnet
    assetId: "0xA0b86a33E6442e082877a094f204b01BF645Fe0",  // USDC on Ethereum
    symbol: "USDC",
    decimals: 6,
  },
  destination: {
    chainId: "137",  // Polygon
    assetId: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa8417",  // USDC on Polygon
    symbol: "USDC",
    decimals: 6,
  }
};

export default {
  pluginId: packageJson.name, // DO NOT CHANGE
  port: 3015, // Changed from 3014 to avoid conflict with template plugin
  config: {
    // Axelar-specific configuration
    variables: {
      baseUrl: "https://api.axelarscan.io/api", // Axelar Scan API
      timeout: 30000 // Longer timeout for cross-chain data
    },
    secrets: {
      apiKey: process.env.PLUGIN_API_KEY || "" // Axelar API is public, no key required
    }
  } satisfies PluginConfigInput<typeof Plugin>
}
