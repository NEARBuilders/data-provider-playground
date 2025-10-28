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
  amountIn: z.string().min(1), // in source smallest units
  amountOut: z.string().min(1), // in destination smallest units
  effectiveRate: z.number().positive().describe("amountOut/amountIn normalized for decimals"),
  totalFeesUsd: z.number().nullable(),
  quotedAt: z.string().datetime(),
}).strict();

// Liquidity depth point for a specific slippage threshold
export const LiquidityDepthPoint = z.object({
  maxAmountIn: z.string().min(1), // source units
  slippageBps: z.number().int().min(0).max(10000), // e.g., 50 = 0.5%
}).strict();

// Liquidity depth for a route at different slippage thresholds
export const LiquidityDepth = z.object({
  route: z.object({ source: Asset, destination: Asset }).strict(),
  thresholds: z.array(LiquidityDepthPoint).min(1), // include 50 and 100 bps at minimum
  measuredAt: z.string().datetime(),
}).strict();

// Volume metrics for a time window
export const VolumeWindow = z.object({
  window: z.enum(["24h", "7d", "30d"]),
  volumeUsd: z.number().nonnegative(),
  measuredAt: z.string().datetime(),
}).strict();

// Assets listed by the provider
export const ListedAssets = z.object({
  assets: z.array(Asset),
  measuredAt: z.iso.datetime(),
});

// Complete snapshot of provider data
export const ProviderSnapshot = z.object({
  volumes: z.array(VolumeWindow),
  rates: z.array(Rate),
  liquidity: z.array(LiquidityDepth),
  listedAssets: ListedAssets,
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
