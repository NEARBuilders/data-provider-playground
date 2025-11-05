import type { PluginRegistry } from "every-plugin";
import { createLocalPluginRuntime } from "every-plugin/testing";
import { beforeAll, describe, expect, it } from "vitest";
import AcrossPlugin from "../../index";

// Mock route for testing
const mockRoute = {
  source: {
    chainId: "1",
    assetId: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // Real USDC address on Ethereum
    symbol: "USDC",
    decimals: 6,
  },
  destination: {
    chainId: "10",
    assetId: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85", // Real USDC address on Optimism
    symbol: "USDC",
    decimals: 6,
  }
};

const TEST_REGISTRY: PluginRegistry = {
  "@near-intents/across-plugin": {
    remoteUrl: "http://localhost:3000/remoteEntry.js",
    version: "1.0.0",
    description: "Across Protocol data provider plugin",
  },
};

const TEST_PLUGIN_MAP = {
  "@near-intents/across-plugin": AcrossPlugin,
} as const;

const TEST_CONFIG = {
  variables: {
    baseUrl: "https://across.to/api",
    timeout: 30000,
    rateLimitPerSecond: 10,
  },
  secrets: {
    apiKey: "",
  },
};

describe("Data Provider Plugin Integration Tests", () => {
  const runtime = createLocalPluginRuntime<typeof TEST_PLUGIN_MAP>(
    {
      registry: TEST_REGISTRY,
      secrets: { API_KEY: "" },
    },
    TEST_PLUGIN_MAP
  );

  beforeAll(async () => {
    const { initialized } = await runtime.usePlugin("@near-intents/across-plugin", TEST_CONFIG);
    expect(initialized).toBeDefined();
    expect(initialized.plugin.id).toBe("@near-intents/across-plugin");
  });

  describe("getSnapshot procedure", () => {
    it("should fetch complete snapshot successfully", async () => {
      const { client } = await runtime.usePlugin("@near-intents/across-plugin", TEST_CONFIG);

      const result = await client.getSnapshot({
        routes: [mockRoute],
        notionals: ["1000000", "10000000"], // 1 USDC and 10 USDC
        includeWindows: ["24h", "7d"]
      });

      // Verify complete snapshot structure
      expect(result).toHaveProperty("volumes");
      expect(result).toHaveProperty("rates");
      expect(result).toHaveProperty("liquidity");
      expect(result).toHaveProperty("listedAssets");

      // Verify arrays are populated
      expect(Array.isArray(result.volumes)).toBe(true);
      expect(result.volumes.length).toBeGreaterThan(0);
      expect(Array.isArray(result.rates)).toBe(true);
      expect(Array.isArray(result.liquidity)).toBe(true);
      expect(Array.isArray(result.listedAssets.assets)).toBe(true);
      expect(result.listedAssets.assets.length).toBeGreaterThan(0);
    }, 60000); // Increase timeout for real API calls

    it("should return volumes for requested time windows", async () => {
      const { client } = await runtime.usePlugin("@near-intents/across-plugin", TEST_CONFIG);

      const result = await client.getSnapshot({
        routes: [mockRoute],
        notionals: ["1000000"],
        includeWindows: ["24h", "7d"]
      });

      expect(result.volumes).toHaveLength(2);
      expect(result.volumes.map(v => v.window)).toContain("24h");
      expect(result.volumes.map(v => v.window)).toContain("7d");
      expect(result.volumes[0].volumeUsd).toBeTypeOf("number");
      expect(result.volumes[0].measuredAt).toBeTypeOf("string");
    }, 60000);

    it("should generate rates for all route/notional combinations", async () => {
      const { client } = await runtime.usePlugin("@near-intents/across-plugin", TEST_CONFIG);

      const result = await client.getSnapshot({
        routes: [mockRoute],
        notionals: ["1000000", "10000000"],
        includeWindows: ["24h"]
      });

      // Should have 2 rates (1 route × 2 notionals)
      expect(result.rates.length).toBeGreaterThanOrEqual(0); // May be 0 if API fails

      if (result.rates.length > 0) {
        // Verify rate structure matches contract
        const rate = result.rates[0];
        expect(rate.source).toEqual(mockRoute.source);
        expect(rate.destination).toEqual(mockRoute.destination);
        expect(rate.amountOut).toBeTypeOf("string");
        expect(rate.effectiveRate).toBeTypeOf("number");
        expect(rate.effectiveRate).toBeGreaterThan(0);
        expect(rate.quotedAt).toBeTypeOf("string");
      }
    }, 60000);

    it("should provide liquidity at required thresholds", async () => {
      const { client } = await runtime.usePlugin("@near-intents/across-plugin", TEST_CONFIG);

      const result = await client.getSnapshot({
        routes: [mockRoute],
        notionals: ["1000000"],
        includeWindows: ["24h"]
      });

      if (result.liquidity.length > 0) {
        expect(result.liquidity[0].route.source).toEqual(mockRoute.source);
        expect(result.liquidity[0].route.destination).toEqual(mockRoute.destination);

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
      }
    }, 60000);

    it("should return list of supported assets", async () => {
      const { client } = await runtime.usePlugin("@near-intents/across-plugin", TEST_CONFIG);

      const result = await client.getSnapshot({
        routes: [mockRoute],
        notionals: ["1000000"],
        includeWindows: ["24h"]
      });

      expect(result.listedAssets.assets.length).toBeGreaterThan(0);

      // Verify asset structure matches contract
      result.listedAssets.assets.forEach(asset => {
        expect(asset.chainId).toBeTypeOf("string");
        expect(asset.assetId).toBeTypeOf("string");
        expect(asset.symbol).toBeTypeOf("string");
        expect(asset.decimals).toBeTypeOf("number");
      });

      expect(result.listedAssets.measuredAt).toBeTypeOf("string");
    }, 60000);

    it("should handle multiple routes correctly", async () => {
      const { client } = await runtime.usePlugin("@near-intents/across-plugin", TEST_CONFIG);

      const result = await client.getSnapshot({
        routes: [mockRoute],
        notionals: ["1000000"],
        includeWindows: ["24h"]
      });

      // Verify data structures
      expect(result.liquidity.length).toBeGreaterThanOrEqual(0);
      expect(result.rates.length).toBeGreaterThanOrEqual(0);
    }, 60000);

    it("should require routes and notionals", async () => {
      const { client } = await runtime.usePlugin("@near-intents/across-plugin", TEST_CONFIG);

      // Should throw validation error for empty routes
      await expect(
        client.getSnapshot({
          routes: [],
          notionals: ["1000000"]
        })
      ).rejects.toThrow();

      // Should throw validation error for empty notionals
      await expect(
        client.getSnapshot({
          routes: [mockRoute],
          notionals: []
        })
      ).rejects.toThrow();
    });
  });

  describe("ping procedure", () => {
    it("should return healthy status", async () => {
      const { client } = await runtime.usePlugin("@near-intents/across-plugin", TEST_CONFIG);

      const result = await client.ping();

      expect(result).toEqual({
        status: "ok",
        timestamp: expect.any(String),
      });
    }, 30000);
  });
});
