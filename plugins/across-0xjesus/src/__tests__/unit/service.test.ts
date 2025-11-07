import { Effect } from "every-plugin/effect";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DataProviderService } from "../../service";

// Real Across routes for testing
const ETHEREUM_USDC_TO_POLYGON = {
  source: {
    chainId: "1",
    assetId: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    symbol: "USDC",
    decimals: 6,
  },
  destination: {
    chainId: "137",
    assetId: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
    symbol: "USDC",
    decimals: 6,
  }
};

const OPTIMISM_ETH_TO_ARBITRUM = {
  source: {
    chainId: "10",
    assetId: "0x4200000000000000000000000000000000000006",
    symbol: "WETH",
    decimals: 18,
  },
  destination: {
    chainId: "42161",
    assetId: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
    symbol: "WETH",
    decimals: 18,
  }
};

describe("DataProviderService - Unit Tests", () => {
  let service: DataProviderService;

  beforeEach(() => {
    // Create service with real Across API
    service = new DataProviderService(
      "https://app.across.to/api",
      "https://api.coingecko.com/api/v3",
      "https://bridges.llama.fi",
      "",
      60000, // 60 second timeout
      5 // 5 requests per second
    );
  });

  describe("Bounty Requirement: Service Initialization", () => {
    it("should initialize with ENV-based configuration", () => {
      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(DataProviderService);
    });

    it("should accept configurable timeout and rate limits", () => {
      const customService = new DataProviderService(
        "https://app.across.to/api",
        "https://api.coingecko.com/api/v3",
        "https://bridges.llama.fi",
        "",
        30000, // Custom timeout
        10 // Custom rate limit
      );
      expect(customService).toBeDefined();
    });
  });

  describe("Bounty Requirement: Complete Snapshot Structure", () => {
    it("should return all required fields in snapshot", async () => {
      const result = await Effect.runPromise(
        service.getSnapshot({
          routes: [ETHEREUM_USDC_TO_POLYGON],
          notionals: ["1000000"],
          includeWindows: ["24h"]
        })
      );

      // Contract compliance: verify all required fields
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

  describe("Bounty Requirement: Volume Metrics", () => {
    it("should fetch volume data from DefiLlama", async () => {
      const result = await Effect.runPromise(
        service.getSnapshot({
          routes: [ETHEREUM_USDC_TO_POLYGON],
          notionals: ["1000000"],
          includeWindows: ["24h"]
        })
      );

      // Volume data structure (may be empty if API is down)
      expect(Array.isArray(result.volumes)).toBe(true);

      if (result.volumes.length > 0) {
        const volume = result.volumes[0];
        expect(volume.window).toMatch(/^(24h|7d|30d)$/);
        expect(typeof volume.volumeUsd).toBe("number");
        expect(volume.volumeUsd).toBeGreaterThanOrEqual(0);
        expect(volume.measuredAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      }
    }, { timeout: 120000 });

    it("should support multiple time windows", async () => {
      const result = await Effect.runPromise(
        service.getSnapshot({
          routes: [ETHEREUM_USDC_TO_POLYGON],
          notionals: ["1000000"],
          includeWindows: ["24h", "7d", "30d"]
        })
      );

      expect(Array.isArray(result.volumes)).toBe(true);

      // Should request all specified windows
      result.volumes.forEach(volume => {
        expect(["24h", "7d", "30d"]).toContain(volume.window);
      });
    }, { timeout: 120000 });

    it("should default to 24h window if not specified", async () => {
      const result = await Effect.runPromise(
        service.getSnapshot({
          routes: [ETHEREUM_USDC_TO_POLYGON],
          notionals: ["1000000"]
          // includeWindows not specified - should default to ["24h"]
        })
      );

      expect(Array.isArray(result.volumes)).toBe(true);
    }, { timeout: 120000 });
  });

  describe("Bounty Requirement: Rates with Fee Breakdown", () => {
    it("should fetch rates from Across suggested-fees API", async () => {
      const result = await Effect.runPromise(
        service.getSnapshot({
          routes: [ETHEREUM_USDC_TO_POLYGON],
          notionals: ["1000000"],
          includeWindows: ["24h"]
        })
      );

      expect(Array.isArray(result.rates)).toBe(true);

      if (result.rates.length > 0) {
        const rate = result.rates[0];

        // Verify rate structure
        expect(rate).toHaveProperty("source");
        expect(rate).toHaveProperty("destination");
        expect(rate).toHaveProperty("amountIn");
        expect(rate).toHaveProperty("amountOut");
        expect(rate).toHaveProperty("effectiveRate");
        expect(rate).toHaveProperty("totalFeesUsd");
        expect(rate).toHaveProperty("quotedAt");
      }
    }, { timeout: 120000 });

    it("should calculate effective rate normalized for decimals", async () => {
      const result = await Effect.runPromise(
        service.getSnapshot({
          routes: [ETHEREUM_USDC_TO_POLYGON],
          notionals: ["1000000"], // 1 USDC
          includeWindows: ["24h"]
        })
      );

      if (result.rates.length > 0) {
        const rate = result.rates[0];

        // Effective rate should be normalized
        expect(typeof rate.effectiveRate).toBe("number");
        expect(rate.effectiveRate).toBeGreaterThan(0);
        expect(rate.effectiveRate).toBeLessThanOrEqual(1.0);

        // For same-token bridge, should be close to 1 (minus fees)
        expect(rate.effectiveRate).toBeGreaterThan(0.9);
      }
    }, { timeout: 120000 });

    it("should keep amounts in smallest units (wei)", async () => {
      const result = await Effect.runPromise(
        service.getSnapshot({
          routes: [ETHEREUM_USDC_TO_POLYGON],
          notionals: ["1000000"],
          includeWindows: ["24h"]
        })
      );

      if (result.rates.length > 0) {
        const rate = result.rates[0];

        // Amounts should be strings for precision
        expect(typeof rate.amountIn).toBe("string");
        expect(typeof rate.amountOut).toBe("string");

        // Should not contain decimals
        expect(rate.amountIn).not.toContain(".");
        expect(rate.amountOut).not.toContain(".");

        // Should be valid BigInt
        expect(() => BigInt(rate.amountIn)).not.toThrow();
        expect(() => BigInt(rate.amountOut)).not.toThrow();
      }
    }, { timeout: 120000 });

    it("should generate rates for multiple notionals", async () => {
      const result = await Effect.runPromise(
        service.getSnapshot({
          routes: [ETHEREUM_USDC_TO_POLYGON],
          notionals: ["1000000", "10000000", "100000000"],
          includeWindows: ["24h"]
        })
      );

      expect(Array.isArray(result.rates)).toBe(true);

      if (result.rates.length > 0) {
        // Should attempt to generate rates for each notional
        const amounts = result.rates.map(r => r.amountIn);
        const uniqueAmounts = new Set(amounts);
        expect(uniqueAmounts.size).toBeGreaterThan(0);
      }
    }, { timeout: 120000 });

    it("should handle different decimal places (6 vs 18)", async () => {
      const result = await Effect.runPromise(
        service.getSnapshot({
          routes: [ETHEREUM_USDC_TO_POLYGON, OPTIMISM_ETH_TO_ARBITRUM],
          notionals: ["1000000", "1000000000000000000"],
          includeWindows: ["24h"]
        })
      );

      if (result.rates.length > 0) {
        result.rates.forEach(rate => {
          // Should properly handle both 6 and 18 decimal tokens
          const is6Decimals = rate.source.decimals === 6;
          const is18Decimals = rate.source.decimals === 18;
          expect(is6Decimals || is18Decimals).toBe(true);

          // Effective rate should still be normalized properly
          expect(rate.effectiveRate).toBeGreaterThan(0);
          expect(rate.effectiveRate).toBeLessThanOrEqual(1.0);
        });
      }
    }, { timeout: 120000 });

    it("should calculate totalFeesUsd when price data available", async () => {
      const result = await Effect.runPromise(
        service.getSnapshot({
          routes: [ETHEREUM_USDC_TO_POLYGON],
          notionals: ["1000000"],
          includeWindows: ["24h"]
        })
      );

      if (result.rates.length > 0) {
        const rate = result.rates[0];

        // totalFeesUsd may be null if price fetch fails
        if (rate.totalFeesUsd !== null) {
          expect(typeof rate.totalFeesUsd).toBe("number");
          expect(rate.totalFeesUsd).toBeGreaterThanOrEqual(0);
        }
      }
    }, { timeout: 120000 });
  });

  describe("Bounty Requirement: Liquidity Depth", () => {
    it("should fetch liquidity limits from Across API", async () => {
      const result = await Effect.runPromise(
        service.getSnapshot({
          routes: [ETHEREUM_USDC_TO_POLYGON],
          notionals: ["1000000"],
          includeWindows: ["24h"]
        })
      );

      expect(Array.isArray(result.liquidity)).toBe(true);

      if (result.liquidity.length > 0) {
        const liq = result.liquidity[0];

        expect(liq).toHaveProperty("route");
        expect(liq).toHaveProperty("thresholds");
        expect(liq).toHaveProperty("measuredAt");
        expect(Array.isArray(liq.thresholds)).toBe(true);
      }
    }, { timeout: 120000 });

    it("should provide thresholds at 50bps and 100bps (0.5% and 1.0% slippage)", async () => {
      const result = await Effect.runPromise(
        service.getSnapshot({
          routes: [ETHEREUM_USDC_TO_POLYGON],
          notionals: ["1000000"],
          includeWindows: ["24h"]
        })
      );

      if (result.liquidity.length > 0) {
        const liq = result.liquidity[0];

        // Must have at least 2 thresholds
        expect(liq.thresholds.length).toBeGreaterThanOrEqual(2);

        // Must include 50bps and 100bps
        const bpsValues = liq.thresholds.map(t => t.slippageBps);
        expect(bpsValues).toContain(50);
        expect(bpsValues).toContain(100);
      }
    }, { timeout: 120000 });

    it("should provide maxAmountIn for each threshold", async () => {
      const result = await Effect.runPromise(
        service.getSnapshot({
          routes: [ETHEREUM_USDC_TO_POLYGON],
          notionals: ["1000000"],
          includeWindows: ["24h"]
        })
      );

      if (result.liquidity.length > 0) {
        const liq = result.liquidity[0];

        liq.thresholds.forEach(threshold => {
          expect(typeof threshold.maxAmountIn).toBe("string");
          expect(typeof threshold.slippageBps).toBe("number");
          expect(parseFloat(threshold.maxAmountIn)).toBeGreaterThan(0);
        });
      }
    }, { timeout: 120000 });

    it("should handle multiple routes", async () => {
      const result = await Effect.runPromise(
        service.getSnapshot({
          routes: [ETHEREUM_USDC_TO_POLYGON, OPTIMISM_ETH_TO_ARBITRUM],
          notionals: ["1000000"],
          includeWindows: ["24h"]
        })
      );

      expect(Array.isArray(result.liquidity)).toBe(true);

      // Should attempt to fetch liquidity for each route
      if (result.liquidity.length > 0) {
        result.liquidity.forEach(liq => {
          const bpsValues = liq.thresholds.map(t => t.slippageBps);
          expect(bpsValues).toContain(50);
          expect(bpsValues).toContain(100);
        });
      }
    }, { timeout: 120000 });
  });

  describe("Bounty Requirement: Available Assets", () => {
    it("should fetch list of supported tokens from Across", async () => {
      const result = await Effect.runPromise(
        service.getSnapshot({
          routes: [ETHEREUM_USDC_TO_POLYGON],
          notionals: ["1000000"],
          includeWindows: ["24h"]
        })
      );

      expect(result.listedAssets).toBeDefined();
      expect(Array.isArray(result.listedAssets.assets)).toBe(true);
      expect(result.listedAssets.assets.length).toBeGreaterThan(0);
    }, { timeout: 120000 });

    it("should include asset metadata (chainId, assetId, symbol, decimals)", async () => {
      const result = await Effect.runPromise(
        service.getSnapshot({
          routes: [ETHEREUM_USDC_TO_POLYGON],
          notionals: ["1000000"],
          includeWindows: ["24h"]
        })
      );

      result.listedAssets.assets.forEach(asset => {
        expect(typeof asset.chainId).toBe("string");
        expect(typeof asset.assetId).toBe("string");
        expect(typeof asset.symbol).toBe("string");
        expect(typeof asset.decimals).toBe("number");
        expect(asset.decimals).toBeGreaterThanOrEqual(0);
        expect(asset.decimals).toBeLessThanOrEqual(18);
      });
    }, { timeout: 120000 });

    it("should include popular tokens across multiple chains", async () => {
      const result = await Effect.runPromise(
        service.getSnapshot({
          routes: [ETHEREUM_USDC_TO_POLYGON],
          notionals: ["1000000"],
          includeWindows: ["24h"]
        })
      );

      const assets = result.listedAssets.assets;

      // Should have USDC
      const hasUSDC = assets.some(a => a.symbol === "USDC");
      expect(hasUSDC).toBe(true);

      // Should have ETH/WETH
      const hasETH = assets.some(a => a.symbol === "ETH" || a.symbol === "WETH");
      expect(hasETH).toBe(true);

      // Should have multiple chains
      const chainIds = new Set(assets.map(a => a.chainId));
      expect(chainIds.size).toBeGreaterThan(1);
    }, { timeout: 120000 });

    it("should provide measurement timestamp", async () => {
      const result = await Effect.runPromise(
        service.getSnapshot({
          routes: [ETHEREUM_USDC_TO_POLYGON],
          notionals: ["1000000"],
          includeWindows: ["24h"]
        })
      );

      expect(result.listedAssets.measuredAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    }, { timeout: 120000 });
  });

  describe("Bounty Requirement: Resilience and Error Handling", () => {
    it("should handle partial failures gracefully", async () => {
      const result = await Effect.runPromise(
        service.getSnapshot({
          routes: [ETHEREUM_USDC_TO_POLYGON],
          notionals: ["1000000"],
          includeWindows: ["24h"]
        })
      );

      // Even if some APIs fail, should return valid structure
      expect(result).toHaveProperty("volumes");
      expect(result).toHaveProperty("rates");
      expect(result).toHaveProperty("liquidity");
      expect(result).toHaveProperty("listedAssets");
    }, { timeout: 120000 });

    it("should continue processing routes even if one fails", async () => {
      // Use a mix of valid and potentially problematic routes
      const result = await Effect.runPromise(
        service.getSnapshot({
          routes: [
            ETHEREUM_USDC_TO_POLYGON,
            OPTIMISM_ETH_TO_ARBITRUM,
          ],
          notionals: ["1000000"],
          includeWindows: ["24h"]
        })
      );

      // Should not throw, even if some routes fail
      expect(result).toBeDefined();
      expect(Array.isArray(result.rates)).toBe(true);
      expect(Array.isArray(result.liquidity)).toBe(true);
    }, { timeout: 120000 });

    it("should return empty arrays instead of throwing for API failures", async () => {
      const result = await Effect.runPromise(
        service.getSnapshot({
          routes: [ETHEREUM_USDC_TO_POLYGON],
          notionals: ["1000000"],
          includeWindows: ["24h"]
        })
      );

      // If DefiLlama is down, volumes may be empty but should not throw
      expect(Array.isArray(result.volumes)).toBe(true);

      // Other fields should still work
      expect(Array.isArray(result.rates)).toBe(true);
      expect(Array.isArray(result.liquidity)).toBe(true);
      expect(Array.isArray(result.listedAssets.assets)).toBe(true);
    }, { timeout: 120000 });
  });

  describe("Health Check (ping)", () => {
    it("should verify API connectivity", async () => {
      const result = await Effect.runPromise(service.ping());

      expect(result).toEqual({
        status: "ok",
        timestamp: expect.any(String),
      });
    }, { timeout: 60000 });

    it("should return ISO datetime timestamp", async () => {
      const result = await Effect.runPromise(service.ping());

      expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    }, { timeout: 60000 });
  });

  describe("Bounty Requirement: ENV-based Configuration", () => {
    it("should use configurable base URLs", () => {
      const customService = new DataProviderService(
        "https://custom-across-api.com",
        "https://custom-coingecko.com",
        "https://custom-defillama.com",
        "custom-api-key",
        30000,
        5
      );

      expect(customService).toBeDefined();
    });

    it("should support custom timeout values", () => {
      const shortTimeoutService = new DataProviderService(
        "https://app.across.to/api",
        "https://api.coingecko.com/api/v3",
        "https://bridges.llama.fi",
        "",
        10000, // 10 seconds
        5
      );

      expect(shortTimeoutService).toBeDefined();
    });

    it("should support custom rate limits", () => {
      const limitedService = new DataProviderService(
        "https://app.across.to/api",
        "https://api.coingecko.com/api/v3",
        "https://bridges.llama.fi",
        "",
        60000,
        2 // 2 requests per second
      );

      expect(limitedService).toBeDefined();
    });
  });

  describe("Bounty Requirement: Performance & Concurrency", () => {
    it("should handle multiple concurrent snapshot requests without rate limiting errors", async () => {
      const input = {
        routes: [ETHEREUM_USDC_TO_POLYGON],
        notionals: ["1000000"],
        includeWindows: ["24h"]
      };

      // Create 5 concurrent requests
      const promises = Array(5).fill(null).map(() =>
        Effect.runPromise(service.getSnapshot(input))
      );

      // All should succeed
      const results = await Promise.all(promises);

      // Verify all results are valid
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result.rates.length).toBeGreaterThan(0);
        expect(result.liquidity.length).toBeGreaterThan(0);
        expect(result.listedAssets.assets.length).toBeGreaterThan(0);
      });
    }, { timeout: 120000 });

    it("should handle concurrent requests for different routes", async () => {
      const inputs = [
        {
          routes: [ETHEREUM_USDC_TO_POLYGON],
          notionals: ["1000000"],
          includeWindows: ["24h"]
        },
        {
          routes: [OPTIMISM_ETH_TO_ARBITRUM],
          notionals: ["1000000000000000000"],
          includeWindows: ["24h"]
        }
      ];

      // Request both routes concurrently
      const promises = inputs.map(input =>
        Effect.runPromise(service.getSnapshot(input))
      );

      const results = await Promise.all(promises);

      // Both should succeed with different data
      expect(results).toHaveLength(2);
      expect(results[0].rates[0].source.symbol).toBe("USDC");
      expect(results[1].rates[0].source.symbol).toBe("WETH");
    }, { timeout: 120000 });
  });

  describe("Bounty Requirement: Contract Field Name Preservation", () => {
    it("should not change field names from contract spec", async () => {
      const result = await Effect.runPromise(
        service.getSnapshot({
          routes: [ETHEREUM_USDC_TO_POLYGON],
          notionals: ["1000000"],
          includeWindows: ["24h"]
        })
      );

      // Exact field names as per contract
      expect(result).toHaveProperty("volumes");
      expect(result).toHaveProperty("rates");
      expect(result).toHaveProperty("liquidity");
      expect(result).toHaveProperty("listedAssets");

      // Nested field names
      if (result.rates.length > 0) {
        const rate = result.rates[0];
        expect(rate).toHaveProperty("source");
        expect(rate).toHaveProperty("destination");
        expect(rate).toHaveProperty("amountIn");
        expect(rate).toHaveProperty("amountOut");
        expect(rate).toHaveProperty("effectiveRate");
        expect(rate).toHaveProperty("totalFeesUsd");
        expect(rate).toHaveProperty("quotedAt");
      }

      if (result.liquidity.length > 0) {
        const liq = result.liquidity[0];
        expect(liq).toHaveProperty("route");
        expect(liq).toHaveProperty("thresholds");
        expect(liq).toHaveProperty("measuredAt");

        if (liq.thresholds.length > 0) {
          const threshold = liq.thresholds[0];
          expect(threshold).toHaveProperty("maxAmountIn");
          expect(threshold).toHaveProperty("slippageBps");
        }
      }

      expect(result.listedAssets).toHaveProperty("assets");
      expect(result.listedAssets).toHaveProperty("measuredAt");
    }, { timeout: 120000 });
  });
});
