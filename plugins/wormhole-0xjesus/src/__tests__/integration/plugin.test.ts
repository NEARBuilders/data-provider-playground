import type { PluginRegistry } from "every-plugin";
import { createLocalPluginRuntime } from "every-plugin/testing";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import DataProviderTemplatePlugin from "../../index";

// Mock fetch globally for integration tests
global.fetch = vi.fn();

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

const TEST_REGISTRY: PluginRegistry = {
  "@every-plugin/wormhole": {
    remoteUrl: "http://localhost:3000/remoteEntry.js",
    version: "1.0.0",
    description: "Wormhole data provider for integration testing",
  },
};

const TEST_PLUGIN_MAP = {
  "@every-plugin/wormhole": DataProviderTemplatePlugin,
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

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock different API responses based on URL
    (global.fetch as any).mockImplementation((url: string) => {
      // Mock scorecards API for volume data
      if (url.includes('/scorecards')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            "24h_volume": "5000000",
            "7d_volume": "35000000",
            "30d_volume": "150000000",
            "total_messages": "1000000",
            "total_value_locked": "2000000000"
          })
        });
      }

      // Mock Governor API for liquidity limits
      if (url.includes('/governor/notional/limit')) {
        return Promise.resolve({
          ok: true,
          json: async () => ([
            {
              chainId: 1,
              availableNotional: "15000000",
              notionalLimit: "20000000",
              maxTransactionSize: "5000000"
            },
            {
              chainId: 137,
              availableNotional: "1500000",
              notionalLimit: "2000000",
              maxTransactionSize: "500000"
            },
            {
              chainId: 42161,
              availableNotional: "1500000",
              notionalLimit: "2000000",
              maxTransactionSize: "500000"
            }
          ])
        });
      }

      // Mock token list API (legacy, might not be used anymore)
      return Promise.resolve({
        ok: true,
        json: async () => ([
          {
            symbol: "USDC",
            volume_24h: "1000000",
            platforms: {
              "ethereum": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
            }
          }
        ])
      });
    });
  });

  beforeAll(async () => {
    const { initialized } = await runtime.usePlugin("@every-plugin/wormhole", TEST_CONFIG);
    expect(initialized).toBeDefined();
    expect(initialized.plugin.id).toBe("@every-plugin/wormhole");
  });

  describe("getSnapshot procedure", () => {
    it("should fetch complete snapshot successfully", async () => {
      const { client } = await runtime.usePlugin("@every-plugin/wormhole", TEST_CONFIG);

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
      const { client } = await runtime.usePlugin("@every-plugin/wormhole", TEST_CONFIG);

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
      const { client } = await runtime.usePlugin("@every-plugin/wormhole", TEST_CONFIG);

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
      const { client } = await runtime.usePlugin("@every-plugin/wormhole", TEST_CONFIG);

      const result = await client.getSnapshot({
        routes: [mockRoute],
        notionals: ["1000"],
        includeWindows: ["24h"]
      });

      expect(result.liquidity).toHaveLength(1);
      expect(result.liquidity[0].route).toEqual(mockRoute);

      const thresholds = result.liquidity[0].thresholds;
      expect(thresholds).toHaveLength(3);

      // Should have all three thresholds based on Governor limits
      const bpsValues = thresholds.map(t => t.slippageBps);
      expect(bpsValues).toContain(10);
      expect(bpsValues).toContain(50);
      expect(bpsValues).toContain(100);

      // Verify threshold structure
      thresholds.forEach(threshold => {
        expect(threshold.maxAmountIn).toBeTypeOf("string");
        expect(threshold.slippageBps).toBeTypeOf("number");
      });
    });

    it("should return list of supported assets", async () => {
      const { client } = await runtime.usePlugin("@every-plugin/wormhole", TEST_CONFIG);

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
      const { client } = await runtime.usePlugin("@every-plugin/wormhole", TEST_CONFIG);

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
      const { client } = await runtime.usePlugin("@every-plugin/wormhole", TEST_CONFIG);

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
      const { client } = await runtime.usePlugin("@every-plugin/wormhole", TEST_CONFIG);

      const result = await client.ping();

      expect(result).toEqual({
        status: "ok",
        timestamp: expect.any(String),
      });
    });
  });
});
