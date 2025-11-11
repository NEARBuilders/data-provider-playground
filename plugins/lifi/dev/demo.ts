#!/usr/bin/env tsx
// demo.ts: TypeScript runner intended for live/network demos.
// It uses the same `buildSnapshot` helper as dev/demo.mjs but forces live mode by default.

const MOCK = process.env.MOCK_MODE === 'true'; // allow override
const NOTIONAL = process.env.NOTIONAL || '1000000';
const BASE_URL = process.env.LIFI_BASE_URL || 'https://li.quest/v1';
const TIMEOUT = Number(process.env.LIFI_TIMEOUT || 10000);

async function runDemo() {
  try {
    console.log('Running Li.Fi adapter TypeScript demo...');
    console.log(`Mode: ${MOCK ? 'MOCK' : 'LIVE'}`);
    console.log(`Notional: ${NOTIONAL}`);
    console.log(`Base URL: ${BASE_URL}`);
    console.log('---');

    // Use the same JS helper used by the JS demo; allow forcing mock via MOCK_MODE
    const lib = await import('./libDemo.mjs');
    const snapshot = await lib.buildSnapshot({
      mock: MOCK === true, // if MOCK_MODE=true then mock, otherwise live
      notional: NOTIONAL,
      base: BASE_URL,
      timeout: TIMEOUT
    });

    console.log(JSON.stringify(snapshot, null, 2));
  } catch (err) {
    console.error('TypeScript demo failed:', err);
    process.exit(1);
  }
}

runDemo();