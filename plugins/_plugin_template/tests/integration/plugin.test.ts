import DataProviderTemplatePlugin from "@/index";
import type { PluginRegistry } from "every-plugin";
import { createLocalPluginRuntime } from "every-plugin/testing";
import { beforeAll, describe, expect, it } from "vitest";

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

const TEST_REGISTRY: PluginRegistry = {
  "@data-provider/template": {
    remoteUrl: "http://localhost:3000/remoteEntry.js",
    version: "1.0.0",
    description: "Data provider template for integration testing",
  },
};

const TEST_PLUGIN_MAP = {
  "@data-provider/template": DataProviderTemplatePlugin,
} as const;

const TEST_CONFIG = {
  variables: {
    baseUrl: "https://api.example.com",
    timeout: 5000,
  },
  secrets: {
    apiKey: "test-api-key",
  },
};

describe("Data Provider Plugin Integration Tests", () => {
  const runtime = createLocalPluginRuntime<typeof TEST_PLUGIN_MAP>(
    {
      registry: TEST_REGISTRY,
      secrets: { API_KEY: "test-api-key" },
    },
    TEST_PLUGIN_MAP
  );

  beforeAll(async () => {
    const { initialized } = await runtime.usePlugin("@data-provider/template", TEST_CONFIG);
    expect(initialized).toBeDefined();
    expect(initialized.plugin.id).toBe("@data-provider/template");
  });

  describe("getSnapshot procedure", () => {
    it("should return complete snapshot with valid structure", async () => {
      const { client } = await runtime.usePlugin("@data-provider/template", TEST_CONFIG);

      const result = await client.getSnapshot({
        routes: [mockRoute],
        notionals: ["1000", "10000"],
        includeWindows: ["24h", "7d", "30d"]
      });

      expect(result).toHaveProperty("volumes");
      expect(result).toHaveProperty("rates");
      expect(result).toHaveProperty("liquidity");
      expect(result).toHaveProperty("listedAssets");
      expect(Array.isArray(result.volumes)).toBe(true);
      expect(Array.isArray(result.rates)).toBe(true);
      expect(Array.isArray(result.liquidity)).toBe(true);
      expect(Array.isArray(result.listedAssets.assets)).toBe(true);
    });

    it("should handle multiple routes correctly", async () => {
      const { client } = await runtime.usePlugin("@data-provider/template", TEST_CONFIG);

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

      expect(result.liquidity).toHaveLength(2);
      expect(result.rates).toHaveLength(2);
    });
  });

  describe("ping procedure", () => {
    it("should return healthy status with recent timestamp", async () => {
      const { client } = await runtime.usePlugin("@data-provider/template", TEST_CONFIG);

      const result = await client.ping();

      expect(result.status).toBe("ok");
      
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      expect(new Date(result.timestamp).getTime()).toBeGreaterThan(fiveMinutesAgo);
    });
  });
});
