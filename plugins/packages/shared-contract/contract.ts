import { CommonPluginErrors } from "every-plugin";
import { oc } from "every-plugin/orpc";
import { z } from "every-plugin/zod";

// --- Schemas ---

export const Asset = z.object({
  chainId: z.string(),
  assetId: z.string(),
  symbol: z.string(),
  decimals: z.number().int().min(0),
});

export const Rate = z.object({
  source: Asset,
  destination: Asset,
  amountIn: z.string(),
  amountOut: z.string(),
  effectiveRate: z.number().describe("amountOut/amountIn normalized for decimals"),
  totalFeesUsd: z.number().nullable(),
  quotedAt: z.iso.datetime(),
});

export const LiquidityDepthPoint = z.object({
  maxAmountIn: z.string(),
  slippageBps: z.number(),
});

export const LiquidityDepth = z.object({
  route: z.object({ source: Asset, destination: Asset }),
  thresholds: z.array(LiquidityDepthPoint),
  measuredAt: z.iso.datetime(),
});

export const VolumeWindow = z.object({
  window: z.enum(["24h", "7d", "30d"]),
  volumeUsd: z.number(),
  measuredAt: z.iso.datetime(),
});

export const ListedAssets = z.object({
  assets: z.array(Asset),
  measuredAt: z.iso.datetime(),
});

export const ProviderSnapshot = z.object({
  volumes: z.array(VolumeWindow),
  listedAssets: ListedAssets,
  rates: z.array(Rate).optional(),
  liquidity: z.array(LiquidityDepth).optional(),
});

// --- Contract ---

export const contract = oc.router({
  getSnapshot: oc
    .route({ method: "POST", path: "/snapshot" })
    .input(z.object({
      routes: z.array(z.object({ source: Asset, destination: Asset })).optional(),
      notionals: z.array(z.string()).optional(),
      includeWindows: z.array(z.enum(["24h", "7d", "30d"]))
        .default(["24h"]).optional(),
    }))
    .output(ProviderSnapshot)
    .errors(CommonPluginErrors),

  ping: oc
    .route({ method: 'GET', path: '/ping' })
    .output(z.object({
      status: z.literal('ok'),
      timestamp: z.string().datetime(),
    }))
    .errors(CommonPluginErrors),
});
