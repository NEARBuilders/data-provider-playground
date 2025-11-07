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
  port: 3014,
  config: {
    // Update these variables to what's required for your plugin
    variables: {
      baseUrl: "https://dln.debridge.finance/v1.0",
      timeout: 10000
    },
    secrets: {
      apiKey: process.env.PLUGIN_API_KEY || "dev-key-12345"
    }
  } satisfies PluginConfigInput<typeof Plugin>
}
