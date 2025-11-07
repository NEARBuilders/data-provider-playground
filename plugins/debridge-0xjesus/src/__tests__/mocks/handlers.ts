import { http, HttpResponse } from "msw";

/**
 * Mock API responses for deBridge and DefiLlama APIs
 */

// Mock deBridge chains
const mockChains = [
  {
    chainId: 1,
    name: "Ethereum",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
  },
  {
    chainId: 137,
    name: "Polygon",
    nativeCurrency: {
      name: "MATIC",
      symbol: "MATIC",
      decimals: 18,
    },
  },
  {
    chainId: 42161,
    name: "Arbitrum",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
  },
];

// Mock deBridge tokens for different chains
const mockTokens: Record<number, any[]> = {
  1: [
    {
      address: "0xA0b86a33E6442e082877a094f204b01BF645Fe0",
      name: "USD Coin",
      symbol: "USDC",
      decimals: 6,
      chainId: 1,
      logoURI: "https://example.com/usdc.png",
    },
  ],
  137: [
    {
      address: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa8417",
      name: "USD Coin",
      symbol: "USDC",
      decimals: 6,
      chainId: 137,
      logoURI: "https://example.com/usdc.png",
    },
  ],
  42161: [
    {
      address: "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8",
      name: "USD Coin",
      symbol: "USDC",
      decimals: 6,
      chainId: 42161,
      logoURI: "https://example.com/usdc.png",
    },
  ],
};

// Mock quote response
const createMockQuote = (
  srcChainId: string,
  dstChainId: string,
  amount: string,
  srcDecimals: number = 6,
  dstDecimals: number = 6
) => {
  const amountBigInt = BigInt(amount);
  const amountOut = (amountBigInt * BigInt(995)) / BigInt(1000); // 0.5% fee simulation

  return {
    estimation: {
      srcChainTokenIn: {
        address: `0xSrcToken${srcChainId}`,
        symbol: "USDC",
        decimals: srcDecimals,
        amount: amount,
        usd: (Number(amount) / Math.pow(10, srcDecimals)).toFixed(2),
      },
      dstChainTokenOut: {
        address: `0xDstToken${dstChainId}`,
        symbol: "USDC",
        decimals: dstDecimals,
        amount: amountOut.toString(),
        usd: (Number(amountOut) / Math.pow(10, dstDecimals)).toFixed(2),
      },
      bridgeFee: {
        amount: "0.5",
        token: {
          symbol: "USD",
        },
      },
    },
    minAmountIn: "1000",
    maxAmountIn: "10000000000000",
    recommendedAmount: "1000000",
  };
};

// Mock DefiLlama bridge data
const mockDefiLlamaBridge = {
  id: "debridge",
  displayName: "deBridge",
  lastDailyVolume: 50000000,
  lastWeeklyVolume: 300000000,
  lastMonthlyVolume: 1200000000,
};

export const handlers = [
  // deBridge: Get supported chains
  http.get("https://api.example.com/supported-chains", () => {
    return HttpResponse.json(mockChains);
  }),

  http.get("https://dln.debridge.finance/v1.0/dln/supported-chains", () => {
    return HttpResponse.json(mockChains);
  }),

  // deBridge: Get tokens for a chain
  http.get("https://api.example.com/tokens", ({ request }) => {
    const url = new URL(request.url);
    const chainId = url.searchParams.get("chainId");

    if (chainId && mockTokens[Number(chainId)]) {
      return HttpResponse.json(mockTokens[Number(chainId)]);
    }

    return HttpResponse.json([]);
  }),

  http.get("https://dln.debridge.finance/v1.0/dln/tokens", ({ request }) => {
    const url = new URL(request.url);
    const chainId = url.searchParams.get("chainId");

    if (chainId && mockTokens[Number(chainId)]) {
      return HttpResponse.json(mockTokens[Number(chainId)]);
    }

    return HttpResponse.json([]);
  }),

  // deBridge: Get quote
  http.get("https://api.example.com/quote", ({ request }) => {
    const url = new URL(request.url);
    const srcChainId = url.searchParams.get("srcChainId") || "1";
    const dstChainId = url.searchParams.get("dstChainId") || "137";
    const amount = url.searchParams.get("amount") || "1000";

    return HttpResponse.json(createMockQuote(srcChainId, dstChainId, amount));
  }),

  http.get("https://dln.debridge.finance/v1.0/dln/quote", ({ request }) => {
    const url = new URL(request.url);
    const srcChainId = url.searchParams.get("srcChainId") || "1";
    const dstChainId = url.searchParams.get("dstChainId") || "137";
    const amount = url.searchParams.get("amount") || "1000";

    return HttpResponse.json(createMockQuote(srcChainId, dstChainId, amount));
  }),

  // DefiLlama: Get bridge data
  http.get("https://bridges.llama.fi/bridge/debridge", () => {
    return HttpResponse.json(mockDefiLlamaBridge);
  }),
];
