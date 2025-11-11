/**
 * Shared test fixtures for Across plugin routes
 * These are real, supported routes on the Across protocol
 */

export const ETHEREUM_USDC_TO_POLYGON = {
  source: {
    chainId: "1",
    assetId: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC on Ethereum
    symbol: "USDC",
    decimals: 6,
  },
  destination: {
    chainId: "137",
    assetId: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359", // USDC on Polygon
    symbol: "USDC",
    decimals: 6,
  }
};

export const OPTIMISM_ETH_TO_ARBITRUM = {
  source: {
    chainId: "10",
    assetId: "0x4200000000000000000000000000000000000006", // WETH on Optimism
    symbol: "WETH",
    decimals: 18,
  },
  destination: {
    chainId: "42161",
    assetId: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1", // WETH on Arbitrum
    symbol: "WETH",
    decimals: 18,
  }
};

export const BASE_USDC_TO_ETHEREUM = {
  source: {
    chainId: "8453",
    assetId: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // USDC on Base
    symbol: "USDC",
    decimals: 6,
  },
  destination: {
    chainId: "1",
    assetId: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC on Ethereum
    symbol: "USDC",
    decimals: 6,
  }
};
