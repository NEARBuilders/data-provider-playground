// @ts-ignore - msw types may not be present in this environment during TS checks
import { rest } from 'msw';

// Mock tokens across chains (3 tokens total)
export const handlers = [
  rest.get('https://li.quest/v1/tokens', (_req: any, res: any, ctx: any) => {
    try {
      return res(
        ctx.status(200),
        ctx.json({
          tokens: {
            '1': [
              { chainId: 1, address: '0xA0b86a33E6442e082877a094f204b01BF645Fe0', symbol: 'USDC', decimals: 6, name: 'USD Coin' }
            ],
            '137': [
              { chainId: 137, address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa8417', symbol: 'USDC', decimals: 6, name: 'USD Coin' }
            ],
            '42161': [
              { chainId: 42161, address: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8', symbol: 'USDC', decimals: 6, name: 'USD Coin' }
            ]
          }
        })
      );
    } catch (error) {
      return res(ctx.status(500), ctx.json({ error: 'Mock handler error' }));
    }
  }),

  // Mock quote endpoint - echo fromAmount and return toAmount as fromAmount * 1 (no slippage)
  rest.get('https://li.quest/v1/quote', (req: any, res: any, ctx: any) => {
    try {
      const fromAmount = req.url?.searchParams?.get('fromAmount') || '1000';
      const feeAmountUSD = '0.1';

      if (!fromAmount || isNaN(Number(fromAmount))) {
        return res(ctx.status(400), ctx.json({ error: 'Invalid fromAmount parameter' }));
      }

      return res(
        ctx.status(200),
        ctx.json({
          estimate: {
            fromAmount,
            toAmount: fromAmount, // 1:1 for mock
            feeCosts: [
              { amount: '0', amountUSD: feeAmountUSD }
            ]
          }
        })
      );
    } catch (error) {
      return res(ctx.status(500), ctx.json({ error: 'Mock quote handler error' }));
    }
  })
];