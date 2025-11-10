import { describe, expect, it } from "vitest";
import { Effect } from "every-plugin/effect";
import { DataProviderService } from "../../src/service";

const API_TIMEOUT = 60000;
const BASE_URL = "https://api.axelarscan.io/api/v1";

const PRIMARY_ROUTE = {
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

const SECONDARY_ROUTE = {
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

describe("DataProviderService", () => {
  const service = new DataProviderService(BASE_URL, "", 30000);

  describe("getSnapshot", () => {
    it("should return complete snapshot structure", async () => {
      const result = await Effect.runPromise(
        service.getSnapshot({
          routes: [PRIMARY_ROUTE],
          notionals: ["1000", "10000"],
          includeWindows: ["24h", "7d"]
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
    }, API_TIMEOUT);

    it("should return volumes for requested time windows", async () => {
      const result = await Effect.runPromise(
        service.getSnapshot({
          routes: [PRIMARY_ROUTE],
          notionals: ["1000"],
          includeWindows: ["24h", "7d"]
        })
      );

      expect(result.volumes).toHaveLength(2);
      expect(result.volumes.map(v => v.window)).toContain("24h");
      expect(result.volumes.map(v => v.window)).toContain("7d");

      const firstVolume = result.volumes[0];
      if (!firstVolume) {
        throw new Error("Expected volumes[0] to exist");
      }

      expect(firstVolume.volumeUsd).toBeTypeOf("number");
      expect(firstVolume.measuredAt).toBeTypeOf("string");
    }, API_TIMEOUT);

    it("should generate rates for all route/notional combinations", async () => {
      const result = await Effect.runPromise(
        service.getSnapshot({
          routes: [PRIMARY_ROUTE],
          notionals: ["1000", "10000"],
          includeWindows: ["24h"]
        })
      );

      expect(result.rates).toHaveLength(2);

      if (result.rates == null || result.rates.length === 0) {
        throw new Error("Expected result.rates to be a non-empty array");
      }

      const rate = result.rates[0];
      expect(rate).toBeDefined();
      if (!rate) throw new Error('Rate should be defined');
      expect(rate.source).toEqual(PRIMARY_ROUTE.source);
      expect(rate.destination).toEqual(PRIMARY_ROUTE.destination);
      expect(rate.amountIn).toBe("1000");
      expect(rate.amountOut).toBeTypeOf("string");
      expect(rate.effectiveRate).toBeTypeOf("number");
      expect(rate.effectiveRate).toBeGreaterThan(0);
      expect(rate.totalFeesUsd).toBeTypeOf("number");
      expect(rate.quotedAt).toBeTypeOf("string");
    }, API_TIMEOUT);

    it("should provide liquidity at 50bps and 100bps thresholds", async () => {
      const result = await Effect.runPromise(
        service.getSnapshot({
          routes: [PRIMARY_ROUTE],
          notionals: ["1000"],
          includeWindows: ["24h"]
        })
      );

      expect(result.liquidity).toHaveLength(1);

      const liquidityItem = result.liquidity?.[0];
      if (liquidityItem == null) {
        throw new Error("Expected result.liquidity to be a non-empty array");
      }
      expect(liquidityItem.route).toEqual(PRIMARY_ROUTE);

      const thresholds = liquidityItem.thresholds;
      expect(thresholds).toHaveLength(2);

      const bpsValues = thresholds.map(t => t.slippageBps);
      expect(bpsValues).toContain(50);
      expect(bpsValues).toContain(100);

      thresholds.forEach(threshold => {
        expect(threshold.maxAmountIn).toBeTypeOf("string");
        expect(threshold.slippageBps).toBeTypeOf("number");
      });
    }, API_TIMEOUT);

    it("should return list of supported assets", async () => {
      const result = await Effect.runPromise(
        service.getSnapshot({
          routes: [PRIMARY_ROUTE],
          notionals: ["1000"],
          includeWindows: ["24h"]
        })
      );

      expect(result.listedAssets.assets.length).toBeGreaterThan(0);

      result.listedAssets.assets.forEach(asset => {
        expect(asset.chainId).toBeTypeOf("string");
        expect(asset.assetId).toBeTypeOf("string");
        expect(asset.symbol).toBeTypeOf("string");
        expect(asset.decimals).toBeTypeOf("number");
      });

      expect(result.listedAssets.measuredAt).toBeTypeOf("string");
    }, API_TIMEOUT);

    it("should handle multiple routes correctly", async () => {
      const result = await Effect.runPromise(
        service.getSnapshot({
          routes: [PRIMARY_ROUTE, SECONDARY_ROUTE],
          notionals: ["1000"],
          includeWindows: ["24h"]
        })
      );

      expect(result.liquidity).toHaveLength(2);
      expect(result.rates).toHaveLength(2);
    }, API_TIMEOUT);
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
