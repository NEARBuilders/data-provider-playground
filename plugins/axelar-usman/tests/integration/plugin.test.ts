import { beforeAll, describe, expect, it } from "vitest";
import { createLocalPluginRuntime } from "every-plugin/testing";
import type { PluginRegistry } from "every-plugin";
import Plugin from "@/index";
import pluginDevConfig, { sampleRoute } from "../../plugin.dev";

const PLUGIN_ID = pluginDevConfig.pluginId;
const API_TIMEOUT = 60000;

const PRIMARY_ROUTE = sampleRoute;
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

const PLUGIN_CONFIG = {
  variables: {
    baseUrl: "https://api.axelarscan.io/api/v1",
    timeout: 30000,
  },
  secrets: {
    apiKey: "",
  },
};

const PLUGIN_REGISTRY: PluginRegistry = {
  [PLUGIN_ID]: {
    remoteUrl: "http://localhost:3000/remoteEntry.js",
    version: "1.0.0",
    description: "Data provider template for integration testing",
  },
};

const PLUGIN_MAP = {
  [PLUGIN_ID]: Plugin,
} as const;

describe("Data Provider Plugin Integration Tests", () => {
  const runtime = createLocalPluginRuntime<typeof PLUGIN_MAP>(
    {
      registry: PLUGIN_REGISTRY,
      secrets: { API_KEY: "test-api-key" },
    },
    PLUGIN_MAP
  );

  beforeAll(async () => {
    const { initialized } = await runtime.usePlugin(PLUGIN_ID, PLUGIN_CONFIG);
    expect(initialized).toBeDefined();
    expect(initialized.plugin.id).toBe(PLUGIN_ID);
  });

  describe("getSnapshot procedure", () => {
    it("should fetch complete snapshot successfully", async () => {
      const { client } = await runtime.usePlugin(PLUGIN_ID, PLUGIN_CONFIG);

      const result = await client.getSnapshot({
        routes: [PRIMARY_ROUTE],
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
      expect(result.rates!.length).toBeGreaterThan(0);
      expect(Array.isArray(result.liquidity)).toBe(true);
      expect(result.liquidity!.length).toBeGreaterThan(0);
      expect(Array.isArray(result.listedAssets.assets)).toBe(true);
      expect(result.listedAssets.assets.length).toBeGreaterThan(0);
    }, API_TIMEOUT);

    it("should return volumes for requested time windows", async () => {
      const { client } = await runtime.usePlugin(PLUGIN_ID, PLUGIN_CONFIG);

      const result = await client.getSnapshot({
        routes: [PRIMARY_ROUTE],
        notionals: ["1000"],
        includeWindows: ["24h", "7d"]
      });

      expect(result.volumes).toHaveLength(2);
      expect(result.volumes.map(v => v.window)).toContain("24h");
      expect(result.volumes.map(v => v.window)).toContain("7d");
      expect(result.volumes[0]?.volumeUsd).toBeTypeOf("number");
      expect(result.volumes[0]?.measuredAt).toBeTypeOf("string");
    }, API_TIMEOUT);

    it("should generate rates for all route/notional combinations", async () => {
      const { client } = await runtime.usePlugin(PLUGIN_ID, PLUGIN_CONFIG);

      const result = await client.getSnapshot({
        routes: [PRIMARY_ROUTE],
        notionals: ["1000", "10000"],
        includeWindows: ["24h"]
      });

      // Should have 2 rates (1 route × 2 notionals)
      expect(result.rates).toHaveLength(2);
      expect(result.rates).toBeDefined();

      // Verify rate structure matches contract
      const rate = result.rates![0];
      expect(rate.source).toEqual(PRIMARY_ROUTE.source);
      expect(rate.destination).toEqual(PRIMARY_ROUTE.destination);
      expect(rate.amountIn).toBe("1000");
      expect(rate.amountOut).toBeTypeOf("string");
      expect(rate.effectiveRate).toBeTypeOf("number");
      expect(rate.effectiveRate).toBeGreaterThan(0);
      expect(rate.totalFeesUsd).toBeTypeOf("number");
      expect(rate.quotedAt).toBeTypeOf("string");
    }, API_TIMEOUT);

    it("should provide liquidity at required thresholds", async () => {
      const { client } = await runtime.usePlugin(PLUGIN_ID, PLUGIN_CONFIG);

      const result = await client.getSnapshot({
        routes: [PRIMARY_ROUTE],
        notionals: ["1000"],
        includeWindows: ["24h"]
      });

      expect(result.liquidity).toHaveLength(1);
      expect(result.liquidity![0].route).toEqual(PRIMARY_ROUTE);

      const thresholds = result.liquidity![0].thresholds;
      expect(thresholds).toHaveLength(2);

      // Should have both required thresholds
      const bpsValues = thresholds?.map(t => t.slippageBps) ?? [];
      expect(bpsValues).toContain(50);
      expect(bpsValues).toContain(100);

      // Verify threshold structure
      thresholds?.forEach(threshold => {
        expect(threshold.maxAmountIn).toBeTypeOf("string");
        expect(threshold.slippageBps).toBeTypeOf("number");
      });
    }, API_TIMEOUT);

    it("should return list of supported assets", async () => {
      const { client } = await runtime.usePlugin(PLUGIN_ID, PLUGIN_CONFIG);

      const result = await client.getSnapshot({
        routes: [PRIMARY_ROUTE],
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
    }, API_TIMEOUT);

    it("should handle multiple routes correctly", async () => {
      const { client } = await runtime.usePlugin(PLUGIN_ID, PLUGIN_CONFIG);

      const result = await client.getSnapshot({
        routes: [PRIMARY_ROUTE, SECONDARY_ROUTE],
        notionals: ["1000"],
        includeWindows: ["24h"]
      });

      expect(result.liquidity).toHaveLength(2);
      expect(result.rates).toHaveLength(2);
    }, API_TIMEOUT);

    it("should require routes and notionals", async () => {
      const { client } = await runtime.usePlugin(PLUGIN_ID, PLUGIN_CONFIG);

      await expect(
        client.getSnapshot({
          routes: [],
          notionals: ["1000"]
        })
      ).rejects.toThrow();

      await expect(
        client.getSnapshot({
          routes: [PRIMARY_ROUTE],
          notionals: []
        })
      ).rejects.toThrow();
    }, API_TIMEOUT);

    it("should return positive volume values for all time windows", async () => {
      const { client } = await runtime.usePlugin(PLUGIN_ID, PLUGIN_CONFIG);

      const result = await client.getSnapshot({
        routes: [PRIMARY_ROUTE],
        notionals: ["1000"],
        includeWindows: ["24h", "7d", "30d"]
      });

      expect(result.volumes).toHaveLength(3);
      result.volumes.forEach(volume => {
        expect(volume.volumeUsd).toBeGreaterThanOrEqual(0);
        expect(typeof volume.volumeUsd).toBe("number");
      });
    }, API_TIMEOUT);

    it("should return different volumes for different time windows", async () => {
      const { client } = await runtime.usePlugin(PLUGIN_ID, PLUGIN_CONFIG);

      const result = await client.getSnapshot({
        routes: [PRIMARY_ROUTE],
        notionals: ["1000"],
        includeWindows: ["24h", "7d", "30d"]
      });

      const volumes = result.volumes.map(v => v.volumeUsd);
      expect(new Set(volumes).size).toBeGreaterThan(1);
    }, API_TIMEOUT);

    it("should calculate reasonable fee percentages", async () => {
      const { client } = await runtime.usePlugin(PLUGIN_ID, PLUGIN_CONFIG);

      const result = await client.getSnapshot({
        routes: [PRIMARY_ROUTE],
        notionals: ["1000000"],
        includeWindows: ["24h"]
      });

      const rate = result.rates![0];
      const amountIn = parseFloat(rate.amountIn);
      const feePercentage = (rate.totalFeesUsd / amountIn) * 100;
      
      expect(feePercentage).toBeGreaterThan(0);
      expect(feePercentage).toBeLessThan(5);
    }, API_TIMEOUT);

    it("should handle single notional value correctly", async () => {
      const { client } = await runtime.usePlugin(PLUGIN_ID, PLUGIN_CONFIG);

      const result = await client.getSnapshot({
        routes: [PRIMARY_ROUTE],
        notionals: ["5000000"],
        includeWindows: ["24h"]
      });

      expect(result.rates).toHaveLength(1);
      expect(result.rates![0].amountIn).toBe("5000000");
      expect(result.liquidity).toHaveLength(1);
    }, API_TIMEOUT);

    it("should include measuredAt timestamps for all data types", async () => {
      const { client } = await runtime.usePlugin(PLUGIN_ID, PLUGIN_CONFIG);

      const result = await client.getSnapshot({
        routes: [PRIMARY_ROUTE],
        notionals: ["1000"],
        includeWindows: ["24h"]
      });

      result.volumes.forEach(volume => {
        expect(volume.measuredAt).toBeTruthy();
        expect(new Date(volume.measuredAt).getTime()).toBeGreaterThan(0);
      });

      result.rates?.forEach(rate => {
        expect(rate.quotedAt).toBeTruthy();
        expect(new Date(rate.quotedAt).getTime()).toBeGreaterThan(0);
      });

      expect(result.listedAssets.measuredAt).toBeTruthy();
      expect(new Date(result.listedAssets.measuredAt).getTime()).toBeGreaterThan(0);
    }, API_TIMEOUT);
  });

  describe("ping procedure", () => {
    it("should return healthy status", async () => {
      const { client } = await runtime.usePlugin(PLUGIN_ID, PLUGIN_CONFIG);

      const result = await client.ping();

      expect(result).toEqual({
        status: "ok",
        timestamp: expect.any(String),
      });
    });
  });
});
