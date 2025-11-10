#!/usr/bin/env node
/**
 * JavaScript/Node demo library for running Axelar adapter
 * Provides buildSnapshot() for testing metrics collection
 */

import Decimal from "decimal.js";

export const DEFAULT_BASE = process.env.AXELAR_BASE_URL || "https://axelarscan.io";
export const DEFAULT_TIMEOUT = Number(process.env.AXELAR_TIMEOUT || 10000);

// Mock route for demo
const mockRoute = {
  source: {
    chainId: "1",
    assetId: "0xA0b86a33E6442e082877a094f204b01BF645Fe0",
    symbol: "USDC",
    decimals: 6,
  },
  destination: {
    chainId: "42161", // Arbitrum
    assetId: "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8",
    symbol: "USDC",
    decimals: 6,
  },
};

function timeoutPromise(ms) {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Timeout")), ms)
  );
}

async function fetchJson(url, timeout) {
  try {
    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => controller.abort(), timeout);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutHandle);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    throw e;
  }
}

export async function getVolumes(base, timeout, mock) {
  if (mock) {
    return { volumes: [10000, 45000, 100000] };
  }

  try {
    // Try to fetch from Axelarscan (best-effort)
    const res = await fetchJson(
      `${base}/api/transfers?limit=1000`,
      timeout
    );
    return res || { volumes: [10000, 45000, 100000] };
  } catch (e) {
    console.warn("Failed to fetch volumes:", e.message);
    return { volumes: [10000, 45000, 100000] };
  }
}

function calculateEffectiveRate(fromAmount, toAmount, fromDecimals, toDecimals) {
  try {
    const fromDecimal = new Decimal(fromAmount).div(
      new Decimal(10).pow(fromDecimals)
    );
    const toDecimal = new Decimal(toAmount).div(
      new Decimal(10).pow(toDecimals)
    );
    if (fromDecimal.isZero()) return 0;
    return toDecimal.div(fromDecimal).toNumber();
  } catch (e) {
    console.warn("Failed to calculate rate:", e.message);
    return 0;
  }
}

export async function buildSnapshot(opts = {}) {
  const base = opts.base || DEFAULT_BASE;
  const timeout = opts.timeout || DEFAULT_TIMEOUT;
  const mock = !!opts.mock;
  const notional = opts.notional || "1000000";

  console.log(`Building snapshot (mock=${mock}, notional=${notional})...`);

  const volumes = await getVolumes(base, timeout, mock);
  const volumesData = Array.isArray(volumes.volumes)
    ? volumes.volumes
    : [10000, 45000, 100000];

  // Test mode: deterministic rates
  const amountInNum = parseFloat(notional);
  const fee = Math.max(0.1, amountInNum * 0.001);
  const amountOut = Math.max(0, amountInNum - fee);
  const effectiveRate = calculateEffectiveRate(
    notional,
    amountOut.toString(),
    mockRoute.source.decimals,
    mockRoute.destination.decimals
  );

  const snapshot = {
    volumes: [
      { window: "24h", volumeUsd: volumesData[0] || 10000, measuredAt: new Date().toISOString() },
      { window: "7d", volumeUsd: volumesData[1] || 45000, measuredAt: new Date().toISOString() },
      { window: "30d", volumeUsd: volumesData[2] || 100000, measuredAt: new Date().toISOString() },
    ],
    rates: [
      {
        source: mockRoute.source,
        destination: mockRoute.destination,
        amountIn: notional,
        amountOut: amountOut.toString(),
        effectiveRate,
        totalFeesUsd: fee,
        quotedAt: new Date().toISOString(),
      },
    ],
    liquidity: [
      {
        route: { source: mockRoute.source, destination: mockRoute.destination },
        thresholds: [
          { slippageBps: 50, maxAmountIn: "1000" },
          { slippageBps: 100, maxAmountIn: "500" },
        ],
        measuredAt: new Date().toISOString(),
      },
    ],
    listedAssets: {
      assets: [
        {
          chainId: "1",
          assetId: "0xA0b86a33E6442e082877a094f204b01BF645Fe0",
          symbol: "USDC",
          decimals: 6,
          name: "USD Coin",
        },
        {
          chainId: "42161",
          assetId: "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8",
          symbol: "USDC",
          decimals: 6,
          name: "USD Coin",
        },
      ],
      measuredAt: new Date().toISOString(),
    },
  };

  return snapshot;
}
