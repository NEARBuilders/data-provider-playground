import type { PluginConfigInput } from 'every-plugin';
import type Plugin from './src/index';
import packageJson from './package.json' with { type: 'json' };

// Modify this for running your tests
export const sampleRoute = {
  source: {
    chainId: "2",
    assetId: "0xA0b86a33E6442e082877a094f204b01BF645Fe0",
    symbol: "USDC",
    decimals: 6,
  },
  destination: {
    chainId: "1",
    assetId: "So11111111111111111111111111111111111111112",
    symbol: "SOL",
    decimals: 9,
  }
};

export default {
  pluginId: packageJson.name, // DO NOT CHANGE
  port: 3014,
  config: {
    // Update these variables to what's required for your plugin
    variables: {
      baseUrl: "https://api.wormholescan.io",
      timeout: 10000
    },
    secrets: {
      apiKey: process.env.PLUGIN_API_KEY || ""
    }
  } satisfies PluginConfigInput<typeof Plugin>
}
