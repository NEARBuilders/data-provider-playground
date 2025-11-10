#!/usr/bin/env node
import { buildSnapshot } from './libDemo.mjs';

// demo.mjs is intended for mock/demo use by default. Set MOCK_MODE=false to force live mode.
const MOCK = typeof process.env.MOCK_MODE === 'undefined' ? true : process.env.MOCK_MODE === 'true';
const NOTIONAL = process.env.NOTIONAL || '1000000';

const opts = {
  mock: MOCK,
  notional: NOTIONAL,
  base: process.env.LIFI_BASE_URL,
  timeout: Number(process.env.LIFI_TIMEOUT || 10000)
};

try {
  console.log('Running Li.Fi adapter demo...');
  console.log(`Mode: ${MOCK ? 'MOCK' : 'LIVE'}`);
  console.log(`Notional: ${NOTIONAL}`);
  console.log('---');
  
  const snapshot = await buildSnapshot(opts);
  console.log(JSON.stringify(snapshot, null, 2));
} catch (err) {
  console.error('Demo failed:', err);
  process.exit(1);
}