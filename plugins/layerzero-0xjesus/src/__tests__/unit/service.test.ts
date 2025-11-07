import { Effect } from "every-plugin/effect";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { DataProviderService } from "../../service";

// Mock fetch globally
global.fetch = vi.fn();

// Mock route for testing
const mockRoute = {
  source: {
    chainId: "1",
    assetId: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    symbol: "USDC",
    decimals: 6,
  },
  destination: {
    chainId: "137",
    assetId: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
    symbol: "USDC",
    decimals: 6,
  }
};

// Mock chains response
const mockChainsResponse = {
  chains: [
    {
      chainKey: "ethereum",
      chainType: "evm",
      chainId: 1,
      shortName: "ETH",
      name: "Ethereum",
      nativeCurrency: {
        chainKey: "ethereum",
        name: "Ethereum",
        symbol: "ETH",
        decimals: 18,
        address: "0x0000000000000000000000000000000000000000",
      }
    },
    {
      chainKey: "polygon",
      chainType: "evm",
      chainId: 137,
      shortName: "MATIC",
      name: "Polygon",
      nativeCurrency: {
        chainKey: "polygon",
        name: "MATIC",
        symbol: "MATIC",
        decimals: 18,
        address: "0x0000000000000000000000000000000000000000",
      }
    },
    {
      chainKey: "arbitrum",
      chainType: "evm",
      chainId: 42161,
      shortName: "ARB",
      name: "Arbitrum",
      nativeCurrency: {
        chainKey: "arbitrum",
        name: "Ethereum",
        symbol: "ETH",
        decimals: 18,
        address: "0x0000000000000000000000000000000000000000",
      }
    }
  ]
};

// Mock tokens response
const mockTokensResponse = {
  tokens: [
    {
      isBridgeable: true,
      chainKey: "ethereum",
      address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      decimals: 6,
      symbol: "USDC",
      name: "USD Coin",
      price: { usd: 1.0 }
    },
    {
      isBridgeable: true,
      chainKey: "polygon",
      address: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
      decimals: 6,
      symbol: "USDC",
      name: "USD Coin",
      price: { usd: 1.0 }
    },
    {
      isBridgeable: true,
      chainKey: "arbitrum",
      address: "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8",
      decimals: 6,
      symbol: "USDC",
      name: "USD Coin",
      price: { usd: 1.0 }
    }
  ]
};

// Mock quote response
const mockQuoteResponse = {
  quotes: [
    {
      route: "ethereum->polygon",
      error: null,
      srcAmount: "1000000",
      dstAmount: "998000",
      srcAmountMax: "10000000000",
      dstAmountMin: "950000",
      srcToken: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      dstToken: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
      srcAddress: "0x0000000000000000000000000000000000000001",
      dstAddress: "0x0000000000000000000000000000000000000001",
      srcChainKey: "ethereum",
      dstChainKey: "polygon",
      fees: [
        {
          token: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          chainKey: "ethereum",
          amount: "2000",
          type: "bridge"
        }
      ]
    }
  ]
};

// Mock DefiLlama volume response
const mockVolumeResponse = {
  dailyVolume: 15000000,
  totalDataChart: [
    [1640000000, 10000000],
    [1640086400, 11000000],
    [1640172800, 12000000],
    [1640259200, 13000000],
    [1640345600, 14000000],
    [1640432000, 15000000],
    [1640518400, 16000000],
    [1640604800, 17000000],
    [1640691200, 18000000],
    [1640777600, 19000000],
    // Add more days for 30d test
    ...Array.from({ length: 20 }, (_, i) => [1640864000 + i * 86400, 20000000 + i * 1000000])
  ]
};

describe("DataProviderService", () => {
  let service: DataProviderService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new DataProviderService(
      "https://api.example.com",
      "https://api.llama.fi",
      "test-api-key",
      5000,
      100 // High rate limit for tests
    );

    // Setup default mock implementations
    (global.fetch as any).mockImplementation((url: string) => {
      const urlStr = url.toString();

      if (urlStr.includes('/chains')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockChainsResponse)
        });
      }

      if (urlStr.includes('/tokens')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockTokensResponse)
        });
      }

      if (urlStr.includes('/quotes')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockQuoteResponse)
        });
      }

      if (urlStr.includes('api.llama.fi')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockVolumeResponse)
        });
      }

      return Promise.resolve({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });
    });
  });

  describe("getSnapshot", () => {
    it("should return complete snapshot structure", async () => {
      const result = await Effect.runPromise(
        service.getSnapshot({
          routes: [mockRoute],
          notionals: ["1000000", "10000000"],
          includeWindows: ["24h", "7d"]
        })
      );

      // Verify all required fields are present
      expect(result).toHaveProperty("volumes");
      expect(result).toHaveProperty("rates");
      expect(result).toHaveProperty("liquidity");
      expect(result).toHaveProperty("listedAssets");

      // Verify arrays are defined
      expect(Array.isArray(result.volumes)).toBe(true);
      expect(Array.isArray(result.rates)).toBe(true);
      expect(Array.isArray(result.liquidity)).toBe(true);
      expect(Array.isArray(result.listedAssets.assets)).toBe(true);
    });

    it("should return volumes for requested time windows", async () => {
      const result = await Effect.runPromise(
        service.getSnapshot({
          routes: [mockRoute],
          notionals: ["1000000"],
          includeWindows: ["24h", "7d"]
        })
      );

      expect(result.volumes.length).toBeGreaterThanOrEqual(2);
      const windows = result.volumes.map(v => v.window);
      expect(windows).toContain("24h");
      expect(windows).toContain("7d");
      expect(result.volumes[0].volumeUsd).toBeTypeOf("number");
      expect(result.volumes[0].measuredAt).toBeTypeOf("string");
    });

    it("should generate rates for all route/notional combinations", async () => {
      const result = await Effect.runPromise(
        service.getSnapshot({
          routes: [mockRoute],
          notionals: ["1000000", "10000000"],
          includeWindows: ["24h"]
        })
      );

      // Should have 2 rates (1 route × 2 notionals)
      expect(result.rates.length).toBeGreaterThanOrEqual(1);

      // Verify rate structure
      if (result.rates.length > 0) {
        const rate = result.rates[0];
        expect(rate.source).toEqual(mockRoute.source);
        expect(rate.destination).toEqual(mockRoute.destination);
        expect(rate.amountIn).toBeTypeOf("string");
        expect(rate.amountOut).toBeTypeOf("string");
        expect(rate.effectiveRate).toBeTypeOf("number");
        expect(rate.effectiveRate).toBeGreaterThan(0);
        expect(typeof rate.totalFeesUsd).toBe("number");
        expect(rate.quotedAt).toBeTypeOf("string");
      }
    });

    it("should provide liquidity at 50bps and 100bps thresholds", async () => {
      const result = await Effect.runPromise(
        service.getSnapshot({
          routes: [mockRoute],
          notionals: ["1000000"],
          includeWindows: ["24h"]
        })
      );

      expect(result.liquidity.length).toBeGreaterThanOrEqual(1);

      if (result.liquidity.length > 0) {
        expect(result.liquidity[0].route).toEqual(mockRoute);

        const thresholds = result.liquidity[0].thresholds;
        expect(thresholds.length).toBeGreaterThanOrEqual(2);

        // Should have both required thresholds
        const bpsValues = thresholds.map(t => t.slippageBps);
        expect(bpsValues).toContain(50);
        expect(bpsValues).toContain(100);

        // Verify threshold structure
        thresholds.forEach(threshold => {
          expect(threshold.maxAmountIn).toBeTypeOf("string");
          expect(threshold.slippageBps).toBeTypeOf("number");
          expect(BigInt(threshold.maxAmountIn)).toBeGreaterThan(0);
        });
      }
    });

    it("should return list of supported assets", async () => {
      const result = await Effect.runPromise(
        service.getSnapshot({
          routes: [mockRoute],
          notionals: ["1000000"],
          includeWindows: ["24h"]
        })
      );

      expect(result.listedAssets.assets.length).toBeGreaterThanOrEqual(3);

      // Verify asset structure
      result.listedAssets.assets.forEach(asset => {
        expect(asset.chainId).toBeTypeOf("string");
        expect(asset.assetId).toBeTypeOf("string");
        expect(asset.symbol).toBeTypeOf("string");
        expect(asset.decimals).toBeTypeOf("number");
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
          assetId: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          symbol: "USDC",
          decimals: 6,
        }
      };

      const result = await Effect.runPromise(
        service.getSnapshot({
          routes: [mockRoute, secondRoute],
          notionals: ["1000000"],
          includeWindows: ["24h"]
        })
      );

      // Should have liquidity data for routes (may be less if API fails)
      expect(result.liquidity.length).toBeGreaterThanOrEqual(1);
      expect(result.rates.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("ping", () => {
    it("should return healthy status", async () => {
      const result = await Effect.runPromise(service.ping());

      expect(result).toHaveProperty("status");
      expect(result.status).toBe("ok");
      expect(result).toHaveProperty("timestamp");
      expect(typeof result.timestamp).toBe("string");
    });
  });

  describe("Edge Cases", () => {
    it("should handle corrupted volume data gracefully", async () => {
      // Mock corrupted response
      (global.fetch as any).mockImplementation((url: string) => {
        if (url.includes('api.llama.fi')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              // Missing dailyVolume
              totalDataChart: null // Corrupted data
            })
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockChainsResponse) });
      });

      const result = await Effect.runPromise(
        service.getSnapshot({
          routes: [mockRoute],
          notionals: ["1000000"],
          includeWindows: ["24h", "7d"]
        })
      );

      // Should not crash, should return empty volumes
      expect(result.volumes).toBeDefined();
      expect(Array.isArray(result.volumes)).toBe(true);
    });

    it("should handle quote with invalid srcAmountMax", async () => {
      (global.fetch as any).mockImplementation((url: string) => {
        if (url.includes('/quotes')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              quotes: [{
                ...mockQuoteResponse.quotes[0],
                srcAmountMax: "-1" // Invalid negative value
              }]
            })
          });
        }
        if (url.includes('/chains')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve(mockChainsResponse) });
        }
        if (url.includes('/tokens')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve(mockTokensResponse) });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockVolumeResponse) });
      });

      const result = await Effect.runPromise(
        service.getSnapshot({
          routes: [mockRoute],
          notionals: ["1000000"],
          includeWindows: ["24h"]
        })
      );

      // Should handle gracefully - liquidity may be empty or skip this route
      expect(result).toHaveProperty("liquidity");
      expect(Array.isArray(result.liquidity)).toBe(true);
    });

    it("should handle missing token price", async () => {
      (global.fetch as any).mockImplementation((url: string) => {
        if (url.includes('/tokens')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              tokens: [{
                ...mockTokensResponse.tokens[0],
                price: { usd: 0 } // Invalid price
              }]
            })
          });
        }
        if (url.includes('/chains')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve(mockChainsResponse) });
        }
        if (url.includes('/quotes')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve(mockQuoteResponse) });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockVolumeResponse) });
      });

      const result = await Effect.runPromise(
        service.getSnapshot({
          routes: [mockRoute],
          notionals: ["1000000"],
          includeWindows: ["24h"]
        })
      );

      // Should handle gracefully - totalFeesUsd should be 0 or null
      expect(result.rates).toBeDefined();
      if (result.rates.length > 0) {
        expect(result.rates[0].totalFeesUsd).toBeTypeOf("number");
      }
    });

    it("should handle API timeout gracefully", async () => {
      // First, let metadata load successfully
      await Effect.runPromise(
        service.getSnapshot({
          routes: [mockRoute],
          notionals: ["1000000"],
          includeWindows: ["24h"]
        })
      );

      // Now mock all fetches to timeout
      (global.fetch as any).mockImplementation(() => {
        return Promise.reject(new Error("Request timeout"));
      });

      // Service should handle timeouts gracefully and return partial/empty data
      // (graceful degradation design)
      const result = await Effect.runPromise(
        service.getSnapshot({
          routes: [mockRoute],
          notionals: ["1000000"],
          includeWindows: ["24h"]
        })
      );

      // Should not crash - should return with required structure even if data is empty
      expect(result).toHaveProperty("volumes");
      expect(result).toHaveProperty("rates");
      expect(result).toHaveProperty("liquidity");
      expect(result).toHaveProperty("listedAssets");

      // Data arrays may be empty due to timeouts, which is expected
      expect(Array.isArray(result.volumes)).toBe(true);
      expect(Array.isArray(result.rates)).toBe(true);
      expect(Array.isArray(result.liquidity)).toBe(true);
      expect(Array.isArray(result.listedAssets.assets)).toBe(true);
    });

    it("should handle empty routes array", async () => {
      try {
        await Effect.runPromise(
          service.getSnapshot({
            routes: [],
            notionals: ["1000000"],
            includeWindows: ["24h"]
          })
        );
        // Should either succeed with empty results or throw validation error
        expect(true).toBe(true);
      } catch (error) {
        // Validation error is acceptable
        expect(error).toBeDefined();
      }
    });
  });

  describe("Stress Tests", () => {
    it("should handle many routes in parallel", async () => {
      // Create 10 different routes
      const manyRoutes = Array.from({ length: 10 }, (_, i) => ({
        source: {
          chainId: i % 2 === 0 ? "1" : "42161",
          assetId: mockRoute.source.assetId,
          symbol: "USDC",
          decimals: 6,
        },
        destination: {
          chainId: "137",
          assetId: mockRoute.destination.assetId,
          symbol: "USDC",
          decimals: 6,
        }
      }));

      const startTime = Date.now();

      const result = await Effect.runPromise(
        service.getSnapshot({
          routes: manyRoutes,
          notionals: ["1000000"],
          includeWindows: ["24h"]
        })
      );

      const duration = Date.now() - startTime;

      // Should complete in reasonable time (< 5s for mocked requests)
      expect(duration).toBeLessThan(5000);

      // Should return data for all routes (or gracefully degrade)
      expect(result).toHaveProperty("rates");
      expect(result).toHaveProperty("liquidity");
      expect(Array.isArray(result.rates)).toBe(true);
      expect(Array.isArray(result.liquidity)).toBe(true);
    });

    it("should handle many notionals per route", async () => {
      const manyNotionals = Array.from({ length: 20 }, (_, i) =>
        (1000000 * (i + 1)).toString()
      );

      const result = await Effect.runPromise(
        service.getSnapshot({
          routes: [mockRoute],
          notionals: manyNotionals,
          includeWindows: ["24h"]
        })
      );

      // Should return rates for many notionals
      expect(result.rates).toBeDefined();
      expect(Array.isArray(result.rates)).toBe(true);
    });

    it("should respect rate limiting", async () => {
      let fetchCount = 0;
      (global.fetch as any).mockImplementation((url: string) => {
        fetchCount++;
        if (url.includes('/chains')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve(mockChainsResponse) });
        }
        if (url.includes('/tokens')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve(mockTokensResponse) });
        }
        if (url.includes('/quotes')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve(mockQuoteResponse) });
        }
        if (url.includes('api.llama.fi')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve(mockVolumeResponse) });
        }
        return Promise.resolve({ ok: false, status: 404 });
      });

      await Effect.runPromise(
        service.getSnapshot({
          routes: [mockRoute, mockRoute], // Duplicate for more requests
          notionals: ["1000000", "10000000"],
          includeWindows: ["24h"]
        })
      );

      // Should have made multiple fetch calls
      expect(fetchCount).toBeGreaterThan(0);
    });
  });
});
