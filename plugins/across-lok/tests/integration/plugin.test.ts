import Plugin from "@/index";
import pluginDevConfig, { sampleRoute } from "../../plugin.dev";
import type { PluginRegistry } from "every-plugin";
import { createLocalPluginRuntime } from "every-plugin/testing";
import { beforeAll, describe, expect, it } from "vitest";

const TEST_PLUGIN_ID = pluginDevConfig.pluginId;
const TEST_CONFIG = pluginDevConfig.config;

// Real Across routes for testing with actual supported tokens
const ETHEREUM_USDC_TO_POLYGON = {
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

const ARBITRUM_USDC_TO_ETHEREUM = {
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

const TEST_REGISTRY: PluginRegistry = {
  [TEST_PLUGIN_ID]: {
    remoteUrl: "http://localhost:3000/remoteEntry.js",
    version: "1.0.0",
    description: "Data provider template for integration testing",
  },
};

const TEST_PLUGIN_MAP = {
  [TEST_PLUGIN_ID]: Plugin,
} as const;

describe("Data Provider Plugin Integration Tests", () => {
  const runtime = createLocalPluginRuntime<typeof TEST_PLUGIN_MAP>(
    {
      registry: TEST_REGISTRY,
      secrets: { },
    },
    TEST_PLUGIN_MAP
  );

  beforeAll(async () => {
    const { initialized } = await runtime.usePlugin(TEST_PLUGIN_ID, TEST_CONFIG);
    expect(initialized).toBeDefined();
    expect(initialized.plugin.id).toBe(TEST_PLUGIN_ID);
  });

  describe("getSnapshot procedure", () => {
    it("should handle multiple routes correctly", async () => {
      const { client } = await runtime.usePlugin(TEST_PLUGIN_ID, TEST_CONFIG);

      const result = await client.getSnapshot({
        routes: [ETHEREUM_USDC_TO_POLYGON, ARBITRUM_USDC_TO_ETHEREUM],
        notionals: ["1000000", "10000000"], // 1 USDC and 10 USDC
        includeWindows: ["24h"]
      });

      if (!result.liquidity || !result.rates) {
        throw new Error("❌ Expected liquidity and rates to be present for multiple routes. Ensure getRates() and getLiquidityDepth() handle multiple routes correctly.");
      }

      expect(result.liquidity.length, "Should return liquidity for each route").toBe(2);
      expect(result.rates.length, "Should return rates for each route").toBe(4); // 2 routes × 2 notionals
    });

    it("should handle real Across routes with proper data", async () => {
      const { client } = await runtime.usePlugin(TEST_PLUGIN_ID, TEST_CONFIG);

      const result = await client.getSnapshot({
        routes: [ETHEREUM_USDC_TO_POLYGON],
        notionals: ["1000000"], // 1 USDC
        includeWindows: ["24h"]
      });

      // Verify contract compliance: all required fields present
      expect(result).toHaveProperty("volumes");
      expect(result).toHaveProperty("rates");
      expect(result).toHaveProperty("liquidity");
      expect(result).toHaveProperty("listedAssets");

      // Verify field names and shapes are unchanged (as per bounty requirements)
      expect(Array.isArray(result.volumes)).toBe(true);
      expect(Array.isArray(result.rates)).toBe(true);
      expect(Array.isArray(result.liquidity)).toBe(true);
      expect(result.listedAssets).toHaveProperty("assets");
      expect(result.listedAssets).toHaveProperty("measuredAt");
    });
  });

  describe("ping procedure", () => {
    it("[SANITY CHECK] should return healthy status", async () => {
      const { client } = await runtime.usePlugin(TEST_PLUGIN_ID, TEST_CONFIG);

      const result = await client.ping();

      expect(result.status).toBe("ok");
    });
  });
});
