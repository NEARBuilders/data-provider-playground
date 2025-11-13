// Universal cross-chain route for testing: Ethereum USDC → Arbitrum USDC
// This route is used across all plugins for consistent testing
export const testRoutes = [
  {
    source: {
      blockchain: "eth",
      assetId: "nep141:eth-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.omft.near",
      symbol: "USDC",
      decimals: 6,
      contractAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    },
    destination: {
      blockchain: "arb",
      assetId: "nep141:arb-0xaf88d065e77c8cc2239327c5edb3a432268e5831.omft.near",
      symbol: "USDC",
      decimals: 6,
      contractAddress: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    }
  }
];

// Universal test notionals: $100, $1K, $10K, $100K, $1M (in USDC base units)
export const testNotionals = [
  "100000000",      // $100
  "1000000000",     // $1,000
  "10000000000",    // $10,000
  "100000000000",   // $100,000
  "1000000000000"   // $1,000,000
];

export default {
  pluginId: "@data-provider/cbridge",
  port: 3021,
  config: {
    variables: {
      baseUrl: process.env.CBRIDGE_BASE_URL || "https://cbridge-prod2.celer.app",
      timeout: parseInt(process.env.CBRIDGE_TIMEOUT || "30000")
    },
    secrets: {
      apiKey: process.env.CBRIDGE_API_KEY || ""  // No API key needed for cBridge
    }
  }
}
