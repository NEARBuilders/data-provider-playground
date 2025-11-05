import { beforeAll, afterEach, afterAll, vi } from 'vitest';

// Replace network mocking via MSW with a lightweight fetch stub for tests.
// This avoids MSW resolution issues in some environments and keeps tests
// deterministic by returning controlled responses for the Li.Fi endpoints.

const originalFetch = globalThis.fetch;
let requestCount = 0;
const requestLog: { url: string; timestamp: number }[] = [];
const REQUEST_LIMIT = 100; // Allow up to 100 requests per test
const TIME_WINDOW = 60000; // 60 second window for rate limiting

beforeAll(() => {
	globalThis.fetch = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
		try {
			const url = typeof input === 'string' || input instanceof URL 
				? String(input) 
				: (input as Request).url;
			
			if (!url) {
				throw new Error('URL is required for fetch request');
			}

			// Track requests for debugging
			requestCount++;
			const now = Date.now();
			requestLog.push({ url, timestamp: now });

			// Clean old entries from log (older than TIME_WINDOW)
			const cutoff = now - TIME_WINDOW;
			const recentRequests = requestLog.filter(r => r.timestamp > cutoff);
			
			// Simulate rate limiting if too many requests in short time
			if (recentRequests.length > REQUEST_LIMIT) {
				return new Response(
					JSON.stringify({ error: 'Too Many Requests' }),
					{ status: 429, headers: { 'Content-Type': 'application/json' } }
				);
			}

			// Mock tokens endpoint
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

			// Mock quote endpoint
			if (url.startsWith('https://li.quest/v1/quote')) {
				const params = new URL(url);
				const fromAmount = params.searchParams.get('fromAmount') || '1000';
				const slippage = parseFloat(params.searchParams.get('slippage') || '0.005');
				
				// Simple calculation: toAmount = fromAmount (1:1 ratio for testing)
				const toAmount = fromAmount;
				const toAmountMin = Math.floor(parseFloat(toAmount) * (1 - slippage)).toString();
				const feeAmountUSD = '0.1';

				return new Response(
					JSON.stringify({
						estimate: {
							fromAmount,
							toAmount,
							toAmountMin,
							feeCosts: [{ amount: '0', amountUSD: feeAmountUSD }]
						}
					}),
					{ status: 200, headers: { 'Content-Type': 'application/json' } }
				);
			}

			// Mock analytics/transfers endpoint (v1 format - returns "transfers" not "data")
			if (url.startsWith('https://li.quest/v1/analytics/transfers') || url.startsWith('https://li.quest/v2/analytics/transfers')) {
				// Generate realistic transfer data based on time window
				const params = new URL(url);
				const fromTimestamp = parseInt(params.searchParams.get('fromTimestamp') || '0');
				const toTimestamp = parseInt(params.searchParams.get('toTimestamp') || '0');
				const timeWindow = toTimestamp - fromTimestamp;
				
				// Simulate transfers with volumes proportional to time window
				// For testing: 100k per transfer, ~10 transfers per day
				const transfersPerDay = 10;
				const daysInWindow = timeWindow / (24 * 60 * 60);
				const numTransfers = Math.max(1, Math.ceil(daysInWindow * transfersPerDay));
				
				const transfers = Array.from({ length: Math.min(numTransfers, 100) }, (_, i) => ({
					receiving: {
						amount: '1000000',
						amountUSD: '100000', // $100k per transfer
						token: {
							address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa8417',
							chainId: 137,
							symbol: 'USDC'
						}
					},
					tool: 'anyswap',
					status: 'DONE',
					timestamp: toTimestamp - (i * 86400) // Spread across the window
				}));

				// Response format matches v1 endpoint (transfers field)
				return new Response(
					JSON.stringify({
						transfers,
						data: transfers, // Include both for compatibility
						hasNext: false,
						next: null,
						previous: null
					}),
					{ status: 200, headers: { 'Content-Type': 'application/json' } }
				);
			}

			// Fallback: use original fetch only for unhandled URLs
			if (originalFetch) {
				console.warn(`Falling back to real fetch for: ${url}`);
				return originalFetch(input as any, init);
			}
			
			throw new Error('Unhandled network request in tests: ' + url);
		} catch (error) {
			console.error('Mock fetch error:', error);
			throw error;
		}
	});
});

afterEach(() => {
	// Reset request tracking between tests
	requestCount = 0;
	requestLog.length = 0;
	// clear mock call history between tests
	(globalThis.fetch as any).mockClear?.();
});

afterAll(() => {
	// restore original fetch implementation
	globalThis.fetch = originalFetch;
});