import { CommonPluginErrors } from "every-plugin";
import { oc } from "every-plugin/orpc";
import { z } from "every-plugin/zod";

// --- Schemas ---

// Asset represents a token/asset on a specific chain
export const Asset = z.object({
  chainId: z.string(),
  assetId: z.string(), // e.g., ERC-20 address or canonical symbol id
  symbol: z.string(),
  decimals: z.number().int().min(0),
});

// Rate represents a quote for swapping from source to destination asset
export const Rate = z.object({
  source: Asset,
  destination: Asset,
  amountIn: z.string(), // in source smallest units
  amountOut: z.string(), // in destination smallest units
  effectiveRate: z.number().describe("amountOut/amountIn normalized for decimals"),
  totalFeesUsd: z.number().nullable(),
  quotedAt: z.iso.datetime(),
});

// Liquidity depth point for a specific slippage threshold
export const LiquidityDepthPoint = z.object({
  maxAmountIn: z.string(), // source units
  slippageBps: z.number(), // e.g., 50 = 0.5%
});

// Liquidity depth for a route at different slippage thresholds
export const LiquidityDepth = z.object({
  route: z.object({ source: Asset, destination: Asset }),
  thresholds: z.array(LiquidityDepthPoint), // include 50 and 100 bps at minimum
  measuredAt: z.iso.datetime(),
});

// Volume metrics for a time window
export const VolumeWindow = z.object({
  window: z.enum(["24h", "7d", "30d"]),
  volumeUsd: z.number(),
  measuredAt: z.iso.datetime(),
});

// Assets listed by the provider
export const ListedAssets = z.object({
  assets: z.array(Asset),
  measuredAt: z.iso.datetime(),
});

// Route intelligence - advanced metrics for route quality assessment
export const RouteIntelligence = z.object({
  route: z.object({ source: Asset, destination: Asset }),
  // Maximum discovered capacity (largest successful quote)
  maxCapacityUsd: z.number().nullable(),
  // Optimal trade size range (where fees are most favorable)
  optimalRangeUsd: z.object({
    min: z.number(),
    max: z.number(),
  }).nullable(),
  // Fee efficiency score (0-100, higher = better rates at different sizes)
  feeEfficiencyScore: z.number().min(0).max(100).nullable(),
  // Price impact analysis (how rate degrades with size)
  priceImpactBps: z.object({
    at1k: z.number().nullable(),    // impact at $1k
    at10k: z.number().nullable(),   // impact at $10k
    at100k: z.number().nullable(),  // impact at $100k
  }),
  measuredAt: z.iso.datetime(),
});

// Complete snapshot of provider data
export const ProviderSnapshot = z.object({
  volumes: z.array(VolumeWindow),
  rates: z.array(Rate),
  liquidity: z.array(LiquidityDepth),
  listedAssets: ListedAssets,
  // Optional: Advanced route intelligence for power users
  routeIntelligence: z.array(RouteIntelligence).optional(),
});

// --- Contract ---

export const contract = oc.router({
  // Main endpoint - get complete snapshot for routes and notionals
  getSnapshot: oc
    .route({ method: "GET", path: "/snapshot" })
    .input(z.object({
      routes: z.array(z.object({ source: Asset, destination: Asset })).min(1),
      notionals: z.array(z.string()).min(1), // amounts in source units to quote
      includeWindows: z.array(z.enum(["24h", "7d", "30d"]))
        .default(["24h"]).optional(),
      includeIntelligence: z.boolean().default(false).optional()
        .describe("Enable advanced route intelligence analysis (capacity, price impact, fee efficiency)"),
    }))
    .output(ProviderSnapshot)
    .errors(CommonPluginErrors),

  // Health check procedure
  ping: oc
    .route({ method: 'GET', path: '/ping' })
    .output(z.object({
      status: z.literal('ok'),
      timestamp: z.string().datetime(),
    }))
    .errors(CommonPluginErrors),
});
