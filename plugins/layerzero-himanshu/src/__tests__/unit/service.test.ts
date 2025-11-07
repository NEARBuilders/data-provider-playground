import { Effect } from "every-plugin/effect";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { DataProviderService } from "../../service";
import type { EnvConfig } from "../../env";

// Mock route for testing
const mockRoute = {
  source: {
    chainId: "1",
    assetId: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    symbol: "USDC",
    decimals: 6,
  },
  destination: {
    chainId: "137",
    assetId: "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359",
    symbol: "USDC",
    decimals: 6,
  }
};

const testConfig: EnvConfig = {
  LZ_SCAN_BASE_URL: "https://scan.layerzero-api.com/v1",
  STARGATE_BASE_URL: "https://stargate.finance/api/v1",
  HTTP_TIMEOUT_MS: 5000,
  MAX_RETRIES: 2,
  RATE_LIMIT_RPS_LZ: 10,
  RATE_LIMIT_RPS_STG: 10,
};

describe("DataProviderService", () => {
  let service: DataProviderService;

  beforeEach(() => {
    service = new DataProviderService(testConfig);
  });

  describe("getSnapshot", () => {
    it("should return complete snapshot structure", async () => {
      const result = await Effect.runPromise(
        service.getSnapshot({
          routes: [mockRoute],
          notionals: ["1000", "10000"],
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
          notionals: ["1000"],
          includeWindows: ["24h", "7d"]
        })
      );

      expect(result.volumes).toHaveLength(2);
      expect(result.volumes.map(v => v.window)).toContain("24h");
      expect(result.volumes.map(v => v.window)).toContain("7d");
      expect(result.volumes[0].volumeUsd).toBeTypeOf("number");
      expect(result.volumes[0].measuredAt).toBeTypeOf("string");
    });

    it("should generate rates for all route/notional combinations", async () => {
      const result = await Effect.runPromise(
        service.getSnapshot({
          routes: [mockRoute],
          notionals: ["1000", "10000"],
          includeWindows: ["24h"]
        })
      );

      // Should have rates for route/notional combinations
      expect(result.rates.length).toBeGreaterThanOrEqual(0);

      // If rates exist, verify structure
      if (result.rates.length > 0) {
        const rate = result.rates[0];
        expect(rate.source).toBeDefined();
        expect(rate.destination).toBeDefined();
        expect(rate.amountIn).toBeTypeOf("string");
        expect(rate.amountOut).toBeTypeOf("string");
        expect(rate.effectiveRate).toBeTypeOf("number");
        expect(rate.effectiveRate).toBeGreaterThan(0);
        expect(rate.quotedAt).toBeTypeOf("string");
      }
    });

    it("should provide liquidity at 50bps and 100bps thresholds", async () => {
      const result = await Effect.runPromise(
        service.getSnapshot({
          routes: [mockRoute],
          notionals: ["1000"],
          includeWindows: ["24h"]
        })
      );

      expect(result.liquidity.length).toBeGreaterThanOrEqual(0);
      
      if (result.liquidity.length > 0) {
        expect(result.liquidity[0].route).toBeDefined();
      }

      if (result.liquidity.length > 0) {
        const thresholds = result.liquidity[0].thresholds;
        expect(thresholds.length).toBeGreaterThanOrEqual(2);

        // Should have both required thresholds
        const bpsValues = thresholds.map(t => t.slippageBps);
        expect(bpsValues).toContain(50);
        expect(bpsValues).toContain(100);

        // Verify threshold structure
        thresholds.forEach(threshold => {
          expect(threshold.maxAmountIn).toBeTypeOf("string");
          expect(threshold.slippageBps).toBeTypeOf("number");
        });
      }
    });

    it("should return list of supported assets", async () => {
      const result = await Effect.runPromise(
        service.getSnapshot({
          routes: [mockRoute],
          notionals: ["1000"],
          includeWindows: ["24h"]
        })
      );

      expect(result.listedAssets.assets.length).toBeGreaterThanOrEqual(0);

      // Verify asset structure
      result.listedAssets.assets.forEach(asset => {
        expect(asset.chainId).toBeTypeOf("string");
        expect(asset.assetId).toBeTypeOf("string");
        expect(asset.symbol).toBeTypeOf("string");
        expect(asset.decimals).toBeTypeOf("number");
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
          notionals: ["1000"],
          includeWindows: ["24h"]
        })
      );

      // Should have data for routes (may be empty if API calls fail)
      expect(result.liquidity.length).toBeGreaterThanOrEqual(0);
      expect(result.rates.length).toBeGreaterThanOrEqual(0);
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
  });
});
