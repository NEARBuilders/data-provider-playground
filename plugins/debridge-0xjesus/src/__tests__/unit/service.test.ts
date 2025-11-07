import { Effect } from "every-plugin/effect";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { DataProviderService } from "../../service";

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

describe("DataProviderService", () => {
  let service: DataProviderService;

  beforeEach(() => {
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

    service = new DataProviderService(
      "https://api.example.com",
      "https://bridges.llama.fi",
      "test-api-key",
      5000,
      10
    );
  });

  describe("getSnapshot", () => {
    it("should return complete snapshot structure", async () => {
      const result = await Effect.runPromise(
        service.getSnapshot({
          routes: [mockRoute],
          notionals: ["1000", "10000"],
          includeWindows: ["24h", "7d"]
        })
      );

      // Verify all required fields are present
      expect(result).toHaveProperty("volumes");
      expect(result).toHaveProperty("rates");
      expect(result).toHaveProperty("liquidity");
      expect(result).toHaveProperty("listedAssets");

      // Verify arrays are not empty
      expect(Array.isArray(result.volumes)).toBe(true);
      expect(Array.isArray(result.rates)).toBe(true);
      expect(Array.isArray(result.liquidity)).toBe(true);
      expect(Array.isArray(result.listedAssets.assets)).toBe(true);
    });

    it("should return volumes for requested time windows", async () => {
      const result = await Effect.runPromise(
        service.getSnapshot({
          routes: [mockRoute],
          notionals: ["1000"],
          includeWindows: ["24h", "7d"]
        })
      );

      expect(result.volumes).toHaveLength(2);
      expect(result.volumes.map(v => v.window)).toContain("24h");
      expect(result.volumes.map(v => v.window)).toContain("7d");
      expect(result.volumes[0].volumeUsd).toBeTypeOf("number");
      expect(result.volumes[0].measuredAt).toBeTypeOf("string");
    });

    it("should generate rates for all route/notional combinations", async () => {
      const result = await Effect.runPromise(
        service.getSnapshot({
          routes: [mockRoute],
          notionals: ["1000", "10000"],
          includeWindows: ["24h"]
        })
      );

      // Should have 2 rates (1 route × 2 notionals)
      expect(result.rates).toHaveLength(2);

      // Verify rate structure
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

    it("should provide liquidity at 50bps and 100bps thresholds", async () => {
      const result = await Effect.runPromise(
        service.getSnapshot({
          routes: [mockRoute],
          notionals: ["1000"],
          includeWindows: ["24h"]
        })
      );

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
      const result = await Effect.runPromise(
        service.getSnapshot({
          routes: [mockRoute],
          notionals: ["1000"],
          includeWindows: ["24h"]
        })
      );

      expect(result.listedAssets.assets).toHaveLength(3);

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
          assetId: "0xA0b86a33E6442e082877a094f204b01BF645Fe0",
          symbol: "USDC",
          decimals: 6,
        }
      };

      const result = await Effect.runPromise(
        service.getSnapshot({
          routes: [mockRoute, secondRoute],
          notionals: ["1000"],
          includeWindows: ["24h"]
        })
      );

      // Should have liquidity data for both routes
      expect(result.liquidity).toHaveLength(2);
      expect(result.rates).toHaveLength(2); // 2 routes × 1 notional
    });
  });

  describe("ping", () => {
    it("should return healthy status", async () => {
      const result = await Effect.runPromise(service.ping());

      expect(result).toEqual({
        status: "ok",
        timestamp: expect.any(String),
      });
    });
  });
});
