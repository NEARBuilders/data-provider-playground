import { Effect } from "every-plugin/effect";
import { describe, expect, it, beforeEach, vi } from "vitest";
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

// Mock API responses
const mockFeeResponse = {
  data: [
    { finalityThreshold: 1000, minimumFee: 1 },
    { finalityThreshold: 2000, minimumFee: 1 }
  ]
};

const mockAllowanceResponse = {
  allowance: 124000.0,
  lastUpdated: "2025-01-23T10:00:00Z"
};

const mockDefiLlamaResponse = {
  id: "cctp",
  displayName: "Circle CCTP",
  lastDailyVolume: 50000000,
  lastWeeklyVolume: 350000000,
  lastMonthlyVolume: 1500000000,
  currentDayVolume: 55000000,
  dayBeforeLastVolume: 48000000,
  weeklyVolume: 350000000,
  monthlyVolume: 1500000000
};

describe("DataProviderService", () => {
  const service = new DataProviderService(
    "https://api.example.com",
    "test-api-key",
    5000
  );

  beforeEach(() => {
    // Reset fetch mocks before each test
    vi.restoreAllMocks();

    // Mock fetch globally
    global.fetch = vi.fn((url: string | URL | Request) => {
      const urlStr = url.toString();

      // Mock CCTP fees endpoint
      if (urlStr.includes('/v2/burn/USDC/fees/')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => mockFeeResponse,
        } as Response);
      }

      // Mock CCTP allowance endpoint
      if (urlStr.includes('/v2/fastBurn/USDC/allowance')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => mockAllowanceResponse,
        } as Response);
      }

      // Mock DefiLlama endpoint
      if (urlStr.includes('bridges.llama.fi/bridge/cctp')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => mockDefiLlamaResponse,
        } as Response);
      }

      // Default error response
      return Promise.reject(new Error(`Unmocked URL: ${urlStr}`));
    }) as any;
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

      // Should have 2 rates (1 route × 2 notionals)
      expect(result.rates).toHaveLength(2);

      // Verify rate structure
      const rate = result.rates[0];
      expect(rate.source).toEqual(mockRoute.source);
      expect(rate.destination).toEqual(mockRoute.destination);
      expect(rate.amountIn).toBe("1000");
      expect(rate.amountOut).toBeTypeOf("string");
      expect(rate.effectiveRate).toBeTypeOf("number");
      expect(rate.effectiveRate).toBeGreaterThan(0);
      expect(rate.totalFeesUsd).toBeTypeOf("number");
      expect(rate.quotedAt).toBeTypeOf("string");
    });

    it("should provide liquidity at 50bps and 100bps thresholds", async () => {
      const result = await Effect.runPromise(
        service.getSnapshot({
          routes: [mockRoute],
          notionals: ["1000"],
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
        expect(threshold.slippageBps).toBeTypeOf("number");
      });
    });

    it("should return list of supported assets", async () => {
      const result = await Effect.runPromise(
        service.getSnapshot({
          routes: [mockRoute],
          notionals: ["1000"],
          includeWindows: ["24h"]
        })
      );

      // CCTP supports 7 USDC assets (6 EVM chains + Solana)
      expect(result.listedAssets.assets).toHaveLength(7);

      // Verify asset structure
      result.listedAssets.assets.forEach(asset => {
        expect(asset.chainId).toBeTypeOf("string");
        expect(asset.assetId).toBeTypeOf("string");
        expect(asset.symbol).toBeTypeOf("string");
        expect(asset.symbol).toBe("USDC"); // CCTP only supports USDC
        expect(asset.decimals).toBeTypeOf("number");
        expect(asset.decimals).toBe(6); // USDC always has 6 decimals
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

      // Should have liquidity data for both routes
      expect(result.liquidity).toHaveLength(2);
      expect(result.rates).toHaveLength(2); // 2 routes × 1 notional
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
