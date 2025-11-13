import type {
  LiquidityDepthType,
  RateType,
  RouteType,
  TimeWindow,
  VolumeWindowType,
  SnapshotType
} from '@data-provider/shared-contract';

/**
 * Base service class that all data provider plugins should extend.
 * Provides type-safe interfaces for provider-specific operations.
 */
export abstract class DataProviderService<TProviderAsset> {
  /**
   * Get volume metrics for the specified time windows.
   */
  abstract getVolumes(windows: TimeWindow[]): Promise<VolumeWindowType[]>;

  /**
   * Get list of assets supported by this provider.
   */
  abstract getListedAssets(): Promise<TProviderAsset[]>;

  /**
   * Get rate quotes for route/notional combinations.
   */
  abstract getRates(
    routes: RouteType<TProviderAsset>[],
    notionals: string[]
  ): Promise<RateType<TProviderAsset>[]>;

  /**
   * Get liquidity depth information for routes.
   */
  abstract getLiquidityDepth(
    routes: RouteType<TProviderAsset>[]
  ): Promise<LiquidityDepthType<TProviderAsset>[]>;

  /**
   * Get complete snapshot of all data types.
   */
  abstract getSnapshot(params: {
    routes: RouteType<TProviderAsset>[];
    notionals?: string[];
    includeWindows?: TimeWindow[];
  }): Promise<SnapshotType<TProviderAsset>>;
}
