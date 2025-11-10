#!/usr/bin/env tsx
/**
 * TypeScript demo runner for Axelar adapter
 * Demonstrates collection of all 4 metrics: Volume, Rates, Liquidity, Assets
 */

const MOCK = process.env.MOCK_MODE === 'true';
const NOTIONAL = process.env.NOTIONAL || '1000000';
const BASE_URL = process.env.AXELAR_BASE_URL || 'https://axelarscan.io';
const TIMEOUT = Number(process.env.AXELAR_TIMEOUT || 10000);

async function runDemo() {
  try {
    console.log('🚀 Running Axelar adapter TypeScript demo...');
    console.log(`   Mode: ${MOCK ? 'MOCK (deterministic)' : 'LIVE (network calls)}'}`);
    console.log(`   Notional: ${NOTIONAL}`);
    console.log(`   Base URL: ${BASE_URL}`);
    console.log(`   Timeout: ${TIMEOUT}ms`);
    console.log('---\n');

    // Use the same JS helper used by the mJS demo; allow forcing mock via MOCK_MODE
    const lib = await import('./libDemo.mjs');
    const snapshot = await lib.buildSnapshot({
      mock: MOCK === true, // if MOCK_MODE=true then mock, otherwise live
      notional: NOTIONAL,
      base: BASE_URL,
      timeout: TIMEOUT
    });

    console.log('✅ Snapshot collected successfully!\n');
    console.log(JSON.stringify(snapshot, null, 2));
    
    // Print summary
    console.log('\n📊 Metrics Summary:');
    console.log(`   Volumes: ${snapshot.volumes.length} windows`);
    snapshot.volumes.forEach(v => {
      console.log(`     - ${v.window}: $${v.volumeUsd.toLocaleString()}`);
    });
    console.log(`   Rates: ${snapshot.rates.length} quotes`);
    snapshot.rates.forEach(r => {
      console.log(`     - ${r.source.symbol} → ${r.destination.symbol}: ${r.effectiveRate.toFixed(4)} (fee: $${r.totalFeesUsd.toFixed(2)})`);
    });
    console.log(`   Liquidity: ${snapshot.liquidity.length} routes`);
    snapshot.liquidity.forEach(l => {
      console.log(`     - Route: ${l.thresholds.length} thresholds`);
      l.thresholds.forEach(t => {
        console.log(`       • ${t.slippageBps}bps: ${t.maxAmountIn}`);
      });
    });
    console.log(`   Assets: ${snapshot.listedAssets.assets.length} listed`);
  } catch (err) {
    console.error('❌ Demo failed:', err);
    process.exit(1);
  }
}

runDemo();
