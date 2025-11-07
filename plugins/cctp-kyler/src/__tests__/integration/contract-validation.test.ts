import type { PluginRegistry } from "every-plugin";
import { createLocalPluginRuntime } from "every-plugin/testing";
import { describe, expect, it } from "vitest";
import CCTPPlugin from "../../index";
import { ProviderSnapshot } from "../../contract";

const mockRoute = {
  source: {
    chainId: "1",
    assetId: "0xA0b86991c6218b36c1d19D4a2e9Eb0c3606eB48",
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

const TEST_REGISTRY: PluginRegistry = {
  "@MrSufferer/cctp": {
    remoteUrl: "http://localhost:3000/remoteEntry.js",
    version: "1.0.1",
    description: "Circle CCTP data provider plugin",
  },
};

const TEST_PLUGIN_MAP = {
  "@MrSufferer/cctp": CCTPPlugin,
} as const;

const TEST_CONFIG = {
  variables: {
    timeout: 10000,
    maxRetries: 3,
    requestsPerSecond: 5,
    subgraphBaseUrl: "https://gateway.thegraph.com/api",
  },
  secrets: {
    subgraphApiKey: process.env.SUBGRAPH_API_KEY || "test-key",
  },
};

describe("CCTP Plugin Contract Validation", () => {
  const runtime = createLocalPluginRuntime<typeof TEST_PLUGIN_MAP>(
    {
      registry: TEST_REGISTRY,
      secrets: {},
    },
    TEST_PLUGIN_MAP
  );

  it("should return data that matches ProviderSnapshot contract", async () => {
    const { client } = await runtime.usePlugin("@MrSufferer/cctp", TEST_CONFIG);

    const result = await client.getSnapshot({
      routes: [mockRoute],
      notionals: ["1000", "10000"],
      includeWindows: ["24h", "7d", "30d"]
    });

    expect(() => ProviderSnapshot.parse(result)).not.toThrow();

    console.log("\n=== Contract Validation Results ===");
    console.log(`✅ Volumes: ${result.volumes.length} windows`);
    result.volumes.forEach(v => {
      console.log(`   - ${v.window}: $${v.volumeUsd.toLocaleString()} USD`);
    });

    console.log(`\n✅ Rates: ${result.rates.length} quotes`);
    result.rates.slice(0, 2).forEach((rate, i) => {
      console.log(`   ${i + 1}. ${rate.source.symbol} → ${rate.destination.symbol}`);
      console.log(`      Amount In: ${rate.amountIn}, Amount Out: ${rate.amountOut}`);
      console.log(`      Effective Rate: ${rate.effectiveRate}, Fees: ${rate.totalFeesUsd || 0} USD`);
    });

    console.log(`\n✅ Liquidity: ${result.liquidity.length} routes`);
    result.liquidity.forEach((liq, i) => {
      console.log(`   ${i + 1}. ${liq.route.source.chainId} → ${liq.route.destination.chainId}`);
      liq.thresholds.forEach(t => {
        const amount = BigInt(t.maxAmountIn);
        const amountUsd = Number(amount) / Math.pow(10, 6);
        console.log(`      ${t.slippageBps}bps: ${amountUsd.toLocaleString()} USDC`);
      });
    });

    console.log(`\n✅ Listed Assets: ${result.listedAssets.assets.length} assets`);
    console.log(`   Sample chains: ${result.listedAssets.assets.slice(0, 3).map(a => a.chainId).join(", ")}`);
    console.log("================================\n");
  });

  it("should return volumes for all requested time windows", async () => {
    const { client } = await runtime.usePlugin("@MrSufferer/cctp", TEST_CONFIG);

    const result = await client.getSnapshot({
      routes: [mockRoute],
      notionals: ["1000"],
      includeWindows: ["24h", "7d", "30d"]
    });

    expect(result.volumes).toHaveLength(3);
    expect(result.volumes.map(v => v.window)).toEqual(expect.arrayContaining(["24h", "7d", "30d"]));
    
    result.volumes.forEach(volume => {
      expect(volume.volumeUsd).toBeGreaterThanOrEqual(0);
      expect(volume.measuredAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  it("should return rates for all route/notional combinations", async () => {
    const { client } = await runtime.usePlugin("@MrSufferer/cctp", TEST_CONFIG);

    const result = await client.getSnapshot({
      routes: [mockRoute],
      notionals: ["1000", "10000"],
      includeWindows: ["24h"]
    });

    expect(result.rates).toHaveLength(2);

    result.rates.forEach(rate => {
      expect(rate.source).toEqual(mockRoute.source);
      expect(rate.destination).toEqual(mockRoute.destination);
      expect(rate.amountIn).toBeDefined();
      expect(rate.amountOut).toBeDefined();
      expect(rate.effectiveRate).toBeGreaterThan(0);
      expect(rate.quotedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      
      const amountIn = BigInt(rate.amountIn);
      const amountOut = BigInt(rate.amountOut);
      expect(amountIn).toBeGreaterThan(BigInt(0));
      expect(amountOut).toBeGreaterThan(BigInt(0));
    });
  });

  it("should return liquidity depth with 50bps and 100bps thresholds", async () => {
    const { client } = await runtime.usePlugin("@MrSufferer/cctp", TEST_CONFIG);

    const result = await client.getSnapshot({
      routes: [mockRoute],
      notionals: ["1000"],
      includeWindows: ["24h"]
    });

    expect(result.liquidity).toHaveLength(1);
    expect(result.liquidity[0].route).toEqual(mockRoute);

    const thresholds = result.liquidity[0].thresholds;
    expect(thresholds).toHaveLength(2);

    const bpsValues = thresholds.map(t => t.slippageBps);
    expect(bpsValues).toContain(50);
    expect(bpsValues).toContain(100);

    thresholds.forEach(threshold => {
      expect(BigInt(threshold.maxAmountIn)).toBeGreaterThan(BigInt(0));
      expect([50, 100]).toContain(threshold.slippageBps);
    });

    expect(result.liquidity[0].measuredAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it("should return listed assets with correct structure", async () => {
    const { client } = await runtime.usePlugin("@MrSufferer/cctp", TEST_CONFIG);

    const result = await client.getSnapshot({
      routes: [mockRoute],
      notionals: ["1000"],
      includeWindows: ["24h"]
    });

    expect(result.listedAssets.assets.length).toBeGreaterThan(0);
    expect(result.listedAssets.measuredAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

    result.listedAssets.assets.forEach(asset => {
      expect(asset.chainId).toBeDefined();
      expect(asset.assetId).toBeDefined();
      expect(asset.symbol).toBe("USDC");
      expect(asset.decimals).toBe(6);
    });
  });
});

