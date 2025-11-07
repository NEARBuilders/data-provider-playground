import Decimal from "decimal.js";
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

interface LiFiTransfer {
  receiving: {
    amount: string;
    amountUSD?: string;
    token: {
      address: string;
      chainId: number;
      symbol: string;
    };
  };
  tool: string;
  status: string;
  timestamp: number;
}

interface LiFiTransfersResponse {
  data?: LiFiTransfer[];
  transfers?: LiFiTransfer[];
  hasNext?: boolean;
  next?: string;
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
  // Simple in-memory cache for volumes (1 hour TTL - reduce API calls)
  private volumeCache: Map<string, { data: VolumeWindowType[]; timestamp: number }> = new Map();
  private readonly VOLUME_CACHE_TTL = 60 * 60 * 1000; // 1 hour

  constructor(
    private readonly baseUrl: string
  ) { }

  private getRetryConfig() {
    // Li.Fi uses sensible defaults for retry logic
    // Single retry with 200ms base delay for timeout-aware behavior
    const maxRetries = 1;
    const baseDelay = 200;

    return { maxRetries, baseDelay } as const;
  }

  private async fetchWithRetry<T>(url: string, options: RequestInit = {}): Promise<T> {
    const { maxRetries, baseDelay } = this.getRetryConfig();
    return HttpUtils.fetchWithRetry<T>(url, options, maxRetries, baseDelay);
  }

  private createFallbackRate(
    route: { source: AssetType; destination: AssetType },
    notional: string
  ): RateType {
    const timestamp = new Date().toISOString();

    try {
      const sourceDecimals = Number.isFinite(route.source.decimals) ? route.source.decimals : 0;
      const destinationDecimals = Number.isFinite(route.destination.decimals) ? route.destination.decimals : 0;

      const normalizedIn = new Decimal(notional).div(new Decimal(10).pow(sourceDecimals));

      if (normalizedIn.isZero()) {
        throw new Error('Fallback notional resolved to zero');
      }

      const normalizedOut = normalizedIn;
      const rawOut = normalizedOut.mul(new Decimal(10).pow(destinationDecimals));

      return {
        source: route.source,
        destination: route.destination,
        amountIn: notional,
        amountOut: rawOut.toFixed(0, Decimal.ROUND_DOWN),
        effectiveRate: normalizedOut.div(normalizedIn).toNumber(),
  totalFeesUsd: 0,
        quotedAt: timestamp,
      } satisfies RateType;
    } catch {
      return {
        source: route.source,
        destination: route.destination,
        amountIn: notional,
        amountOut: notional,
        effectiveRate: 1,
  totalFeesUsd: 0,
        quotedAt: timestamp,
      } satisfies RateType;
    }
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
    if (!params?.routes?.length || !params?.notionals?.length) {
      return Effect.fail(new Error('Routes and notionals are required'));
    }

    return Effect.tryPromise({
      try: async () => {
        try {
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
        } catch (error) {
          throw new Error(`Snapshot fetch failed: ${error instanceof Error ? error.message : String(error)}`);
        }
      },
      catch: (error: unknown) =>
        new Error(`Failed to fetch snapshot: ${error instanceof Error ? error.message : String(error)}`)
    });
  }

  /**
   * Get aggregated volume metrics for specified time windows.
   * 
   * Uses Li.Fi's GET /v2/analytics/transfers endpoint to aggregate cross-chain transfer volumes.
   * This endpoint returns actual transaction data from Li.Fi's routing records.
   * 
   * Rate limits (unauthenticated): 200 requests per 2 hours
   * Rate limits (authenticated): 200 requests per minute
   * 
   * Implementation:
   * - Queries transfers for each time window (24h, 7d, 30d)
   * - Aggregates amountUSD from all DONE transfers
   * - Handles pagination for large datasets
   * - Returns empty array on error (graceful degradation)
   * 
   * See README "Volume Metrics Implementation" section for details.
   */
  private async getVolumes(windows: Array<"24h" | "7d" | "30d">): Promise<VolumeWindowType[]> {
    if (!windows?.length) {
      return [];
    }

    // Check cache first
    const cacheKey = windows.sort().join(",");
    const cached = this.volumeCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.VOLUME_CACHE_TTL) {
      console.log(`✓ Using cached volumes for windows: ${cacheKey}`);
      return cached.data;
    }

    const volumes: VolumeWindowType[] = [];
    const now = Math.floor(Date.now() / 1000); // Unix timestamp

    // Time windows in seconds
    const windowDurations: Record<string, number> = {
      "24h": 24 * 60 * 60,
      "7d": 7 * 24 * 60 * 60,
      "30d": 30 * 24 * 60 * 60,
    };

    for (const window of windows) {
      try {
        const duration = windowDurations[window];
        if (!duration) {
          console.warn(`Unknown window: ${window}`);
          continue;
        }

        const fromTimestamp = now - duration;
        
        // Aggregate transfers for this window using V2 endpoint with pagination
        let totalVolume = new Decimal(0);
        let cursor: string | undefined = undefined;
        let hasMore = true;
        let pageCount = 0;
        const MAX_PAGES_PER_WINDOW = 8; 
        const LIMIT_PER_PAGE = 1000; 

        console.log(`[${window}] Fetching from v2 endpoint...`);

        while (hasMore && pageCount < MAX_PAGES_PER_WINDOW) {
          try {
            // Use v2 endpoint for analytics/transfers with proper pagination
            const baseAnalyticsUrl = this.baseUrl.replace('/v1', '/v2');
            const url = new URL(`${baseAnalyticsUrl}/analytics/transfers`);
            url.searchParams.set("status", "DONE");
            url.searchParams.set("fromTimestamp", String(fromTimestamp));
            url.searchParams.set("toTimestamp", String(now));
            url.searchParams.set("limit", String(LIMIT_PER_PAGE)); // Batch larger requests
            
            if (cursor) {
              url.searchParams.set("next", cursor);
            }

            const response = await this.fetchWithRetry<LiFiTransfersResponse>(url.toString());

            // Handle both v1 (transfers) and v2 (data) response formats
            const transfersList = response?.data || response?.transfers || [];
            
            if (Array.isArray(transfersList)) {
              for (const transfer of transfersList) {
                // Sum USD amounts from receiving side (destination amount in USD)
                const amount = new Decimal(transfer.receiving?.amountUSD || "0");
                totalVolume = totalVolume.plus(amount);
              }
            }

            // Check if there's another page
            hasMore = response?.hasNext === true;
            cursor = response?.next;
            pageCount++;

            console.log(`  [page ${pageCount}] ${transfersList.length} transfers, cumulative: $${totalVolume.toNumber()}`);

            // Add delay between pagination requests to respect rate limits
            if (hasMore && pageCount < MAX_PAGES_PER_WINDOW) {
              await new Promise(resolve => setTimeout(resolve, 500)); // 500ms spacing between requests
            }
          } catch (pageError) {
            console.warn(`  [page ${pageCount}] Error:`, 
              pageError instanceof Error ? pageError.message : "Unknown error");
            // If first page fails, propagate the error
            if (pageCount === 0) {
              throw pageError;
            }
            // Otherwise stop pagination and use partial data collected so far
            hasMore = false;
            console.log(`  Stopped at page ${pageCount}, using partial data`);
          }
        }

        console.log(`✓ [${window}] Volume: $${totalVolume.toNumber()} from ${pageCount} pages`);

        volumes.push({
          window,
          volumeUsd: totalVolume.toNumber(),
          measuredAt: new Date().toISOString(),
        });
      } catch (error) {
        console.error(`Failed to fetch volume for window ${window}:`, 
          error instanceof Error ? error.message : "Unknown error");
        // Return zero for this window but continue with others
        volumes.push({
          window,
          volumeUsd: 0,
          measuredAt: new Date().toISOString(),
        });
      }
    }

    // Cache the result
    this.volumeCache.set(cacheKey, { data: volumes, timestamp: Date.now() });
    return volumes;
  }

  /**
   * Fetch rate quotes from Li.Fi API
   */
  private async getRates(routes: Array<{ source: AssetType; destination: AssetType }>, notionals: string[]): Promise<RateType[]> {
    if (!routes?.length || !notionals?.length) {
      throw new Error('Routes and notionals are required for rate fetching');
    }

    const rates: RateType[] = [];

    for (const route of routes) {
      if (!route?.source || !route?.destination) {
        console.warn('Invalid route structure, skipping');
        continue;
      }

      for (const notional of notionals) {
        if (!notional || isNaN(Number(notional))) {
          console.warn(`Invalid notional ${notional}, skipping`);
          continue;
        }

        try {
          const url = new URL(`${this.baseUrl}/quote`);
          url.searchParams.set('fromChain', route.source.chainId);
          url.searchParams.set('toChain', route.destination.chainId);
          url.searchParams.set('fromToken', route.source.assetId);
          url.searchParams.set('toToken', route.destination.assetId);
          url.searchParams.set('fromAmount', notional);

          const quote = await this.fetchWithRetry<LiFiQuote>(url.toString());
          
          if (!quote?.estimate) {
            throw new Error('Invalid quote response structure');
          }

          const totalFeesUsd = DecimalUtils.sumFees(quote.estimate.feeCosts || []);
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
          console.error('Failed to get rate for route:', { error: error instanceof Error ? error.message : 'Unknown error' });
          rates.push(this.createFallbackRate(route, notional));
        }
      }
    }

    return rates;
  }



  /**
   * Probe liquidity depth using binary search for accurate thresholds
   */
  private async getLiquidityDepth(routes: Array<{ source: AssetType; destination: AssetType }>): Promise<LiquidityDepthType[]> {
    if (!routes?.length) {
      throw new Error('Routes are required for liquidity depth calculation');
    }

    const liquidity: LiquidityDepthType[] = [];

    for (const route of routes) {
      if (!route?.source || !route?.destination) {
        console.warn('Invalid route structure for liquidity probing, skipping');
        continue;
      }

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
            throw new Error(`Liquidity probing failed for ${slippageBps}bps: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }

        if (thresholds.length > 0) {
          liquidity.push({
            route,
            thresholds,
            measuredAt: new Date().toISOString(),
          });
        }
      } catch (error) {
        console.error('Failed to get liquidity for route:', { error: error instanceof Error ? error.message : 'Unknown error' });
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

      if (!tokens?.tokens || typeof tokens.tokens !== 'object') {
        throw new Error('Invalid tokens response structure');
      }

      const assets: AssetType[] = [];
      
      // Flatten tokens from all chains
      Object.entries(tokens.tokens).forEach(([chainId, chainTokens]) => {
        if (!Array.isArray(chainTokens)) {
          console.warn(`Invalid token list for chain ${chainId}`);
          return;
        }

        chainTokens.forEach(token => {
          if (!token?.address || !token?.symbol || typeof token.decimals !== 'number') {
            console.warn('Invalid token structure, skipping token');
            return;
          }

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
      throw new Error(`Failed to fetch Li.Fi tokens: ${error instanceof Error ? error.message : String(error)}`);
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
