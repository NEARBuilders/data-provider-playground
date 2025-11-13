import { z } from 'every-plugin/zod';

// Provider-specific schemas for Across API
export const AcrossAsset = z.object({
  chainId: z.number(),
  address: z.string(),
  symbol: z.string(),
  decimals: z.number(),
  priceUsd: z.string().optional()
});

export const AcrossRoute = z.object({
  source: AcrossAsset,
  destination: AcrossAsset
});

export type AcrossAssetType = z.infer<typeof AcrossAsset>;
export type AcrossRouteType = z.infer<typeof AcrossRoute>;

export { contract } from '@data-provider/shared-contract';
export * from '@data-provider/shared-contract';
