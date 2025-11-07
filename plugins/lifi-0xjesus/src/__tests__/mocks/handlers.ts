import { http, HttpResponse } from 'msw';

// Mock data for Li.Fi chains
const mockChains = {
  chains: [
    {
      id: 1,
      name: 'Ethereum',
      key: 'eth',
      chainType: 'EVM',
      nativeToken: {
        symbol: 'ETH',
        decimals: 18,
        address: '0x0000000000000000000000000000000000000000',
        name: 'Ether',
        priceUSD: '2500.00'
      },
      mainnet: true
    },
    {
      id: 137,
      name: 'Polygon',
      key: 'pol',
      chainType: 'EVM',
      nativeToken: {
        symbol: 'MATIC',
        decimals: 18,
        address: '0x0000000000000000000000000000000000000000',
        name: 'MATIC',
        priceUSD: '0.80'
      },
      mainnet: true
    },
    {
      id: 42161,
      name: 'Arbitrum',
      key: 'arb',
      chainType: 'EVM',
      nativeToken: {
        symbol: 'ETH',
        decimals: 18,
        address: '0x0000000000000000000000000000000000000000',
        name: 'Ether',
        priceUSD: '2500.00'
      },
      mainnet: true
    }
  ]
};

// Mock data for Li.Fi tokens
const mockTokens = {
  tokens: {
    '1': [
      {
        address: '0xA0b86a33E6442e082877a094f204b01BF645Fe0',
        symbol: 'USDC',
        decimals: 6,
        chainId: 1,
        name: 'USD Coin',
        priceUSD: '1.00'
      },
      {
        address: '0x0000000000000000000000000000000000000000',
        symbol: 'ETH',
        decimals: 18,
        chainId: 1,
        name: 'Ether',
        priceUSD: '2500.00'
      }
    ],
    '137': [
      {
        address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa8417',
        symbol: 'USDC',
        decimals: 6,
        chainId: 137,
        name: 'USD Coin',
        priceUSD: '1.00'
      },
      {
        address: '0x0000000000000000000000000000000000000000',
        symbol: 'MATIC',
        decimals: 18,
        chainId: 137,
        name: 'MATIC',
        priceUSD: '0.80'
      }
    ],
    '42161': [
      {
        address: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
        symbol: 'USDC',
        decimals: 6,
        chainId: 42161,
        name: 'USD Coin',
        priceUSD: '1.00'
      }
    ]
  }
};

// Mock data for DefiLlama bridge volumes
const mockDefiLlamaVolume = {
  id: 'lifi',
  displayName: 'LI.FI',
  lastDailyVolume: 1500000,
  lastWeeklyVolume: 10500000,
  lastMonthlyVolume: 45000000
};

// Create mock quote generator with realistic slippage simulation
function createMockQuote(params: URLSearchParams) {
  const fromChain = params.get('fromChain');
  const toChain = params.get('toChain');
  const fromToken = params.get('fromToken');
  const toToken = params.get('toToken');
  const fromAmount = params.get('fromAmount') || '1000000';

  // Simulate realistic slippage based on trade size
  // Small trades: ~0.2% slippage (0.998 rate)
  // Medium trades: ~0.3-0.4% slippage
  // Large trades: ~0.5-1.0% slippage
  // Very large trades: >1% slippage

  const fromAmountBigInt = BigInt(fromAmount);
  const fromAmountNum = Number(fromAmount);

  // Determine decimals (assume 6 for USDC, 18 for ETH)
  const decimals = fromToken?.toLowerCase().includes('0xa0b86') ||
                   fromToken?.toLowerCase().includes('0x2791') ||
                   fromToken?.toLowerCase().includes('0xff970') ? 6 : 18;

  // Convert to human-readable units
  const amountInUnits = fromAmountNum / Math.pow(10, decimals);

  let slippageFactor: number;

  if (amountInUnits <= 1000) {
    // Small trades: 0.2% slippage
    slippageFactor = 0.998;
  } else if (amountInUnits <= 10000) {
    // Small-medium trades: 0.3% slippage
    slippageFactor = 0.997;
  } else if (amountInUnits <= 100000) {
    // Medium trades: 0.4% slippage
    slippageFactor = 0.996;
  } else if (amountInUnits <= 500000) {
    // Medium-large trades: 0.6% slippage (just above 50bps)
    slippageFactor = 0.994;
  } else if (amountInUnits <= 1000000) {
    // Large trades: 1.0% slippage (at 100bps threshold)
    slippageFactor = 0.990;
  } else {
    // Very large trades: >1% slippage (exceeds 100bps)
    slippageFactor = 0.985;
  }

  // Calculate output amount with slippage
  const outputAmount = (fromAmountBigInt * BigInt(Math.floor(slippageFactor * 1000000)) / BigInt(1000000)).toString();

  return {
    id: 'mock-quote-id',
    type: 'lifi',
    tool: 'hop',
    toolDetails: {
      key: 'hop',
      name: 'Hop',
      logoURI: 'https://mock.logo'
    },
    action: {
      fromChainId: parseInt(fromChain || '1'),
      toChainId: parseInt(toChain || '137'),
      fromToken: {
        address: fromToken || '0xA0b86a33E6442e082877a094f204b01BF645Fe0',
        symbol: 'USDC',
        decimals: 6,
        chainId: parseInt(fromChain || '1'),
        name: 'USD Coin',
        priceUSD: '1.00'
      },
      toToken: {
        address: toToken || '0x2791Bca1f2de4661ED88A30C99A7a9449Aa8417',
        symbol: 'USDC',
        decimals: 6,
        chainId: parseInt(toChain || '137'),
        name: 'USD Coin',
        priceUSD: '1.00'
      },
      fromAmount: fromAmount,
      slippage: 0.005,
      fromAddress: params.get('fromAddress') || '0x0000000000000000000000000000000000000001',
      toAddress: params.get('toAddress') || '0x0000000000000000000000000000000000000001'
    },
    estimate: {
      fromAmount: fromAmount,
      toAmount: outputAmount,
      toAmountMin: (BigInt(outputAmount) * BigInt(995) / BigInt(1000)).toString(),
      approvalAddress: '0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE',
      feeCosts: [
        {
          name: 'Bridge Fee',
          description: 'Fee charged by the bridge',
          token: {
            address: fromToken || '0xA0b86a33E6442e082877a094f204b01BF645Fe0',
            symbol: 'USDC',
            decimals: 6
          },
          amount: '2000',
          amountUSD: '2.00'
        }
      ],
      gasCosts: [
        {
          type: 'SEND',
          price: '30000000000',
          estimate: '150000',
          limit: '200000',
          amount: '4500000000000000',
          amountUSD: '11.25',
          token: {
            address: '0x0000000000000000000000000000000000000000',
            symbol: 'ETH',
            decimals: 18
          }
        }
      ],
      executionDuration: 180
    }
  };
}

// HTTP Request handlers
export const handlers = [
  // Li.Fi Chains endpoint
  http.get('https://api.example.com/chains', () => {
    return HttpResponse.json(mockChains);
  }),

  // Li.Fi Tokens endpoint
  http.get('https://api.example.com/tokens', () => {
    return HttpResponse.json(mockTokens);
  }),

  // Li.Fi Quote endpoint
  http.get('https://api.example.com/quote', ({ request }) => {
    const url = new URL(request.url);
    const quote = createMockQuote(url.searchParams);
    return HttpResponse.json(quote);
  }),

  // DefiLlama Bridge Volume endpoint
  http.get('https://bridges.llama.fi/bridge/lifi', () => {
    return HttpResponse.json(mockDefiLlamaVolume);
  }),
];
