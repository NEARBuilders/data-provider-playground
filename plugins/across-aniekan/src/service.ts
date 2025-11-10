import { Effect } from "every-plugin/effect";
import type { z } from "every-plugin/zod";
import axios, { AxiosInstance } from "axios";
import axiosRetry from "axios-retry";
import Bottleneck from "bottleneck";

// Import types from contract
import type {
  Asset,
  Rate,
  LiquidityDepth,
  VolumeWindow,
  ListedAssets,
  ProviderSnapshot
} from "./contract";

// Infer the types from the schemas
type AssetType = z.infer<typeof Asset>;
type RateType = z.infer<typeof Rate>;
type LiquidityDepthType = z.infer<typeof LiquidityDepth>;
type VolumeWindowType = z.infer<typeof VolumeWindow>;
type ListedAssetsType = z.infer<typeof ListedAssets>;
type ProviderSnapshotType = z.infer<typeof ProviderSnapshot>;

// Across API types
interface AcrossRoute {
  originChainId: number;
  originToken: string;
  destinationChainId: number;
  destinationToken: string;
  originTokenSymbol: string;
  destinationTokenSymbol: string;
  isNative: boolean;
}

interface AcrossFeeResponse {
  totalRelayFee: {
    pct: string;
    total: string;
  };
  relayerCapitalFee: {
    pct: string;
    total: string;
  };
  relayerGasFee: {
    pct: string;
    total: string;
  };
  timestamp: string;
  isAmountTooLow: boolean;
  estimatedFillTimeSec: number;
}

export class DataProviderService {
  private client: AxiosInstance;
  private rateLimiter: Bottleneck;
  private routesCache: AcrossRoute[] | null = null;
  private routesCacheTime: number = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string,
    private readonly timeout: number
  ) {
    // Initialize HTTP client with retry logic
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: this.timeout,
      headers: this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {},
    });

    // Add exponential backoff retry logic
    axiosRetry(this.client, {
      retries: 3,
      retryDelay: axiosRetry.exponentialDelay,
      retryCondition: (error) => {
        return (
          axiosRetry.isNetworkOrIdempotentRequestError(error) ||
          error.response?.status === 429 ||
          error.response?.status === 503
        );
      },
    });

    // Initialize rate limiter (10 requests per second default)
    this.rateLimiter = new Bottleneck({
      maxConcurrent: 5,
      minTime: 100, // 10 requests per second
    });

    console.log(`[AcrossDataProvider] Initialized with baseUrl: ${this.baseUrl}`);
  }

  getSnapshot(params: {
    routes?: Array<{ source: AssetType; destination: AssetType }>;
    notionals?: string[];
    includeWindows?: Array<"24h" | "7d" | "30d">;
  }) {
    return Effect.tryPromise({
      try: async () => {
        const hasRoutes = params.routes && params.routes.length > 0;
        const hasNotionals = params.notionals && params.notionals.length > 0;

        console.log(`[AcrossDataProvider] Fetching snapshot for ${params.routes?.length || 0} routes`);

        // Fetch all data in parallel
        const [volumes, rates, liquidity, listedAssets] = await Promise.all([
          this.getVolumes(params.includeWindows || ["24h"]),
          hasRoutes && hasNotionals ? this.getRates(params.routes!, params.notionals!) : Promise.resolve([]),
          hasRoutes && hasNotionals ? this.getLiquidityDepth(params.routes!, params.notionals!) : Promise.resolve([]),
          this.getListedAssets()
        ]);

        console.log(`[AcrossDataProvider] Snapshot complete: ${rates.length} rates, ${liquidity.length} liquidity points`);

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

  private async getVolumes(windows: Array<"24h" | "7d" | "30d">): Promise<VolumeWindowType[]> {
    console.log(`[AcrossDataProvider] Fetching volumes for windows: ${windows.join(", ")}`);

  
    const volumes: VolumeWindowType[] = windows.map(window => ({
      window,
      volumeUsd: 0, 
      measuredAt: new Date().toISOString(),
    }));

    return volumes;
  }

  private async getRates(
    routes: Array<{ source: AssetType; destination: AssetType }>,
    notionals: string[]
  ): Promise<RateType[]> {
    console.log(`[AcrossDataProvider] Fetching rates for ${routes.length} routes x ${notionals.length} notionals`);

    const rates: RateType[] = [];

    for (const route of routes) {
      for (const notional of notionals) {
        try {
          const feeData = await this.rateLimiter.schedule(() =>
            this.getSuggestedFees({
              originChainId: parseInt(route.source.chainId),
              destinationChainId: parseInt(route.destination.chainId),
              token: route.source.assetId,
              amount: notional,
            })
          );

          // Calculate amount out (amount - fees)
          const amountInBN = BigInt(notional);
          const totalFeeBN = BigInt(feeData.totalRelayFee.total);
          const amountOut = (amountInBN - totalFeeBN).toString();

          // Calculate effective rate (normalized for decimals)
          const effectiveRate = this.calculateEffectiveRate(
            notional,
            amountOut,
            route.source.decimals,
            route.destination.decimals
          );

          rates.push({
            source: route.source,
            destination: route.destination,
            amountIn: notional,
            amountOut,
            effectiveRate,
            totalFeesUsd: null, 
            quotedAt: new Date().toISOString(),
          });

          console.log(
            `[AcrossDataProvider] Got rate: ${route.source.symbol} -> ${route.destination.symbol}, ` +
            `amount: ${notional}, effectiveRate: ${effectiveRate.toFixed(6)}`
          );
        } catch (error) {
          console.error(
            `[AcrossDataProvider] Failed to fetch rate for ${route.source.symbol} -> ${route.destination.symbol}:`,
            error instanceof Error ? error.message : String(error)
          );
        }
      }
    }

    return rates;
  }

  private async getLiquidityDepth(
    routes: Array<{ source: AssetType; destination: AssetType }>,
    testAmounts: string[]
  ): Promise<LiquidityDepthType[]> {
    console.log(`[AcrossDataProvider] Measuring liquidity depth for ${routes.length} routes`);

    const liquidity: LiquidityDepthType[] = [];

    for (const route of routes) {
      try {
        const thresholds = await this.measureSlippage(route, testAmounts);

        liquidity.push({
          route,
          thresholds,
          measuredAt: new Date().toISOString(),
        });

        console.log(
          `[AcrossDataProvider] Liquidity for ${route.source.symbol} -> ${route.destination.symbol}: ` +
          `50bps=${thresholds[0]?.maxAmountIn}, 100bps=${thresholds[1]?.maxAmountIn}`
        );
      } catch (error) {
        console.error(
          `[AcrossDataProvider] Failed to measure liquidity for ${route.source.symbol} -> ${route.destination.symbol}:`,
          error instanceof Error ? error.message : String(error)
        );
      }
    }

    return liquidity;
  }

 
  private async measureSlippage(
    route: { source: AssetType; destination: AssetType },
    testAmounts: string[]
  ) {
    // Get baseline rate with smallest amount
    const baselineAmount = testAmounts[0];
    const baselineQuote = await this.rateLimiter.schedule(() =>
      this.getSuggestedFees({
        originChainId: parseInt(route.source.chainId),
        destinationChainId: parseInt(route.destination.chainId),
        token: route.source.assetId,
        amount: baselineAmount,
      })
    );

    const baselineFeePct = parseFloat(baselineQuote.totalRelayFee.pct);

    // Find amounts that meet slippage thresholds
    let threshold50: string = testAmounts[0];
    let threshold100: string = testAmounts[0];

    for (const amount of testAmounts) {
      try {
        const quote = await this.rateLimiter.schedule(() =>
          this.getSuggestedFees({
            originChainId: parseInt(route.source.chainId),
            destinationChainId: parseInt(route.destination.chainId),
            token: route.source.assetId,
            amount,
          })
        );

        const currentFeePct = parseFloat(quote.totalRelayFee.pct);
        const slippageBps = Math.abs((currentFeePct - baselineFeePct) * 10000);

        if (slippageBps <= 50) {
          threshold50 = amount;
        }
        if (slippageBps <= 100) {
          threshold100 = amount;
        }
      } catch (error) {
        console.error(`[AcrossDataProvider] Failed to test amount ${amount}:`, error);
        break;
      }
    }

    return [
      { maxAmountIn: threshold50, slippageBps: 50 },
      { maxAmountIn: threshold100, slippageBps: 100 },
    ];
  }

  
  private async getListedAssets(): Promise<ListedAssetsType> {
    console.log(`[AcrossDataProvider] Fetching available assets`);

    const routes = await this.getAvailableRoutes();

    // Extract unique assets from routes
    const assetsMap = new Map<string, AssetType>();

    for (const route of routes) {
      // Add source asset
      const sourceKey = `${route.originChainId}-${route.originToken}`;
      if (!assetsMap.has(sourceKey)) {
        assetsMap.set(sourceKey, {
          chainId: route.originChainId.toString(),
          assetId: route.originToken,
          symbol: route.originTokenSymbol,
          decimals: this.getTokenDecimals(route.originTokenSymbol),
        });
      }

      // Add destination asset
      const destKey = `${route.destinationChainId}-${route.destinationToken}`;
      if (!assetsMap.has(destKey)) {
        assetsMap.set(destKey, {
          chainId: route.destinationChainId.toString(),
          assetId: route.destinationToken,
          symbol: route.destinationTokenSymbol,
          decimals: this.getTokenDecimals(route.destinationTokenSymbol),
        });
      }
    }

    const assets = Array.from(assetsMap.values());
    console.log(`[AcrossDataProvider] Found ${assets.length} unique assets`);

    return {
      assets,
      measuredAt: new Date().toISOString(),
    };
  }

  
  private async getAvailableRoutes(): Promise<AcrossRoute[]> {
    const now = Date.now();
    if (this.routesCache && now - this.routesCacheTime < this.CACHE_TTL) {
      console.log(`[AcrossDataProvider] Using cached routes`);
      return this.routesCache;
    }

    console.log(`[AcrossDataProvider] Fetching fresh routes from API`);
    const response = await this.rateLimiter.schedule(() =>
      this.client.get<AcrossRoute[]>("/available-routes")
    );

    this.routesCache = response.data;
    this.routesCacheTime = now;

    console.log(`[AcrossDataProvider] Cached ${response.data.length} routes`);
    return response.data;
  }

  private async getSuggestedFees(params: {
    originChainId: number;
    destinationChainId: number;
    token: string;
    amount: string;
  }): Promise<AcrossFeeResponse> {
    const response = await this.client.get<AcrossFeeResponse>("/suggested-fees", {
      params,
    });
    return response.data;
  }

  private calculateEffectiveRate(
    amountIn: string,
    amountOut: string,
    sourceDecimals: number,
    destDecimals: number
  ): number {
    const amountInNormalized = Number(amountIn) / Math.pow(10, sourceDecimals);
    const amountOutNormalized = Number(amountOut) / Math.pow(10, destDecimals);

    if (amountInNormalized === 0) return 0;
    return amountOutNormalized / amountInNormalized;
  }

  private getTokenDecimals(symbol: string): number {
    const decimals: Record<string, number> = {
      USDC: 6,
      "USDC.e": 6,
      USDT: 6,
      WETH: 18,
      ETH: 18,
      WBTC: 8,
      DAI: 18,
      UMA: 18,
      BAL: 18,
      ACX: 18,
      POOL: 18,
    };
    return decimals[symbol] || 18;
  }

  ping() {
    return Effect.tryPromise({
      try: async () => {
        console.log(`[AcrossDataProvider] Pinging API`);
        await this.rateLimiter.schedule(() =>
          this.client.get("/available-routes")
        );
        return {
          status: "ok" as const,
          timestamp: new Date().toISOString(),
        };
      },
      catch: (error: unknown) =>
        new Error(`Health check failed: ${error instanceof Error ? error.message : String(error)}`)
    });
  }
}
