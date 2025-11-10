// Example cross-chain route for testing: Ethereum USDT → BNB Chain USDT
// cBridge supports 66+ chains and 856+ tokens
export const sampleRoute = {
  source: {
    chainId: "1",  // Ethereum Mainnet
    assetId: "0xdAC17F958D2ee523a2206206994597C13D831ec7",  // USDT on Ethereum
    symbol: "USDT",
    decimals: 6,
  },
  destination: {
    chainId: "56",  // BNB Chain
    assetId: "0x55d398326f99059fF775485246999027B3197955",  // USDT on BSC
    symbol: "USDT",
    decimals: 18,
  }
};

export default {
  pluginId: "@data-provider/cbridge",
  port: 3014,
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
