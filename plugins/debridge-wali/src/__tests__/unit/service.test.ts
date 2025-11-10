import { Effect } from "every-plugin/effect";
import { describe, expect, it, beforeEach } from "vitest";
import { DataProviderService } from "../../src/service";

// Mock route for testing
const mockRoute = {
  source: {
    chainId: "1",
    assetId: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    symbol: "USDC",
    decimals: 6,
  },
  destination: {
    chainId: "137",
    assetId: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
    symbol: "USDC",
    decimals: 6,
  }
};

describe("DataProviderService - Unit Tests", () => {
  let service: DataProviderService;

  beforeEach(() => {
    service = new DataProviderService(
      "https://dln.debridge.finance/v1.0",
      "https://bridges.llama.fi",
      "not-required", // API key optional
      30000,
      10 // maxRequestsPerSecond
  );
  });

  describe("getSnapshot", () => {
    it("should return complete snapshot structure", async () => {
      const result = await Effect.runPromise(
        service.getSnapshot({
          routes: [mockRoute],
          notionals: ["1000000", "10000000"], // $1 and $10
          includeWindows: ["24h", "7d"]
        })
      );

      // Verify all required fields are present
      expect(result).toHaveProperty("volumes");
      expect(result).toHaveProperty("rates");
      expect(result).toHaveProperty("liquidity");
      expect(result).toHaveProperty("listedAssets");

      // Verify arrays are correct type
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
          includeWindows: ["24h", "7d", "30d"]
        })
      );

      expect(result.volumes).toHaveLength(3);
      expect(result.volumes.map(v => v.window)).toContain("24h");
      expect(result.volumes.map(v => v.window)).toContain("7d");
      expect(result.volumes.map(v => v.window)).toContain("30d");
      
      // Verify each volume has required fields
      result.volumes.forEach(vol => {
        expect(vol.volumeUsd).toBeTypeOf("number");
        expect(vol.volumeUsd).toBeGreaterThanOrEqual(0);
        expect(vol.measuredAt).toBeTypeOf("string");
      });
    });

    it("should generate rates for all route/notional combinations", async () => {
      const result = await Effect.runPromise(
        service.getSnapshot({
          routes: [mockRoute],
          notionals: ["1000000", "10000000"], // 2 notionals
          includeWindows: ["24h"]
        })
      );

      // Should have 2 rates (1 route × 2 notionals)
      expect(result.rates).toHaveLength(2);

      // Verify rate structure
      const rate = result.rates[0];
      expect(rate.source).toEqual(mockRoute.source);
      expect(rate.destination).toEqual(mockRoute.destination);
      // amountIn includes operating expense (prepended by deBridge API)
      // Don't hardcode expected value - API may change. Just verify it's a valid string number
      expect(rate.amountIn).toBeTypeOf("string");
      expect(parseFloat(rate.amountIn)).toBeGreaterThan(0);
      expect(rate.amountOut).toBeTypeOf("string");
      expect(parseFloat(rate.amountOut)).toBeGreaterThan(0);
      expect(rate.effectiveRate).toBeTypeOf("number");
      expect(rate.effectiveRate).toBeGreaterThan(0);
      expect(rate.effectiveRate).toBeLessThanOrEqual(1); // Can't get more out than in
      expect(rate.totalFeesUsd).toBeTypeOf("number");
      expect(rate.quotedAt).toBeTypeOf("string");
    });

    it("should calculate effective rate correctly with decimal precision", async () => {
      const result = await Effect.runPromise(
        service.getSnapshot({
          routes: [mockRoute],
          notionals: ["1000000"], // $1 USDC
          includeWindows: ["24h"]
        })
      );

      const rate = result.rates[0];
      
      // Don't hardcode exact expected rate - API fees/expenses can change
      // Just verify the effective rate is reasonable (loses some value due to fees)
      expect(rate.effectiveRate).toBeGreaterThan(0.9); // At least 90% (reasonable fee range)
      expect(rate.effectiveRate).toBeLessThan(1.0); // Less than 100% (some fees exist)
      
      // Amount out should be less than amount in (fees exist)
      const amountIn = parseFloat(rate.amountIn);
      const amountOut = parseFloat(rate.amountOut);
      expect(amountOut).toBeLessThan(amountIn);
      expect(amountOut).toBeGreaterThan(0);
      
      // Effective rate should match the actual ratio
      const actualRatio = amountOut / amountIn;
      expect(rate.effectiveRate).toBeCloseTo(actualRatio, 4);
    });

    it("should provide liquidity at 50bps and 100bps thresholds", async () => {
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
        expect(parseFloat(threshold.maxAmountIn)).toBeGreaterThan(0);
        expect(threshold.slippageBps).toBeTypeOf("number");
      });

      // 100bps threshold should allow equal or more than 50bps
      const threshold50 = thresholds.find(t => t.slippageBps === 50);
      const threshold100 = thresholds.find(t => t.slippageBps === 100);
      expect(parseFloat(threshold100!.maxAmountIn)).toBeGreaterThanOrEqual(
        parseFloat(threshold50!.maxAmountIn)
      );
    });

    it("should return list of supported assets", async () => {
      const result = await Effect.runPromise(
        service.getSnapshot({
          routes: [mockRoute],
          notionals: ["1000000"],
          includeWindows: ["24h"]
        })
      );

      expect(result.listedAssets.assets.length).toBeGreaterThan(0);

      // Verify asset structure
      result.listedAssets.assets.forEach(asset => {
        expect(asset.chainId).toBeTypeOf("string");
        expect(asset.assetId).toBeTypeOf("string");
        expect(asset.symbol).toBeTypeOf("string");
        expect(asset.decimals).toBeTypeOf("number");
        expect(asset.decimals).toBeGreaterThanOrEqual(0);
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
          assetId: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
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
    });

    it("should require routes and notionals", async () => {
      // Empty routes should fail
      await expect(
        Effect.runPromise(
          service.getSnapshot({
            routes: [],
            notionals: ["1000000"]
          })
        )
      ).rejects.toThrow();

      // Empty notionals should fail
      await expect(
        Effect.runPromise(
          service.getSnapshot({
            routes: [mockRoute],
            notionals: []
          })
        )
      ).rejects.toThrow();
    });

    it("should handle different token decimals correctly", async () => {
      // Test with WBTC (8 decimals) to USDC (6 decimals)
      const btcRoute = {
        source: {
          chainId: "1",
          assetId: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
          symbol: "WBTC",
          decimals: 8,
        },
        destination: {
          chainId: "137",
          assetId: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
          symbol: "USDC",
          decimals: 6,
        }
      };

      const result = await Effect.runPromise(
        service.getSnapshot({
          routes: [btcRoute],
          notionals: ["100000000"], // 1 WBTC
          includeWindows: ["24h"]
        })
      );

      expect(result.rates).toHaveLength(1);
      const rate = result.rates[0];
      
      // Should handle decimal conversion properly
      expect(rate.effectiveRate).toBeTypeOf("number");
      expect(rate.effectiveRate).toBeGreaterThan(0);
      expect(rate.amountOut).toBeTypeOf("string");
    });
  });

  describe("ping", () => {
    it("should return healthy status", async () => {
      const result = await Effect.runPromise(service.ping());

      expect(result).toEqual({
        status: "ok",
        timestamp: expect.any(String),
      });
    });

    it("should include valid ISO timestamp", async () => {
      const result = await Effect.runPromise(service.ping());
      
      const timestamp = new Date(result.timestamp);
      expect(timestamp.toString()).not.toBe("Invalid Date");
    });
  });
});
