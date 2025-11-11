import type { z } from 'every-plugin/zod';
import {
  Asset,
  Rate,
  LiquidityDepthPoint,
  LiquidityDepth,
  VolumeWindow,
  ListedAssets,
  ProviderSnapshot,
} from './contract';

export { contract } from './contract';
export {
  Asset,
  Rate,
  LiquidityDepthPoint,
  LiquidityDepth,
  VolumeWindow,
  ListedAssets,
  ProviderSnapshot,
} from './contract';

export type AssetType = z.infer<typeof Asset>;
export type RateType = z.infer<typeof Rate>;
export type LiquidityDepthPointType = z.infer<typeof LiquidityDepthPoint>;
export type LiquidityDepthType = z.infer<typeof LiquidityDepth>;
export type VolumeWindowType = z.infer<typeof VolumeWindow>;
export type ListedAssetsType = z.infer<typeof ListedAssets>;
export type ProviderSnapshotType = z.infer<typeof ProviderSnapshot>;

export type TimeWindow = VolumeWindowType['window'];
