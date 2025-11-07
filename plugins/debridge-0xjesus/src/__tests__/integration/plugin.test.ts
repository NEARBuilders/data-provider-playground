import type { PluginRegistry } from "every-plugin";
import { createLocalPluginRuntime } from "every-plugin/testing";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import DataProviderTemplatePlugin from "../../index";

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

// Mock fetch responses
const mockChains = [
  { chainId: 1, name: "Ethereum", nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 } },
  { chainId: 137, name: "Polygon", nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 } },
  { chainId: 42161, name: "Arbitrum", nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 } }
];

const mockTokens: Record<string, any[]> = {
  "1": [{
    address: "0xA0b86a33E6442e082877a094f204b01BF645Fe0",
    name: "USD Coin",
    symbol: "USDC",
    decimals: 6,
    chainId: 1,
    logoURI: "https://example.com/usdc.png"
  }],
  "137": [{
    address: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa8417",
    name: "USD Coin",
    symbol: "USDC",
    decimals: 6,
    chainId: 137,
    logoURI: "https://example.com/usdc.png"
  }],
  "42161": [{
    address: "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8",
    name: "USD Coin",
    symbol: "USDC",
    decimals: 6,
    chainId: 42161,
    logoURI: "https://example.com/usdc.png"
  }]
};

const createMockQuote = (amount: string) => {
  const amountBigInt = BigInt(amount);
  const amountOut = (amountBigInt * BigInt(995)) / BigInt(1000);

  return {
    estimation: {
      srcChainTokenIn: {
        address: "0xA0b86a33E6442e082877a094f204b01BF645Fe0",
        symbol: "USDC",
        decimals: 6,
        amount: amount,
        usd: (Number(amount) / 1e6).toFixed(2)
      },
      dstChainTokenOut: {
        address: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa8417",
        symbol: "USDC",
        decimals: 6,
        amount: amountOut.toString(),
        usd: (Number(amountOut) / 1e6).toFixed(2)
      },
      bridgeFee: {
        amount: "0.5",
        token: { symbol: "USD" }
      }
    },
    minAmountIn: "1000",
    maxAmountIn: "10000000000000",
    recommendedAmount: "1000000"
  };
};

const mockDefiLlamaBridge = {
  id: "debridge",
  displayName: "deBridge",
  lastDailyVolume: 50000000,
  lastWeeklyVolume: 300000000,
  lastMonthlyVolume: 1200000000
};

const TEST_REGISTRY: PluginRegistry = {
  "@every-plugin/template": {
    remoteUrl: "http://localhost:3000/remoteEntry.js",
    version: "1.0.0",
    description: "Data provider template for integration testing",
  },
};

const TEST_PLUGIN_MAP = {
  "@every-plugin/template": DataProviderTemplatePlugin,
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

// Setup global fetch mock before all tests
beforeAll(() => {
  // Mock global fetch
  global.fetch = vi.fn((url: string) => {
    const urlStr = url.toString();

    // Mock supported chains
    if (urlStr.includes("/supported-chains")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockChains)
      } as Response);
    }

    // Mock tokens
    if (urlStr.includes("/tokens")) {
      const chainId = new URL(urlStr).searchParams.get("chainId");
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockTokens[chainId || "1"] || [])
      } as Response);
    }

    // Mock quote
    if (urlStr.includes("/quote")) {
      const amount = new URL(urlStr).searchParams.get("amount") || "1000";
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(createMockQuote(amount))
      } as Response);
    }

    // Mock DefiLlama
    if (urlStr.includes("bridges.llama.fi")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockDefiLlamaBridge)
      } as Response);
    }

    return Promise.reject(new Error(`Unmocked URL: ${urlStr}`));
  });
});

describe("Data Provider Plugin Integration Tests", () => {
  const runtime = createLocalPluginRuntime<typeof TEST_PLUGIN_MAP>(
    {
      registry: TEST_REGISTRY,
      secrets: { API_KEY: "test-api-key" },
    },
    TEST_PLUGIN_MAP
  );

  beforeAll(async () => {
    const { initialized } = await runtime.usePlugin("@every-plugin/template", TEST_CONFIG);
    expect(initialized).toBeDefined();
    expect(initialized.plugin.id).toBe("@every-plugin/template");
  });

  describe("getSnapshot procedure", () => {
    it("should fetch complete snapshot successfully", async () => {
      const { client } = await runtime.usePlugin("@every-plugin/template", TEST_CONFIG);

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
      const { client } = await runtime.usePlugin("@every-plugin/template", TEST_CONFIG);

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
      const { client } = await runtime.usePlugin("@every-plugin/template", TEST_CONFIG);

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
      const { client } = await runtime.usePlugin("@every-plugin/template", TEST_CONFIG);

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
      const { client } = await runtime.usePlugin("@every-plugin/template", TEST_CONFIG);

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
      const { client } = await runtime.usePlugin("@every-plugin/template", TEST_CONFIG);

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
      const { client } = await runtime.usePlugin("@every-plugin/template", TEST_CONFIG);

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
      const { client } = await runtime.usePlugin("@every-plugin/template", TEST_CONFIG);

      const result = await client.ping();

      expect(result).toEqual({
        status: "ok",
        timestamp: expect.any(String),
      });
    });
  });
});
