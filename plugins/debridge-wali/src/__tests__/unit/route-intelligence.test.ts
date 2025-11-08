import { describe, it, expect, beforeEach } from "vitest";
import { Effect } from "every-plugin/effect";
import { DataProviderService } from "../../src/service";

describe("Route Intelligence - Unique Feature", () => {
  let service: DataProviderService;
  const baseUrl = "https://dln.debridge.finance/v1.0";
  const defillamaBaseUrl = "https://bridges.llama.fi";
  const apiKey = "";
  const timeout = 30000;
  const maxRequestsPerSecond = 10;

  beforeEach(() => {
    service = new DataProviderService(
      baseUrl,
      defillamaBaseUrl,
      apiKey,
      timeout,
      maxRequestsPerSecond
    );
  });

  const mockRoute = {
    source: {
      chainId: "1",
      assetId: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
      symbol: "USDC",
      decimals: 6
    },
    destination: {
      chainId: "137",
      assetId: "0x2791bca1f2de4661ed88a30c99a7a9449aa84174",
      symbol: "USDC",
      decimals: 6
    }
  };

  it("should provide route intelligence when requested", async () => {
    const result = await Effect.runPromise(
      service.getSnapshot({
        routes: [mockRoute],
        notionals: ["1000000"], // $1 USDC
        includeWindows: ["24h"],
        includeIntelligence: true // Enable route intelligence
      })
    );

    // Should have standard metrics
    expect(result.volumes).toBeDefined();
    expect(result.rates).toBeDefined();
    expect(result.liquidity).toBeDefined();
    expect(result.listedAssets).toBeDefined();

    // Should have route intelligence
    expect(result.routeIntelligence).toBeDefined();
    expect(Array.isArray(result.routeIntelligence)).toBe(true);
    expect(result.routeIntelligence!.length).toBeGreaterThan(0);

    const intelligence = result.routeIntelligence![0];
    
    // Verify structure
    expect(intelligence).toHaveProperty('route');
    expect(intelligence).toHaveProperty('maxCapacityUsd');
    expect(intelligence).toHaveProperty('optimalRangeUsd');
    expect(intelligence).toHaveProperty('feeEfficiencyScore');
    expect(intelligence).toHaveProperty('priceImpactBps');
    expect(intelligence).toHaveProperty('measuredAt');

    // Verify route matches input
    expect(intelligence.route.source.symbol).toBe(mockRoute.source.symbol);
    expect(intelligence.route.destination.symbol).toBe(mockRoute.destination.symbol);

    // Log results for manual inspection
    console.log('\n📊 Route Intelligence Analysis:');
    console.log(`   Route: ${intelligence.route.source.symbol} → ${intelligence.route.destination.symbol}`);
    console.log(`   Max Capacity: $${intelligence.maxCapacityUsd?.toLocaleString() || 'N/A'}`);
    console.log(`   Optimal Range: $${intelligence.optimalRangeUsd?.min.toLocaleString() || 'N/A'} - $${intelligence.optimalRangeUsd?.max.toLocaleString() || 'N/A'}`);
    console.log(`   Fee Efficiency Score: ${intelligence.feeEfficiencyScore?.toFixed(2) || 'N/A'}/100`);
    console.log(`   Price Impact @ $10k: ${intelligence.priceImpactBps.at10k || 'N/A'} bps`);
    console.log(`   Price Impact @ $100k: ${intelligence.priceImpactBps.at100k || 'N/A'} bps`);
  }, 60000); // 60s timeout for probing

  it("should NOT include intelligence when not requested", async () => {
    const result = await Effect.runPromise(
      service.getSnapshot({
        routes: [mockRoute],
        notionals: ["1000000"],
        includeWindows: ["24h"],
        // includeIntelligence not set (defaults to false)
      })
    );

    // Should have standard metrics
    expect(result.volumes).toBeDefined();
    expect(result.rates).toBeDefined();
    expect(result.liquidity).toBeDefined();
    expect(result.listedAssets).toBeDefined();

    // Should NOT have route intelligence
    expect(result.routeIntelligence).toBeUndefined();
  });

  it("should handle intelligence analysis gracefully on API errors", async () => {
    // Use an invalid route to trigger errors
    const invalidRoute = {
      source: {
        chainId: "999999",
        assetId: "0xinvalid",
        symbol: "INVALID",
        decimals: 18
      },
      destination: mockRoute.destination
    };

    const result = await Effect.runPromise(
      service.getSnapshot({
        routes: [invalidRoute],
        notionals: ["1000000"],
        includeWindows: ["24h"],
        includeIntelligence: true
      })
    );

    // Should still return intelligence structure (with null values)
    expect(result.routeIntelligence).toBeDefined();
    expect(result.routeIntelligence!.length).toBe(1);
    
    const intelligence = result.routeIntelligence![0];
    expect(intelligence.maxCapacityUsd).toBeNull();
    expect(intelligence.optimalRangeUsd).toBeNull();
    expect(intelligence.feeEfficiencyScore).toBeNull();
  });
});
