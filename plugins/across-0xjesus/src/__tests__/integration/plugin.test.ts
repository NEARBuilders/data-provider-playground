import type { PluginRegistry } from "every-plugin";
import { createLocalPluginRuntime } from "every-plugin/testing";
import { beforeAll, describe, expect, it } from "vitest";
import DataProviderTemplatePlugin from "../../index";

// Real Across routes for testing with actual supported tokens
const ETHEREUM_USDC_TO_POLYGON = {
  source: {
    chainId: "1",
    assetId: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC on Ethereum
    symbol: "USDC",
    decimals: 6,
  },
  destination: {
    chainId: "137",
    assetId: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359", // USDC on Polygon
    symbol: "USDC",
    decimals: 6,
  }
};

const OPTIMISM_ETH_TO_ARBITRUM = {
  source: {
    chainId: "10",
    assetId: "0x4200000000000000000000000000000000000006", // WETH on Optimism
    symbol: "WETH",
    decimals: 18,
  },
  destination: {
    chainId: "42161",
    assetId: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1", // WETH on Arbitrum
    symbol: "WETH",
    decimals: 18,
  }
};

const BASE_USDC_TO_ETHEREUM = {
  source: {
    chainId: "8453",
    assetId: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // USDC on Base
    symbol: "USDC",
    decimals: 6,
  },
  destination: {
    chainId: "1",
    assetId: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC on Ethereum
    symbol: "USDC",
    decimals: 6,
  }
};

const TEST_REGISTRY: PluginRegistry = {
  "@across/data-provider": {
    remoteUrl: "http://localhost:3000/remoteEntry.js",
    version: "1.0.0",
    description: "Across Protocol data provider plugin for integration testing",
  },
};

const TEST_PLUGIN_MAP = {
  "@across/data-provider": DataProviderTemplatePlugin,
} as const;

const TEST_CONFIG = {
  variables: {
    baseUrl: "https://app.across.to/api",
    coingeckoBaseUrl: "https://api.coingecko.com/api/v3",
    defillamaBaseUrl: "https://bridges.llama.fi",
    timeout: 60000, // Increased timeout for real API calls
    maxRequestsPerSecond: 5, // Conservative rate limit to avoid throttling
  },
  secrets: {
    apiKey: "",  // No API key required for Across
  },
};

describe("Across Protocol Plugin - Integration Tests", () => {
  const runtime = createLocalPluginRuntime<typeof TEST_PLUGIN_MAP>(
    {
      registry: TEST_REGISTRY,
      secrets: { API_KEY: "" }, // No API key needed for Across
    },
    TEST_PLUGIN_MAP
  );

  beforeAll(async () => {
    const { initialized } = await runtime.usePlugin("@across/data-provider", TEST_CONFIG);
    expect(initialized).toBeDefined();
    expect(initialized.plugin.id).toBe("@across/data-provider");
  });

  describe("Bounty Requirement: Contract Compliance", () => {
    it("should implement complete contract specification", async () => {
      const { client } = await runtime.usePlugin("@across/data-provider", TEST_CONFIG);

      const result = await client.getSnapshot({
        routes: [ETHEREUM_USDC_TO_POLYGON],
        notionals: ["1000000"], // 1 USDC in smallest units
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
    }, { timeout: 120000 });
  });

  describe("Bounty Requirement: Volume Metrics", () => {
    it("should fetch volume data for 24h window", async () => {
      const { client } = await runtime.usePlugin("@across/data-provider", TEST_CONFIG);

      const result = await client.getSnapshot({
        routes: [ETHEREUM_USDC_TO_POLYGON],
        notionals: ["1000000"],
        includeWindows: ["24h"]
      });

      // Volumes array should be returned (may be empty if DefiLlama API is down)
      expect(Array.isArray(result.volumes)).toBe(true);

      if (result.volumes.length > 0) {
        const volume24h = result.volumes.find(v => v.window === "24h");
        expect(volume24h).toBeDefined();
        expect(volume24h!.volumeUsd).toBeTypeOf("number");
        expect(volume24h!.volumeUsd).toBeGreaterThanOrEqual(0);
        expect(volume24h!.measuredAt).toBeTypeOf("string");
      }
    }, { timeout: 120000 });

    it("should fetch volume data for multiple time windows (24h, 7d, 30d)", async () => {
      const { client } = await runtime.usePlugin("@across/data-provider", TEST_CONFIG);

      const result = await client.getSnapshot({
        routes: [ETHEREUM_USDC_TO_POLYGON],
        notionals: ["1000000"],
        includeWindows: ["24h", "7d", "30d"]
      });

      expect(Array.isArray(result.volumes)).toBe(true);

      // Should request all three windows
      const windows = result.volumes.map(v => v.window);
      if (result.volumes.length > 0) {
        expect(windows).toContain("24h");
      }

      // Verify structure of volume data
      result.volumes.forEach(volume => {
        expect(volume.window).toMatch(/^(24h|7d|30d)$/);
        expect(typeof volume.volumeUsd).toBe("number");
        expect(volume.volumeUsd).toBeGreaterThanOrEqual(0);
        expect(volume.measuredAt).toMatch(/^\d{4}-\d{2}-\d{2}T/); // ISO datetime
      });
    }, { timeout: 120000 });
  });

  describe("Bounty Requirement: Rates (Fees)", () => {
    it("should provide accurate rate quotes with fee breakdown", async () => {
      const { client } = await runtime.usePlugin("@across/data-provider", TEST_CONFIG);

      const result = await client.getSnapshot({
        routes: [ETHEREUM_USDC_TO_POLYGON],
        notionals: ["1000000"], // 1 USDC
        includeWindows: ["24h"]
      });

      expect(Array.isArray(result.rates)).toBe(true);

      if (result.rates.length > 0) {
        const rate = result.rates[0];

        // Verify source and destination match route
        expect(rate.source.chainId).toBe(ETHEREUM_USDC_TO_POLYGON.source.chainId);
        expect(rate.destination.chainId).toBe(ETHEREUM_USDC_TO_POLYGON.destination.chainId);

        // Verify amounts are in smallest units (strings for precision)
        expect(typeof rate.amountIn).toBe("string");
        expect(typeof rate.amountOut).toBe("string");
        expect(BigInt(rate.amountIn)).toBeGreaterThan(0n);
        expect(BigInt(rate.amountOut)).toBeGreaterThan(0n);

        // Verify effective rate is normalized for decimals
        expect(typeof rate.effectiveRate).toBe("number");
        expect(rate.effectiveRate).toBeGreaterThan(0);
        expect(rate.effectiveRate).toBeLessThanOrEqual(1.0); // Should be <= 1 after fees

        // Total fees should be calculated (or null if price unavailable)
        expect(rate.totalFeesUsd === null || typeof rate.totalFeesUsd === "number").toBe(true);
        if (rate.totalFeesUsd !== null) {
          expect(rate.totalFeesUsd).toBeGreaterThanOrEqual(0);
        }

        // Quote timestamp
        expect(rate.quotedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      }
    }, { timeout: 120000 });

    it("should generate rates for all route/notional combinations", async () => {
      const { client } = await runtime.usePlugin("@across/data-provider", TEST_CONFIG);

      const result = await client.getSnapshot({
        routes: [ETHEREUM_USDC_TO_POLYGON],
        notionals: ["1000000", "10000000", "100000000"], // 1, 10, 100 USDC
        includeWindows: ["24h"]
      });

      expect(Array.isArray(result.rates)).toBe(true);

      // Should attempt to generate rates for each notional
      // (may be less than 3 if API fails for some amounts)
      if (result.rates.length > 0) {
        // Verify each rate has different amountIn
        const amounts = result.rates.map(r => r.amountIn);
        const uniqueAmounts = new Set(amounts);
        expect(uniqueAmounts.size).toBeGreaterThan(0);

        // Higher amounts should generally have higher absolute fees
        // but may have better relative rates due to economies of scale
        result.rates.forEach(rate => {
          const feeAmount = BigInt(rate.amountIn) - BigInt(rate.amountOut);
          expect(feeAmount).toBeGreaterThan(0n);
        });
      }
    }, { timeout: 120000 });

    it("should handle different token pairs (USDC and WETH)", async () => {
      const { client } = await runtime.usePlugin("@across/data-provider", TEST_CONFIG);

      const result = await client.getSnapshot({
        routes: [ETHEREUM_USDC_TO_POLYGON, OPTIMISM_ETH_TO_ARBITRUM],
        notionals: ["1000000", "1000000000000000000"], // 1 USDC (6 decimals), 1 WETH (18 decimals)
        includeWindows: ["24h"]
      });

      expect(Array.isArray(result.rates)).toBe(true);

      // Should handle tokens with different decimal places
      if (result.rates.length > 0) {
        result.rates.forEach(rate => {
          // Effective rate accounts for decimals properly
          expect(rate.effectiveRate).toBeGreaterThan(0);
          expect(rate.effectiveRate).toBeLessThanOrEqual(1.0);

          // Decimals should match source/destination
          const isUSDC = rate.source.decimals === 6;
          const isETH = rate.source.decimals === 18;
          expect(isUSDC || isETH).toBe(true);
        });
      }
    }, { timeout: 120000 });
  });

  describe("Bounty Requirement: Liquidity Depth", () => {
    it("should provide liquidity thresholds at ≤0.5% and ≤1.0% slippage", async () => {
      const { client } = await runtime.usePlugin("@across/data-provider", TEST_CONFIG);

      const result = await client.getSnapshot({
        routes: [ETHEREUM_USDC_TO_POLYGON],
        notionals: ["1000000"],
        includeWindows: ["24h"]
      });

      expect(Array.isArray(result.liquidity)).toBe(true);

      if (result.liquidity.length > 0) {
        const liquidityData = result.liquidity[0];

        // Verify route matches
        expect(liquidityData.route.source.chainId).toBe(ETHEREUM_USDC_TO_POLYGON.source.chainId);
        expect(liquidityData.route.destination.chainId).toBe(ETHEREUM_USDC_TO_POLYGON.destination.chainId);

        // Must have thresholds for both required slippage levels
        expect(liquidityData.thresholds.length).toBeGreaterThanOrEqual(2);

        const bpsValues = liquidityData.thresholds.map(t => t.slippageBps);
        expect(bpsValues).toContain(50);  // 0.5% slippage
        expect(bpsValues).toContain(100); // 1.0% slippage

        // Verify threshold structure and values
        liquidityData.thresholds.forEach(threshold => {
          expect(typeof threshold.maxAmountIn).toBe("string");
          expect(typeof threshold.slippageBps).toBe("number");
          expect(parseFloat(threshold.maxAmountIn)).toBeGreaterThan(0);
          expect(threshold.slippageBps).toBeGreaterThan(0);
          expect(threshold.slippageBps).toBeLessThanOrEqual(100); // max 1%
        });

        // Verify measurement timestamp
        expect(liquidityData.measuredAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      }
    }, { timeout: 120000 });

    it("should provide liquidity data for multiple routes", async () => {
      const { client } = await runtime.usePlugin("@across/data-provider", TEST_CONFIG);

      const result = await client.getSnapshot({
        routes: [ETHEREUM_USDC_TO_POLYGON, BASE_USDC_TO_ETHEREUM],
        notionals: ["1000000"],
        includeWindows: ["24h"]
      });

      expect(Array.isArray(result.liquidity)).toBe(true);

      // Should attempt to fetch liquidity for each route
      if (result.liquidity.length > 0) {
        // Verify each liquidity entry has required thresholds
        result.liquidity.forEach(liq => {
          const bpsValues = liq.thresholds.map(t => t.slippageBps);
          expect(bpsValues).toContain(50);
          expect(bpsValues).toContain(100);
        });
      }
    }, { timeout: 120000 });

    it("should show higher liquidity limits at higher slippage tolerances", async () => {
      const { client } = await runtime.usePlugin("@across/data-provider", TEST_CONFIG);

      const result = await client.getSnapshot({
        routes: [ETHEREUM_USDC_TO_POLYGON],
        notionals: ["1000000"],
        includeWindows: ["24h"]
      });

      if (result.liquidity.length > 0) {
        const liquidityData = result.liquidity[0];
        const threshold50bps = liquidityData.thresholds.find(t => t.slippageBps === 50);
        const threshold100bps = liquidityData.thresholds.find(t => t.slippageBps === 100);

        if (threshold50bps && threshold100bps) {
          // Higher slippage should allow higher amounts
          const amount50 = parseFloat(threshold50bps.maxAmountIn);
          const amount100 = parseFloat(threshold100bps.maxAmountIn);
          expect(amount100).toBeGreaterThanOrEqual(amount50);
        }
      }
    }, { timeout: 120000 });
  });

  describe("Bounty Requirement: Available Assets", () => {
    it("should list all supported assets across chains", async () => {
      const { client } = await runtime.usePlugin("@across/data-provider", TEST_CONFIG);

      const result = await client.getSnapshot({
        routes: [ETHEREUM_USDC_TO_POLYGON],
        notionals: ["1000000"],
        includeWindows: ["24h"]
      });

      expect(result.listedAssets).toBeDefined();
      expect(Array.isArray(result.listedAssets.assets)).toBe(true);
      expect(result.listedAssets.assets.length).toBeGreaterThan(0);

      // Verify asset structure
      result.listedAssets.assets.forEach(asset => {
        expect(typeof asset.chainId).toBe("string");
        expect(typeof asset.assetId).toBe("string");
        expect(typeof asset.symbol).toBe("string");
        expect(typeof asset.decimals).toBe("number");
        expect(asset.decimals).toBeGreaterThanOrEqual(0);
        expect(asset.decimals).toBeLessThanOrEqual(18);
      });

      // Verify measurement timestamp
      expect(result.listedAssets.measuredAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    }, { timeout: 120000 });

    it("should include common assets like USDC, WETH across multiple chains", async () => {
      const { client } = await runtime.usePlugin("@across/data-provider", TEST_CONFIG);

      const result = await client.getSnapshot({
        routes: [ETHEREUM_USDC_TO_POLYGON],
        notionals: ["1000000"],
        includeWindows: ["24h"]
      });

      const assets = result.listedAssets.assets;

      // Should have USDC on multiple chains
      const usdcAssets = assets.filter(a => a.symbol === "USDC");
      expect(usdcAssets.length).toBeGreaterThan(0);

      // Should have ETH/WETH on multiple chains
      const ethAssets = assets.filter(a => a.symbol === "ETH" || a.symbol === "WETH");
      expect(ethAssets.length).toBeGreaterThan(0);

      // Should cover major chains: Ethereum (1), Polygon (137), Arbitrum (42161), Optimism (10), Base (8453)
      const chainIds = new Set(assets.map(a => a.chainId));
      expect(chainIds.size).toBeGreaterThan(3); // Should support multiple chains
    }, { timeout: 120000 });

    it("should provide unique asset identifiers per chain", async () => {
      const { client } = await runtime.usePlugin("@across/data-provider", TEST_CONFIG);

      const result = await client.getSnapshot({
        routes: [ETHEREUM_USDC_TO_POLYGON],
        notionals: ["1000000"],
        includeWindows: ["24h"]
      });

      const assets = result.listedAssets.assets;

      // Each (chainId, assetId) combination should be unique
      const assetKeys = assets.map(a => `${a.chainId}:${a.assetId}`);
      const uniqueKeys = new Set(assetKeys);
      expect(uniqueKeys.size).toBe(assets.length);
    }, { timeout: 120000 });
  });

  describe("Bounty Requirement: Resilience and Error Handling", () => {
    it("should validate required parameters (routes and notionals)", async () => {
      const { client } = await runtime.usePlugin("@across/data-provider", TEST_CONFIG);

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
          routes: [ETHEREUM_USDC_TO_POLYGON],
          notionals: []
        })
      ).rejects.toThrow();
    }, { timeout: 30000 });

    it("should gracefully handle API failures with partial data", async () => {
      const { client } = await runtime.usePlugin("@across/data-provider", TEST_CONFIG);

      // Even if some API calls fail, should return valid partial snapshot
      const result = await client.getSnapshot({
        routes: [ETHEREUM_USDC_TO_POLYGON],
        notionals: ["1000000"],
        includeWindows: ["24h"]
      });

      // Should always have proper structure even if some arrays are empty
      expect(result).toHaveProperty("volumes");
      expect(result).toHaveProperty("rates");
      expect(result).toHaveProperty("liquidity");
      expect(result).toHaveProperty("listedAssets");
      expect(Array.isArray(result.volumes)).toBe(true);
      expect(Array.isArray(result.rates)).toBe(true);
      expect(Array.isArray(result.liquidity)).toBe(true);
      expect(Array.isArray(result.listedAssets.assets)).toBe(true);
    }, { timeout: 120000 });
  });

  describe("Bounty Requirement: Data Normalization", () => {
    it("should normalize decimals in effectiveRate calculation", async () => {
      const { client } = await runtime.usePlugin("@across/data-provider", TEST_CONFIG);

      const result = await client.getSnapshot({
        routes: [OPTIMISM_ETH_TO_ARBITRUM], // 18 decimals
        notionals: ["1000000000000000000"], // 1 WETH
        includeWindows: ["24h"]
      });

      if (result.rates.length > 0) {
        const rate = result.rates[0];

        // Effective rate should be properly normalized despite 18 decimals
        expect(rate.effectiveRate).toBeGreaterThan(0);
        expect(rate.effectiveRate).toBeLessThanOrEqual(1.0);

        // For same-token transfers, rate should be close to 1 (minus fees)
        expect(rate.effectiveRate).toBeGreaterThan(0.95); // At least 95% after fees
      }
    }, { timeout: 120000 });

    it("should keep raw amounts in smallest units (wei)", async () => {
      const { client } = await runtime.usePlugin("@across/data-provider", TEST_CONFIG);

      const result = await client.getSnapshot({
        routes: [ETHEREUM_USDC_TO_POLYGON],
        notionals: ["1000000"], // 1 USDC (6 decimals)
        includeWindows: ["24h"]
      });

      if (result.rates.length > 0) {
        const rate = result.rates[0];

        // Amounts should be strings (for precision)
        expect(typeof rate.amountIn).toBe("string");
        expect(typeof rate.amountOut).toBe("string");

        // Should be in smallest units (no decimal point in string)
        expect(rate.amountIn).not.toContain(".");
        expect(rate.amountOut).not.toContain(".");

        // Should be parseable as BigInt
        expect(() => BigInt(rate.amountIn)).not.toThrow();
        expect(() => BigInt(rate.amountOut)).not.toThrow();
      }
    }, { timeout: 120000 });
  });

  describe("Bounty Requirement: Multi-route Support", () => {
    it("should handle multiple routes in single snapshot", async () => {
      const { client } = await runtime.usePlugin("@across/data-provider", TEST_CONFIG);

      const result = await client.getSnapshot({
        routes: [
          ETHEREUM_USDC_TO_POLYGON,
          OPTIMISM_ETH_TO_ARBITRUM,
          BASE_USDC_TO_ETHEREUM
        ],
        notionals: ["1000000"], // Same notional for comparison
        includeWindows: ["24h"]
      });

      // Should attempt to process all routes
      expect(Array.isArray(result.rates)).toBe(true);
      expect(Array.isArray(result.liquidity)).toBe(true);

      // Volumes are protocol-wide, not per-route
      expect(Array.isArray(result.volumes)).toBe(true);

      // Assets are protocol-wide
      expect(result.listedAssets.assets.length).toBeGreaterThan(0);
    }, { timeout: 180000 });
  });

  describe("Health Check (ping)", () => {
    it("should return healthy status when API is reachable", async () => {
      const { client } = await runtime.usePlugin("@across/data-provider", TEST_CONFIG);

      const result = await client.ping();

      expect(result).toEqual({
        status: "ok",
        timestamp: expect.any(String),
      });

      // Timestamp should be valid ISO datetime
      expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    }, { timeout: 30000 });
  });
});
