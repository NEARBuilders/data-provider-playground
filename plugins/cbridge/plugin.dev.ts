// Example cross-chain route for testing: Ethereum USDC → Polygon USDC
// cBridge supports 66+ chains and 856+ tokens
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

export const testNotionals = ["100000000", "1000000000"];

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
