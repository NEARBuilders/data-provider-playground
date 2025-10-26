import { beforeAll, afterEach, afterAll, vi } from 'vitest';

// Replace network mocking via MSW with a lightweight fetch stub for tests.
// This avoids MSW resolution issues in some environments and keeps tests
// deterministic by returning controlled responses for the Li.Fi endpoints.

const originalFetch = globalThis.fetch;

beforeAll(() => {
	globalThis.fetch = vi.fn(async (input: RequestInfo, init?: RequestInit) => {
		const url = typeof input === 'string' ? input : (input as Request).url;

		if (url.startsWith('https://li.quest/v1/tokens')) {
			return new Response(
				JSON.stringify({
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
				}),
				{ status: 200, headers: { 'Content-Type': 'application/json' } }
			);
		}

		if (url.startsWith('https://li.quest/v1/quote')) {
			const params = new URL(url);
			const fromAmount = params.searchParams.get('fromAmount') || '1000';
			const feeAmountUSD = '0.1';

			return new Response(
				JSON.stringify({
					estimate: {
						fromAmount,
						toAmount: fromAmount,
						feeCosts: [{ amount: '0', amountUSD: feeAmountUSD }]
					}
				}),
				{ status: 200, headers: { 'Content-Type': 'application/json' } }
			);
		}

		if (originalFetch) return originalFetch(input as any, init);
		throw new Error('Unhandled network request in tests: ' + url);
	});
});

afterEach(() => {
	// clear mock call history between tests
	(globalThis.fetch as any).mockClear?.();
});

afterAll(() => {
	// restore original fetch implementation
	globalThis.fetch = originalFetch;
});