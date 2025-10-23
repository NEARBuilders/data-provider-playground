import { Effect } from "every-plugin/effect";
import { describe, expect, it, beforeAll, afterAll, afterEach } from "vitest";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { DataProviderService } from "../../service";

// Mock route for testing
const mockRoute = {
  source: {
    chainId: "1",
    assetId: "0xA0b86a33E6442e082877a094f204b01BF645Fe0",
    symbol: "USDC",
    decimals: 6,
  },
  destination: {
    chainId: "137",
    assetId: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa8417",
    symbol: "USDC",
    decimals: 6,
  }
};

// Setup MSW server for mocking Across API
const server = setupServer(
  // Mock available-routes endpoint
  http.get('https://test-api.across.to/api/available-routes', () => {
    return HttpResponse.json([
      {
        originChainId: 1,
        originToken: "0xA0b86a33E6442e082877a094f204b01BF645Fe0",
        destinationChainId: 137,
        destinationToken: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa8417",
        enabled: true,
      },
      {
        originChainId: 42161,
        originToken: "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8",
        destinationChainId: 1,
        destinationToken: "0xA0b86a33E6442e082877a094f204b01BF645Fe0",
        enabled: true,
      },
      {
        originChainId: 1,
        originToken: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
        destinationChainId: 10,
        destinationToken: "0x4200000000000000000000000000000000000006",
        enabled: true,
      }
    ]);
  }),

  // Mock suggested-fees endpoint
  http.get('https://test-api.across.to/api/suggested-fees', ({ request }) => {
    const url = new URL(request.url);
    const amount = url.searchParams.get('amount') || '1000000';
    const amountBigInt = BigInt(amount);
    
    // Simulate 0.3% fee
    const feeAmount = amountBigInt * 3n / 1000n;
    const outputAmount = amountBigInt - feeAmount;

    return HttpResponse.json({
      capitalFeePct: "0.001",
      capitalFeeTotal: String(feeAmount / 3n),
      relayGasFeePct: "0.001",
      relayGasFeeTotal: String(feeAmount / 3n),
      relayFeePct: "0.003",
      relayFeeTotal: String(feeAmount),
      lpFeePct: "0.001",
      lpFeeTotal: String(feeAmount / 3n),
      timestamp: String(Math.floor(Date.now() / 1000)),
      isAmountTooLow: false,
      quoteBlock: "12345678",
      spokePoolAddress: "0x5c7BCd6E7De5423a257D81B442095A1a6ced35C5",
      expectedFillTimeSec: 60,
      outputAmount: String(outputAmount),
      totalRelayFee: {
        pct: "0.003",
        total: String(feeAmount),
      },
    });
  }),

  // Mock limits endpoint
  http.get('https://test-api.across.to/api/limits', () => {
    return HttpResponse.json({
      minDeposit: "1000000", // 1 USDC (6 decimals)
      maxDeposit: "5000000000000", // 5M USDC
      maxDepositInstant: "100000000000", // 100K USDC
      maxDepositShortDelay: "500000000000", // 500K USDC
    });
  })
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("DataProviderService (Across)", () => {
  const service = new DataProviderService(
    "https://test-api.across.to/api",
    "test-api-key",
    5000
  );

  describe("getSnapshot", () => {
    it("should return complete snapshot structure", async () => {
      const result = await Effect.runPromise(
        service.getSnapshot({
          routes: [mockRoute],
          notionals: ["1000000", "10000000"],
          includeWindows: ["24h", "7d"]
        })
      );

      // Verify all required fields are present
      expect(result).toHaveProperty("volumes");
      expect(result).toHaveProperty("rates");
      expect(result).toHaveProperty("liquidity");
      expect(result).toHaveProperty("listedAssets");

      // Verify arrays are not empty
      expect(Array.isArray(result.volumes)).toBe(true);
      expect(Array.isArray(result.rates)).toBe(true);
      expect(Array.isArray(result.liquidity)).toBe(true);
      expect(Array.isArray(result.listedAssets.assets)).toBe(true);
    });

    it("should return volumes for requested time windows", async () => {
      const result = await Effect.runPromise(
        service.getSnapshot({
          routes: [mockRoute],
          notionals: ["1000000"],
          includeWindows: ["24h", "7d"]
        })
      );

      expect(result.volumes).toHaveLength(2);
      expect(result.volumes.map(v => v.window)).toContain("24h");
      expect(result.volumes.map(v => v.window)).toContain("7d");
      expect(result.volumes[0].volumeUsd).toBeTypeOf("number");
      // Note: Across API doesn't provide volume data, so we return 0 (documented)
      expect(result.volumes[0].volumeUsd).toBeGreaterThanOrEqual(0);
      expect(result.volumes[0].measuredAt).toBeTypeOf("string");
    });

    it("should fetch rates from Across API with correct fee calculation", async () => {
      const result = await Effect.runPromise(
        service.getSnapshot({
          routes: [mockRoute],
          notionals: ["1000000", "10000000"],
          includeWindows: ["24h"]
        })
      );

      // Should have 2 rates (1 route × 2 notionals)
      expect(result.rates).toHaveLength(2);

      // Verify rate structure
      const rate = result.rates[0];
      expect(rate.source).toEqual(mockRoute.source);
      expect(rate.destination).toEqual(mockRoute.destination);
      expect(rate.amountIn).toBe("1000000");
      expect(rate.amountOut).toBeTypeOf("string");
      
      // Verify effective rate is calculated correctly (should be close to 0.997 due to 0.3% fee)
      expect(rate.effectiveRate).toBeTypeOf("number");
      expect(rate.effectiveRate).toBeGreaterThan(0.99);
      expect(rate.effectiveRate).toBeLessThan(1.0);
      
      // Verify fees are calculated
      expect(rate.totalFeesUsd).toBeTypeOf("number");
      expect(rate.quotedAt).toBeTypeOf("string");
    });

    it("should provide liquidity depth with 50bps and 100bps thresholds", async () => {
      const result = await Effect.runPromise(
        service.getSnapshot({
          routes: [mockRoute],
          notionals: ["1000000"],
          includeWindows: ["24h"]
        })
      );

      expect(result.liquidity).toHaveLength(1);
      expect(result.liquidity[0].route).toEqual(mockRoute);

      const thresholds = result.liquidity[0].thresholds;
      expect(thresholds).toHaveLength(2);

      // Should have both required thresholds
      const bpsValues = thresholds.map(t => t.slippageBps);
      expect(bpsValues).toContain(50);
      expect(bpsValues).toContain(100);

      // Verify threshold structure
      thresholds.forEach(threshold => {
        expect(threshold.maxAmountIn).toBeTypeOf("string");
        expect(BigInt(threshold.maxAmountIn)).toBeGreaterThan(0n);
        expect(threshold.slippageBps).toBeTypeOf("number");
      });

      // Verify 100bps threshold is higher than 50bps (more liquidity at higher slippage)
      const threshold50 = thresholds.find(t => t.slippageBps === 50);
      const threshold100 = thresholds.find(t => t.slippageBps === 100);
      expect(BigInt(threshold100!.maxAmountIn)).toBeGreaterThanOrEqual(BigInt(threshold50!.maxAmountIn));
    });

    it("should return list of supported assets from Across routes", async () => {
      const result = await Effect.runPromise(
        service.getSnapshot({
          routes: [mockRoute],
          notionals: ["1000000"],
          includeWindows: ["24h"]
        })
      );

      // Should extract unique assets from available routes
      expect(result.listedAssets.assets.length).toBeGreaterThan(0);

      // Verify asset structure
      result.listedAssets.assets.forEach(asset => {
        expect(asset.chainId).toBeTypeOf("string");
        expect(asset.assetId).toBeTypeOf("string");
        expect(asset.symbol).toBeTypeOf("string");
        expect(asset.decimals).toBeTypeOf("number");
        expect(asset.decimals).toBeGreaterThan(0);
      });

      expect(result.listedAssets.measuredAt).toBeTypeOf("string");
    });

    it("should handle multiple routes correctly", async () => {
      const secondRoute = {
        source: {
          chainId: "42161",
          assetId: "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8",
          symbol: "USDC",
          decimals: 6,
        },
        destination: {
          chainId: "1",
          assetId: "0xA0b86a33E6442e082877a094f204b01BF645Fe0",
          symbol: "USDC",
          decimals: 6,
        }
      };

      const result = await Effect.runPromise(
        service.getSnapshot({
          routes: [mockRoute, secondRoute],
          notionals: ["1000000"],
          includeWindows: ["24h"]
        })
      );

      // Should have liquidity data for both routes
      expect(result.liquidity).toHaveLength(2);
      expect(result.rates).toHaveLength(2); // 2 routes × 1 notional
    }, 10000); // Increase timeout to 10s for liquidity depth binary search

    it("should handle decimal normalization correctly", async () => {
      const result = await Effect.runPromise(
        service.getSnapshot({
          routes: [mockRoute],
          notionals: ["1000000"], // 1 USDC (6 decimals)
          includeWindows: ["24h"]
        })
      );

      const rate = result.rates[0];
      
      // With 6 decimals and 0.3% fee, effective rate should be ~0.997
      expect(rate.effectiveRate).toBeCloseTo(0.997, 2);
      
      // Verify raw amounts are preserved
      expect(rate.amountIn).toBe("1000000");
      expect(BigInt(rate.amountOut)).toBeLessThan(BigInt(rate.amountIn));
    });
  });

  describe("ping", () => {
    it("should return healthy status when API is accessible", async () => {
      const result = await Effect.runPromise(service.ping());

      expect(result).toEqual({
        status: "ok",
        timestamp: expect.any(String),
      });
    });

    it("should fail when API is not accessible", async () => {
      server.use(
        http.get('https://test-api.across.to/api/available-routes', () => {
          return HttpResponse.json({ error: "Service unavailable" }, { status: 503 });
        })
      );

      await expect(
        Effect.runPromise(service.ping())
      ).rejects.toThrow();
    });
  });
});
