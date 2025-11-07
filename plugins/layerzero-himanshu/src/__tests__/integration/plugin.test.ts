import type { PluginRegistry } from "every-plugin";
import { createLocalPluginRuntime } from "every-plugin/testing";
import { beforeAll, describe, expect, it } from "vitest";
import LayerZeroPlugin from "../../index";

// Test route: USDC Ethereum → Polygon
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

const TEST_REGISTRY: PluginRegistry = {
  "@every-plugin/layerzero": {
    remoteUrl: "http://localhost:3000/remoteEntry.js",
    version: "1.0.0",
    description: "LayerZero/Stargate data provider for integration testing",
  },
};

const TEST_PLUGIN_MAP = {
  "@every-plugin/layerzero": LayerZeroPlugin,
} as const;

const TEST_CONFIG = {
  variables: {
    LZ_SCAN_BASE_URL: "https://scan.layerzero-api.com/v1",
    STARGATE_BASE_URL: "https://stargate.finance/api/v1",
    HTTP_TIMEOUT_MS: 10000,
    MAX_RETRIES: 2,
    RATE_LIMIT_RPS_LZ: 10,
    RATE_LIMIT_RPS_STG: 10,
  },
  secrets: {},
};

describe("LayerZero Plugin Integration Tests", () => {
  const runtime = createLocalPluginRuntime<typeof TEST_PLUGIN_MAP>(
    {
      registry: TEST_REGISTRY,
      secrets: {},
    },
    TEST_PLUGIN_MAP
  );

  beforeAll(async () => {
    const { initialized } = await runtime.usePlugin("@every-plugin/layerzero", TEST_CONFIG);
    expect(initialized).toBeDefined();
    expect(initialized.plugin.id).toBe("@every-plugin/layerzero");
  });

  describe("getSnapshot procedure", () => {
    it("should fetch complete snapshot successfully", async () => {
      const { client } = await runtime.usePlugin("@every-plugin/layerzero", TEST_CONFIG);

      const result = await client.getSnapshot({
        routes: [mockRoute],
        notionals: ["1000", "10000"],
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
      expect(result.rates.length).toBeGreaterThan(0);
      expect(Array.isArray(result.liquidity)).toBe(true);
      expect(result.liquidity.length).toBeGreaterThan(0);
      expect(Array.isArray(result.listedAssets.assets)).toBe(true);
      expect(result.listedAssets.assets.length).toBeGreaterThan(0);
    });

    it("should return volumes for requested time windows", async () => {
      const { client } = await runtime.usePlugin("@every-plugin/layerzero", TEST_CONFIG);

      const result = await client.getSnapshot({
        routes: [mockRoute],
        notionals: ["1000"],
        includeWindows: ["24h", "7d"]
      });

      expect(result.volumes).toHaveLength(2);
      expect(result.volumes.map(v => v.window)).toContain("24h");
      expect(result.volumes.map(v => v.window)).toContain("7d");
      expect(result.volumes[0].volumeUsd).toBeTypeOf("number");
      expect(result.volumes[0].measuredAt).toBeTypeOf("string");
    });

    it("should generate rates for all route/notional combinations", async () => {
      const { client } = await runtime.usePlugin("@every-plugin/layerzero", TEST_CONFIG);

      const result = await client.getSnapshot({
        routes: [mockRoute],
        notionals: ["1000", "10000"],
        includeWindows: ["24h"]
      });

      // Should have 2 rates (1 route × 2 notionals)
      expect(result.rates).toHaveLength(2);

      // Verify rate structure matches contract
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

    it("should provide liquidity at required thresholds", async () => {
      const { client } = await runtime.usePlugin("@every-plugin/layerzero", TEST_CONFIG);

      const result = await client.getSnapshot({
        routes: [mockRoute],
        notionals: ["1000"],
        includeWindows: ["24h"]
      });

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
      const { client } = await runtime.usePlugin("@every-plugin/layerzero", TEST_CONFIG);

      const result = await client.getSnapshot({
        routes: [mockRoute],
        notionals: ["1000"],
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
    });

    it("should handle multiple routes correctly", async () => {
      const { client } = await runtime.usePlugin("@every-plugin/layerzero", TEST_CONFIG);

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

      const result = await client.getSnapshot({
        routes: [mockRoute, secondRoute],
        notionals: ["1000"],
        includeWindows: ["24h"]
      });

      // Should have liquidity data for both routes
      expect(result.liquidity).toHaveLength(2);
      expect(result.rates).toHaveLength(2); // 2 routes × 1 notional
    });

    it("should require routes and notionals", async () => {
      const { client } = await runtime.usePlugin("@every-plugin/layerzero", TEST_CONFIG);

      // Should throw validation error for empty routes
      await expect(
        client.getSnapshot({
          routes: [],
          notionals: ["1000"]
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
      const { client } = await runtime.usePlugin("@every-plugin/layerzero", TEST_CONFIG);

      const result = await client.ping();

      expect(result).toEqual({
        status: "ok",
        timestamp: expect.any(String),
      });
    });
  });
});
