import { http, HttpResponse } from 'msw';

/**
 * MSW handlers for deBridge DLN API mocking
 * Provides deterministic responses for testing
 * Based on real deBridge API response structure
 */

const DLN_API_BASE = 'https://dln.debridge.finance/v1.0';
const STATS_API_BASE = 'https://stats-api.dln.trade/api';

export const handlers = [
  // Supported chains info (tokens endpoint)
  http.get(`${DLN_API_BASE}/supported-chains-info`, () => {
    return HttpResponse.json({
      chains: [
        {
          chainId: 1,
          tokens: [
            {
              chainId: 1,
              address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
              symbol: 'USDC',
              name: 'USD Coin',
              decimals: 6,
            },
            {
              chainId: 1,
              address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
              symbol: 'USDT',
              name: 'Tether USD',
              decimals: 6,
            },
          ],
        },
        {
          chainId: 137,
          tokens: [
            {
              chainId: 137,
              address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
              symbol: 'USDC',
              name: 'USD Coin',
              decimals: 6,
            },
          ],
        },
        {
          chainId: 42161,
          tokens: [
            {
              chainId: 42161,
              address: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
              symbol: 'USDC',
              name: 'USD Coin',
              decimals: 6,
            },
          ],
        },
      ],
    });
  }),

  // Create-tx endpoint (used for quotes)
  http.get(`${DLN_API_BASE}/dln/order/create-tx`, ({ request }: { request: Request }) => {
    const url = new URL(request.url);
    const fromAmount = url.searchParams.get('srcChainTokenInAmount') || '1000000';
    const fromAmountNum = parseFloat(fromAmount);
    const srcChainId = parseInt(url.searchParams.get('srcChainId') || '1');
    const dstChainId = parseInt(url.searchParams.get('dstChainId') || '137');
    
    // Simulate 0.4% total fee (protocol + taker margin + operating expense)
    const feePercent = 0.004;
    const operatingExpense = Math.floor(fromAmountNum * 0.002);
    const totalAmount = fromAmountNum + operatingExpense;
    const toAmount = Math.floor(fromAmountNum * (1 - feePercent));
    const protocolFee = Math.floor(fromAmountNum * 0.0004);

    return HttpResponse.json({
      estimation: {
        srcChainTokenIn: {
          address: url.searchParams.get('srcChainTokenIn') || '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
          chainId: srcChainId,
          decimals: 6,
          name: 'USD Coin',
          symbol: 'USDC',
          amount: totalAmount.toString(),
          approximateOperatingExpense: operatingExpense.toString(),
          mutatedWithOperatingExpense: true,
          approximateUsdValue: fromAmountNum / 1000000,
          originApproximateUsdValue: fromAmountNum / 1000000,
        },
        dstChainTokenOut: {
          address: url.searchParams.get('dstChainTokenOut') || '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
          chainId: dstChainId,
          decimals: 6,
          name: 'USD Coin',
          symbol: 'USDC',
          amount: toAmount.toString(),
          recommendedAmount: toAmount.toString(),
          maxTheoreticalAmount: toAmount.toString(),
          approximateUsdValue: toAmount / 1000000,
          recommendedApproximateUsdValue: toAmount / 1000000,
        },
        costsDetails: [
          {
            chain: srcChainId.toString(),
            tokenIn: url.searchParams.get('srcChainTokenIn') || '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
            tokenOut: url.searchParams.get('srcChainTokenIn') || '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
            amountIn: fromAmount,
            amountOut: fromAmount,
            type: 'DlnProtocolFee',
            payload: {
              feeAmount: protocolFee.toString(),
              feeBps: '40',
              feeApproximateUsdValue: (protocolFee / 1000000).toFixed(6),
            },
          },
        ],
        recommendedSlippage: 1.0,
      },
      orderId: '0x5b5bc380d52a582b56b1c5819150a1abf230b8e72c84910c4fb82b37563c2e4f',
      order: {
        approximateFulfillmentDelay: 3,
        salt: Date.now(),
        metadata: '0x0101',
      },
      tx: {
        to: '0x663DC15D3C1aC63ff12E45Ab68FeA3F0a883C251',
        data: '0x4d8160ba',
        value: '1000000000000000',
      },
      prependedOperatingExpenseCost: operatingExpense.toString(),
      protocolFee: protocolFee.toString(),
      protocolFeeApproximateUsdValue: protocolFee / 1000000,
      fixFee: '1000000000000000',
      userPoints: 100,
      integratorPoints: 25,
      usdPriceImpact: -0.4,
    });
  }),

  // Volume/statistics endpoint - POST /Orders/filteredList
  http.post(`${STATS_API_BASE}/Orders/filteredList`, async ({ request }: { request: Request }) => {
    const body = await request.json() as any;
    const take = body.take || 100;
    
    // Return mock orders with varying amounts
    const mockOrders = [];
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    
    for (let i = 0; i < Math.min(take, 50); i++) {
      mockOrders.push({
        orderId: `0x${i.toString(16).padStart(64, '0')}`,
        giveChainId: 1,
        takeChainId: 137,
        giveTokenAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        takeTokenAddress: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
        giveAmount: (Math.random() * 10000 * 1000000).toFixed(0), // Random amount up to 10k USDC
        takeAmount: (Math.random() * 10000 * 1000000).toFixed(0),
        createdAt: new Date(now - Math.random() * 30 * dayMs).toISOString(),
        status: 'Fulfilled',
      });
    }
    
    return HttpResponse.json({ orders: mockOrders });
  }),
];

