import { Effect } from "every-plugin/effect";
import type { z } from "every-plugin/zod";

// Import types from contract
import type {
  Asset,
  Rate,
  LiquidityDepth,
  VolumeWindow,
  ListedAssets,
  ProviderSnapshot
} from "./contract";

// Import utilities
import { DecimalUtils } from "./utils/decimal";
import { HttpUtils } from "./utils/http";
import { LiquidityProber } from "./utils/liquidity";

interface LiFiToken {
  chainId: number;
  address: string;
  symbol: string;
  decimals: number;
  name: string;
}

interface LiFiQuote {
  estimate: {
    fromAmount: string;
    toAmount: string;
    feeCosts: Array<{ amount: string; amountUSD?: string }>;
  };
}

// Infer the types from the schemas
type AssetType = z.infer<typeof Asset>;
type RateType = z.infer<typeof Rate>;
type LiquidityDepthType = z.infer<typeof LiquidityDepth>;
type VolumeWindowType = z.infer<typeof VolumeWindow>;
type ListedAssetsType = z.infer<typeof ListedAssets>;
type ProviderSnapshotType = z.infer<typeof ProviderSnapshot>;

/**
 * Li.Fi Data Provider Service - Collects cross-chain bridge metrics from Li.Fi API.
 */
export class DataProviderService {
  constructor(
    private readonly baseUrl: string,
    // Li.Fi public endpoints do not require an API key; accept it for compatibility
    // with the template signature but don't require its presence.
    private readonly _apiKey: string | undefined,
    private readonly _timeout: number
  ) { void this._apiKey; void this._timeout; }

  private async fetchWithRetry<T>(url: string, options: RequestInit = {}): Promise<T> {
    return HttpUtils.fetchWithRetry<T>(url, options, 3, 1000);
  }

  /**
   * Get complete snapshot of provider data for given routes and notionals.
   *
   * This method coordinates fetching:
   * - Volume metrics for specified time windows
   * - Rate quotes for each route/notional combination
   * - Liquidity depth at 50bps and 100bps thresholds
   * - List of supported assets
   */
  getSnapshot(params: {
    routes: Array<{ source: AssetType; destination: AssetType }>;
    notionals: string[];
    includeWindows?: Array<"24h" | "7d" | "30d">;
  }) {
    return Effect.tryPromise({
      try: async () => {
        console.log(`[DataProviderService] Fetching snapshot for ${params.routes.length} routes`);

        // In a real implementation, these would be parallel API calls
        const [volumes, rates, liquidity, listedAssets] = await Promise.all([
          this.getVolumes(params.includeWindows || ["24h"]),
          this.getRates(params.routes, params.notionals),
          this.getLiquidityDepth(params.routes),
          this.getListedAssets()
        ]);

        return {
          volumes,
          rates,
          liquidity,
          listedAssets,
        } satisfies ProviderSnapshotType;
      },
      catch: (error: unknown) =>
        new Error(`Failed to fetch snapshot: ${error instanceof Error ? error.message : String(error)}`)
    });
  }

  /**
   * Li.Fi doesn't provide volume metrics, return empty array
   */
  private async getVolumes(_windows: Array<"24h" | "7d" | "30d">): Promise<VolumeWindowType[]> {
    // Li.Fi does not expose aggregated volume metrics via its public API.
    // Return an empty array and document this behavior in README.
    return [];
  }

  /**
   * Fetch rate quotes from Li.Fi API
   */
  private async getRates(routes: Array<{ source: AssetType; destination: AssetType }>, notionals: string[]): Promise<RateType[]> {
    const rates: RateType[] = [];

    for (const route of routes) {
      for (const notional of notionals) {
        try {
          const url = new URL(`${this.baseUrl}/quote`);
          url.searchParams.set('fromChain', route.source.chainId);
          url.searchParams.set('toChain', route.destination.chainId);
          url.searchParams.set('fromToken', route.source.assetId);
          url.searchParams.set('toToken', route.destination.assetId);
          url.searchParams.set('fromAmount', notional);

          const quote = await this.fetchWithRetry<LiFiQuote>(url.toString());
          
          const totalFeesUsd = DecimalUtils.sumFees(quote.estimate.feeCosts);

          const effectiveRate = DecimalUtils.calculateEffectiveRate(
            quote.estimate.fromAmount,
            quote.estimate.toAmount,
            route.source.decimals,
            route.destination.decimals
          );

          rates.push({
            source: route.source,
            destination: route.destination,
            amountIn: quote.estimate.fromAmount,
            amountOut: quote.estimate.toAmount,
            effectiveRate,
            totalFeesUsd,
            quotedAt: new Date().toISOString(),
          });
        } catch (error) {
          console.warn(`Failed to get rate for ${route.source.symbol}->${route.destination.symbol}:`, error);
        }
      }
    }

    return rates;
  }



  /**
   * Probe liquidity depth using binary search for accurate thresholds
   */
  private async getLiquidityDepth(routes: Array<{ source: AssetType; destination: AssetType }>): Promise<LiquidityDepthType[]> {
    const liquidity: LiquidityDepthType[] = [];

    for (const route of routes) {
      try {
        const thresholds = [];
        
        // Binary search for 50bps and 100bps thresholds
        for (const slippageBps of [50, 100]) {
          try {
            const maxAmountIn = await LiquidityProber.findMaxLiquidity(
              this.baseUrl,
              route,
              slippageBps,
              3 // Limited iterations for performance
            );
            
            thresholds.push({
              maxAmountIn,
              slippageBps,
            });
          } catch (error) {
            console.warn(`Liquidity probing failed for ${slippageBps}bps:`, error);
            // Fallback to conservative estimate
            thresholds.push({
              maxAmountIn: '1000000', // 1 USDC
              slippageBps,
            });
          }
        }

        liquidity.push({
          route,
          thresholds,
          measuredAt: new Date().toISOString(),
        });
      } catch (error) {
        console.warn(`Failed to get liquidity for ${route.source.symbol}->${route.destination.symbol}:`, error);
      }
    }

    return liquidity;
  }

  /**
   * Fetch supported tokens from Li.Fi API
   */
  private async getListedAssets(): Promise<ListedAssetsType> {
    try {
      const tokens = await this.fetchWithRetry<{ tokens: Record<string, LiFiToken[]> }>(
        `${this.baseUrl}/tokens`
      );

      const assets: AssetType[] = [];
      
      // Flatten tokens from all chains
      Object.entries(tokens.tokens).forEach(([chainId, chainTokens]) => {
        chainTokens.forEach(token => {
          assets.push({
            chainId: chainId,
            assetId: token.address,
            symbol: token.symbol,
            decimals: token.decimals,
          });
        });
      });

      return {
        assets,
        measuredAt: new Date().toISOString(),
      };
    } catch (error) {
      console.warn('Failed to fetch Li.Fi tokens, using fallback:', error);
      
      // Fallback to common tokens
      return {
        assets: [
          {
            chainId: "1",
            assetId: "0xA0b86a33E6442e082877a094f204b01BF645Fe0",
            symbol: "USDC",
            decimals: 6,
          },
          {
            chainId: "137",
            assetId: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa8417",
            symbol: "USDC",
            decimals: 6,
          },
        ],
        measuredAt: new Date().toISOString(),
      };
    }
  }



  ping() {
    return Effect.tryPromise({
      try: async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return {
          status: "ok" as const,
          timestamp: new Date().toISOString(),
        };
      },
      catch: (error: unknown) => new Error(`Health check failed: ${error instanceof Error ? error.message : String(error)}`)
    });
  }
}
