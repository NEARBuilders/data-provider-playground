import { DataProviderService as BaseDataProviderService } from "@data-provider/plugin-utils";
import { ProviderApiClient } from "./client";
import type {
  LiquidityDepthType,
  ProviderAssetType,
  RateType,
  RouteType,
  SnapshotType,
  TimeWindow,
  VolumeWindowType
} from "./contract";

/**
 * Service Layer for Data Provider Business Logic
 *
 * This layer implements the core business logic for interacting with data provider APIs.
 * Key characteristics:
 * - Works exclusively in provider-specific format (ProviderAssetType, ProviderRouteType)
 * - No knowledge of NEAR Intents format - that's handled by the router layer
 * - Each method maps directly to a provider API endpoint
 * - Returns standardized internal types with generic provider asset types
 *
 * Architecture Flow:
 * Client Input (NEAR Intents) → Router (transformRoute) → Service (Provider format) → API Response
 * API Response → Service (standardize) → Router (transformAsset) → Client Output (NEAR Intents)
 */
export class DataProviderService extends BaseDataProviderService<ProviderAssetType> {
  constructor(private readonly client: ProviderApiClient) {
    super();
  }

  /**
   * Fetch volume metrics for specified time windows.
   */
  async getVolumes(windows: TimeWindow[]): Promise<VolumeWindowType[]> {
    const response = await this.client.fetchVolumes(windows);
    return response.volumes.map(volume => ({
      window: volume.window as TimeWindow,
      volumeUsd: volume.volumeUsd,
      measuredAt: volume.measuredAt
    }));
  }

  /**
   * Fetch list of assets supported by the provider.
   */
  async getListedAssets(): Promise<ProviderAssetType[]> {
    const response = await this.client.fetchAssets();
    return response.assets.map(asset => ({
      chainId: asset.chainId,
      address: asset.address,
      symbol: asset.symbol,
      decimals: asset.decimals
    }));
  }

  /**
   * Fetch rate quotes for route/notional combinations.
   * TODO: Implement provider's quote API endpoint
   */
  async getRates(routes: RouteType<ProviderAssetType>[], notionals: string[]): Promise<RateType<ProviderAssetType>[]> {
    return [];
  }

  /**
   * Fetch liquidity depth at 50bps and 100bps thresholds.
   * TODO: Implement provider's liquidity API or simulate with quotes
   */
  async getLiquidityDepth(routes: RouteType<ProviderAssetType>[]): Promise<LiquidityDepthType<ProviderAssetType>[]> {
    return [];
  }

  /**
 * Get complete snapshot of provider data for given provider-formatted routes and notionals.
 * This is a coordinator method that calls the individual methods.
 * Returns provider format - transformation to NEAR Intents happens in router layer.
 */
  async getSnapshot(params: {
    routes: RouteType<ProviderAssetType>[];
    notionals?: string[];
    includeWindows?: TimeWindow[];
  }): Promise<SnapshotType<ProviderAssetType>> {
    const [volumes, listedAssets, rates, liquidity] = await Promise.all([
      this.getVolumes(params.includeWindows || ["24h"]),
      this.getListedAssets(),
      params.notionals ? this.getRates(params.routes, params.notionals) : Promise.resolve([]),
      this.getLiquidityDepth(params.routes)
    ]);

    return {
      volumes,
      listedAssets: {
        assets: listedAssets,
        measuredAt: new Date().toISOString()
      },
      ...(rates.length > 0 && { rates }),
      ...(liquidity.length > 0 && { liquidity }),
    };
  }
}
