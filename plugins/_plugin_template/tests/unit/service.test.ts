import { Effect } from "every-plugin/effect";
import { describe, expect, it } from "vitest";
import { DataProviderService } from "@/service";

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

describe("DataProviderService", () => {
  const service = new DataProviderService(
    "https://api.example.com",
    "test-api-key",
    5000
  );

  describe("getSnapshot", () => {
    it("should return complete snapshot structure", async () => {
      const result = await Effect.runPromise(
        service.getSnapshot({
          routes: [mockRoute],
          notionals: ["1000", "10000"],
          includeWindows: ["24h", "7d", "30d"]
        })
      );

      expect(result).toHaveProperty("volumes");
      expect(result).toHaveProperty("rates");
      expect(result).toHaveProperty("liquidity");
      expect(result).toHaveProperty("listedAssets");
      expect(Array.isArray(result.volumes)).toBe(true);
      expect(Array.isArray(result.rates)).toBe(true);
      expect(Array.isArray(result.liquidity)).toBe(true);
      expect(Array.isArray(result.listedAssets.assets)).toBe(true);
    });

    it("should validate volume data progression and freshness", async () => {
      const result = await Effect.runPromise(
        service.getSnapshot({
          routes: [mockRoute],
          notionals: ["1000"],
          includeWindows: ["24h", "7d", "30d"]
        })
      );

      expect(result.volumes).toHaveLength(3);
      
      const volumes = {
        "24h": result.volumes.find(v => v.window === "24h"),
        "7d": result.volumes.find(v => v.window === "7d"),
        "30d": result.volumes.find(v => v.window === "30d"),
      };

      expect(volumes["24h"]).toBeDefined();
      expect(volumes["7d"]).toBeDefined();
      expect(volumes["30d"]).toBeDefined();

      expect(volumes["24h"]!.volumeUsd).toBeGreaterThan(0);
      expect(volumes["7d"]!.volumeUsd).toBeGreaterThan(0);
      expect(volumes["30d"]!.volumeUsd).toBeGreaterThan(0);
      
      expect(volumes["7d"]!.volumeUsd).toBeGreaterThanOrEqual(volumes["24h"]!.volumeUsd);
      expect(volumes["30d"]!.volumeUsd).toBeGreaterThanOrEqual(volumes["7d"]!.volumeUsd);

      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      result.volumes.forEach(v => {
        expect(new Date(v.measuredAt).getTime()).toBeGreaterThan(fiveMinutesAgo);
      });
    });

    it("should validate rate calculations and scaling", async () => {
      const result = await Effect.runPromise(
        service.getSnapshot({
          routes: [mockRoute],
          notionals: ["1000", "10000"],
          includeWindows: ["24h"]
        })
      );

      expect(result.rates).toHaveLength(2);

      result.rates.forEach(rate => {
        expect(rate.source).toEqual(mockRoute.source);
        expect(rate.destination).toEqual(mockRoute.destination);

        const amountIn = parseFloat(rate.amountIn);
        const amountOut = parseFloat(rate.amountOut);
        expect(amountIn).toBeGreaterThan(0);
        expect(amountOut).toBeGreaterThan(0);

        const decimalAdjustment = Math.pow(10, rate.destination.decimals - rate.source.decimals);
        const calculatedRate = (amountOut / amountIn) * decimalAdjustment;
        expect(Math.abs(calculatedRate - rate.effectiveRate)).toBeLessThan(0.0001);

        expect(rate.totalFeesUsd).toBeGreaterThanOrEqual(0);
        const feePercentage = (rate.totalFeesUsd! / amountIn) * 100;
        expect(feePercentage).toBeLessThanOrEqual(5);

        const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
        expect(new Date(rate.quotedAt).getTime()).toBeGreaterThan(fiveMinutesAgo);
      });

      const rate1000 = result.rates.find(r => r.amountIn === "1000");
      const rate10000 = result.rates.find(r => r.amountIn === "10000");
      
      if (rate1000 && rate10000) {
        const rateDiff = Math.abs(rate1000.effectiveRate - rate10000.effectiveRate);
        expect(rateDiff / rate1000.effectiveRate).toBeLessThan(0.1);
      }
    });

    it("should validate liquidity depth ordering", async () => {
      const result = await Effect.runPromise(
        service.getSnapshot({
          routes: [mockRoute],
          notionals: ["1000"],
          includeWindows: ["24h"]
        })
      );

      expect(result.liquidity).toHaveLength(1);
      expect(result.liquidity[0]?.route).toEqual(mockRoute);

      const thresholds = result.liquidity[0]?.thresholds;
      expect(thresholds).toBeDefined();
      expect(thresholds!.length).toBeGreaterThanOrEqual(2);

      const threshold50 = thresholds?.find(t => t.slippageBps === 50);
      const threshold100 = thresholds?.find(t => t.slippageBps === 100);

      expect(threshold50).toBeDefined();
      expect(threshold100).toBeDefined();

      const amount50 = parseFloat(threshold50!.maxAmountIn);
      const amount100 = parseFloat(threshold100!.maxAmountIn);

      expect(amount50).toBeGreaterThan(0);
      expect(amount100).toBeGreaterThan(0);
      expect(amount50).toBeGreaterThanOrEqual(amount100);

      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      expect(new Date(result.liquidity[0]!.measuredAt).getTime()).toBeGreaterThan(fiveMinutesAgo);
    });

    it("should validate asset uniqueness and rate consistency", async () => {
      const result = await Effect.runPromise(
        service.getSnapshot({
          routes: [mockRoute],
          notionals: ["1000"],
          includeWindows: ["24h"]
        })
      );

      expect(result.listedAssets.assets.length).toBeGreaterThan(0);

      const assetKeys = new Set<string>();
      result.listedAssets.assets.forEach(asset => {
        const key = `${asset.chainId}:${asset.assetId}`;
        expect(assetKeys.has(key)).toBe(false);
        assetKeys.add(key);
      });

      result.rates.forEach(rate => {
        const sourceKey = `${rate.source.chainId}:${rate.source.assetId}`;
        const destKey = `${rate.destination.chainId}:${rate.destination.assetId}`;
        
        expect(assetKeys.has(sourceKey)).toBe(true);
        expect(assetKeys.has(destKey)).toBe(true);
      });

      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      expect(new Date(result.listedAssets.measuredAt).getTime()).toBeGreaterThan(fiveMinutesAgo);
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

      expect(result.liquidity).toHaveLength(2);
      expect(result.rates).toHaveLength(2);
    });
  });
});
