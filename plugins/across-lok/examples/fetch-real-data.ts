/**
 * Example: Fetch REAL data from Across API
 * 
 * This script demonstrates how to use the Across plugin to fetch real,
 * live data from the Across Protocol API - no mocks, no test data.
 * 
 * Run: bun run examples/fetch-real-data.ts
 */

import { Effect } from "every-plugin/effect";
import { DataProviderService } from "../src/service";

// Real Across API endpoint
const ACROSS_API_URL = "https://app.across.to/api";

// Create service with real API endpoint
const service = new DataProviderService(
  ACROSS_API_URL,
  "", // No API key needed for public endpoints
  30000 // 30 second timeout
);

// Define a real route: USDC from Ethereum to Polygon
const ethereumUSDC = {
  chainId: "1",
  assetId: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // Real USDC on Ethereum
  symbol: "USDC",
  decimals: 6,
};

const polygonUSDC = {
  chainId: "137",
  assetId: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174", // Real USDC on Polygon
  symbol: "USDC",
  decimals: 6,
};

const route = {
  source: ethereumUSDC,
  destination: polygonUSDC,
};

async function main() {
  console.log("🌐 Fetching REAL data from Across Protocol API...\n");
  console.log(`API Endpoint: ${ACROSS_API_URL}\n`);
  console.log(`Route: USDC (Ethereum) → USDC (Polygon)\n`);
  console.log("═".repeat(80));

  try {
    // 1. Health Check
    console.log("\n1️⃣  Health Check");
    console.log("─".repeat(80));
    const health = await Effect.runPromise(service.ping());
    console.log(`✅ Status: ${health.status}`);
    console.log(`📅 Timestamp: ${health.timestamp}`);

    // 2. Fetch Complete Snapshot with REAL data
    console.log("\n2️⃣  Fetching Complete Snapshot");
    console.log("─".repeat(80));
    
    const snapshot = await Effect.runPromise(
      service.getSnapshot({
        routes: [route],
        notionals: [
          "1000000",    // 1 USDC
          "10000000",   // 10 USDC
          "100000000",  // 100 USDC
          "1000000000", // 1,000 USDC
        ],
        includeWindows: ["24h", "7d", "30d"],
      })
    );

    // 3. Display Volume Data
    console.log("\n3️⃣  Volume Metrics");
    console.log("─".repeat(80));
    snapshot.volumes.forEach(vol => {
      console.log(`📊 ${vol.window}: $${vol.volumeUsd.toLocaleString()} USD`);
      if (vol.volumeUsd === 0) {
        console.log(`   ⚠️  Volume data not available (Across API limitation)`);
      }
    });

    // 4. Display Rate Quotes (REAL data from Across)
    console.log("\n4️⃣  Rate Quotes (Real-Time Prices)");
    console.log("─".repeat(80));
    snapshot.rates.forEach((rate, i) => {
      const amountInDecimal = Number(rate.amountIn) / Math.pow(10, rate.source.decimals);
      const amountOutDecimal = Number(rate.amountOut) / Math.pow(10, rate.destination.decimals);
      const feePercent = ((1 - rate.effectiveRate) * 100).toFixed(3);
      
      console.log(`\n💱 Quote ${i + 1}:`);
      console.log(`   Input:  ${amountInDecimal.toLocaleString()} ${rate.source.symbol}`);
      console.log(`   Output: ${amountOutDecimal.toLocaleString()} ${rate.destination.symbol}`);
      console.log(`   Rate:   ${rate.effectiveRate.toFixed(6)} (${feePercent}% fee)`);
      if (rate.totalFeesUsd !== null) {
        console.log(`   Fee:    $${rate.totalFeesUsd.toFixed(2)} USD`);
      }
      console.log(`   Time:   ${new Date(rate.quotedAt).toLocaleString()}`);
    });

    // 5. Display Liquidity Depth (REAL limits from Across)
    console.log("\n5️⃣  Liquidity Depth (Real Limits)");
    console.log("─".repeat(80));
    snapshot.liquidity.forEach(liq => {
      console.log(`\n🌊 Route: ${liq.route.source.symbol} → ${liq.route.destination.symbol}`);
      
      liq.thresholds.forEach(threshold => {
        const maxAmountDecimal = Number(threshold.maxAmountIn) / Math.pow(10, liq.route.source.decimals);
        const slippagePercent = (threshold.slippageBps / 100).toFixed(2);
        
        console.log(`   • Max ${maxAmountDecimal.toLocaleString()} ${liq.route.source.symbol} @ ${slippagePercent}% slippage`);
      });
      
      console.log(`   📅 Measured: ${new Date(liq.measuredAt).toLocaleString()}`);
    });

    // 6. Display Available Assets (REAL assets from Across)
    console.log("\n6️⃣  Available Assets");
    console.log("─".repeat(80));
    console.log(`Total Assets: ${snapshot.listedAssets.assets.length}\n`);
    
    // Group by chain
    const assetsByChain = new Map<string, typeof snapshot.listedAssets.assets>();
    snapshot.listedAssets.assets.forEach(asset => {
      const chain = asset.chainId;
      if (!assetsByChain.has(chain)) {
        assetsByChain.set(chain, []);
      }
      assetsByChain.get(chain)!.push(asset);
    });

    const chainNames: Record<string, string> = {
      "1": "Ethereum",
      "10": "Optimism",
      "137": "Polygon",
      "324": "zkSync Era",
      "8453": "Base",
      "42161": "Arbitrum",
      "43114": "Avalanche",
      "56": "BSC",
    };

    for (const [chainId, assets] of assetsByChain) {
      const chainName = chainNames[chainId] || `Chain ${chainId}`;
      console.log(`\n🔗 ${chainName} (${assets.length} assets):`);
      assets.slice(0, 10).forEach(asset => { // Show first 10
        console.log(`   • ${asset.symbol} (${asset.decimals} decimals) - ${asset.assetId.slice(0, 10)}...`);
      });
      if (assets.length > 10) {
        console.log(`   ... and ${assets.length - 10} more`);
      }
    }

    // Summary
    console.log("\n" + "═".repeat(80));
    console.log("\n✅ SUCCESS: All data fetched from REAL Across API");
    console.log(`\n📊 Summary:`);
    console.log(`   • ${snapshot.rates.length} real-time rate quotes`);
    console.log(`   • ${snapshot.liquidity.length} liquidity depth measurements`);
    console.log(`   • ${snapshot.listedAssets.assets.length} available assets`);
    console.log(`   • Data from ${assetsByChain.size} different blockchains`);
    console.log("\n" + "═".repeat(80));

  } catch (error) {
    console.error("\n❌ Error fetching real data:");
    console.error(error);
    process.exit(1);
  }
}

// Run the example
main();

