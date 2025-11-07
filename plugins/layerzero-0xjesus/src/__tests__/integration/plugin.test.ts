import { describe, it, expect } from "vitest";
import { Effect } from "every-plugin/effect";

import { DataProviderService } from "../../service";

/**
 * Integration tests that make REAL API calls to Stargate and DefiLlama.
 *
 * These tests verify that the plugin works correctly with live data.
 * They may be slower and can fail due to network issues or API changes.
 *
 * Run with: bun test:integration
 */
describe("LayerZero Plugin - Integration Tests", () => {
  const service = new DataProviderService(
    "https://stargate.finance/api/v1",
    "https://api.llama.fi",
    "not-required",
    20000, // Increased timeout for real network calls
    5 // Lower rate limit for integration tests
  );

  it("should successfully ping the Stargate API", async () => {
    const result = await Effect.runPromise(service.ping());
    expect(result.status).toBe("ok");
    expect(result.timestamp).toBeDefined();
  }, 30000);

  it("should fetch a real snapshot with valid data", async () => {
    // Use native ETH transfer between Ethereum and Arbitrum - always works!
    // Native ETH address is 0xEeee... according to Stargate docs
    const route = {
      source: {
        chainId: "1", // Ethereum
        assetId: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", // Native ETH
        symbol: "ETH",
        decimals: 18,
      },
      destination: {
        chainId: "42161", // Arbitrum
        assetId: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", // Native ETH
        symbol: "ETH",
        decimals: 18,
      },
    };

    const snapshotInput = {
      routes: [route],
      notionals: ["1000000000000000000"], // 1 ETH (18 decimals)
      includeWindows: ["24h" as const],
    };

    const snapshot = await Effect.runPromise(service.getSnapshot(snapshotInput));

    // 1. Check Volumes (from DefiLlama)
    expect(snapshot.volumes).toBeDefined();
    expect(Array.isArray(snapshot.volumes)).toBe(true);
    // Expect at least the 24h window we requested
    if (snapshot.volumes.length > 0) {
        const volume24h = snapshot.volumes.find(v => v.window === "24h");
        expect(volume24h).toBeDefined();
        expect(typeof volume24h?.volumeUsd).toBe("number");
        expect(volume24h!.volumeUsd).toBeGreaterThan(0);
    }

    // 2. Check Rates
    expect(snapshot.rates).toBeDefined();
    expect(Array.isArray(snapshot.rates)).toBe(true);
    expect(snapshot.rates.length).toBeGreaterThan(0);
    const rate = snapshot.rates[0];
    expect(rate.source.assetId.toLowerCase()).toEqual(route.source.assetId.toLowerCase());
    expect(rate.destination.assetId.toLowerCase()).toEqual(route.destination.assetId.toLowerCase());
    expect(BigInt(rate.amountIn)).toBeGreaterThan(0);
    expect(BigInt(rate.amountOut)).toBeGreaterThan(0);
    expect(rate.effectiveRate).toBeGreaterThan(0);
    console.log(`[Integration Test] Rate: ${rate.amountIn} -> ${rate.amountOut}, effective rate: ${rate.effectiveRate}`);

    // 3. Check Liquidity Depth (now with proper binary search)
    expect(snapshot.liquidity).toBeDefined();
    expect(Array.isArray(snapshot.liquidity)).toBe(true);
    expect(snapshot.liquidity.length).toBeGreaterThan(0);
    const liquidity = snapshot.liquidity[0];
    expect(liquidity.route.source.assetId.toLowerCase()).toEqual(route.source.assetId.toLowerCase());
    expect(liquidity.thresholds.length).toBe(2);

    // Verify we have both 50bps and 100bps thresholds
    const threshold50bps = liquidity.thresholds.find(t => t.slippageBps === 50);
    const threshold100bps = liquidity.thresholds.find(t => t.slippageBps === 100);
    expect(threshold50bps).toBeDefined();
    expect(threshold100bps).toBeDefined();
    expect(BigInt(threshold50bps!.maxAmountIn)).toBeGreaterThan(0);
    expect(BigInt(threshold100bps!.maxAmountIn)).toBeGreaterThan(0);

    // 100bps threshold should allow equal or more liquidity than 50bps
    expect(BigInt(threshold100bps!.maxAmountIn)).toBeGreaterThanOrEqual(BigInt(threshold50bps!.maxAmountIn));

    console.log(`[Integration Test] Liquidity at 0.5% slippage: ${threshold50bps!.maxAmountIn}`);
    console.log(`[Integration Test] Liquidity at 1.0% slippage: ${threshold100bps!.maxAmountIn}`);

    // 4. Check Listed Assets
    expect(snapshot.listedAssets).toBeDefined();
    expect(Array.isArray(snapshot.listedAssets.assets)).toBe(true);
    expect(snapshot.listedAssets.assets.length).toBeGreaterThan(10); // Stargate supports many assets

    // Verify ETH is in the listed assets
    const ethOnArbitrum = snapshot.listedAssets.assets.find(
      (a) => a.assetId.toLowerCase() === route.destination.assetId.toLowerCase() &&
             a.chainId === route.destination.chainId
    );
    expect(ethOnArbitrum).toBeDefined();
    expect(ethOnArbitrum?.symbol).toBe("ETH");

    console.log(`[Integration Test] ✅ All checks passed!`);
  }, 90000); // Increase timeout for binary search iterations (up to 16 API calls per route)
});