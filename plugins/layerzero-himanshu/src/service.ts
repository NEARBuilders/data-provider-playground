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

// Import LayerZero/Stargate clients
import { LzScanClient } from "./client/lzScan";
import { StargateClient } from "./client/stargate";
import { RateLimiter } from "./utils/rateLimit";
import type { EnvConfig } from "./env";
import {
  computeVolume,
  calculateEffectiveRate,
  calculateTotalFees,
  findMaxAmountAtSlippage,
} from "./services";

// Infer the types from the schemas
type AssetType = z.infer<typeof Asset>;
type RateType = z.infer<typeof Rate>;
type LiquidityDepthType = z.infer<typeof LiquidityDepth>;
type VolumeWindowType = z.infer<typeof VolumeWindow>;
type ListedAssetsType = z.infer<typeof ListedAssets>;
type ProviderSnapshotType = z.infer<typeof ProviderSnapshot>;

/**
 * LayerZero/Stargate Data Provider Service
 * 
 * Implements the data provider contract using:
 * - LayerZero Scan API for volume metrics
 * - Stargate API for rates, liquidity depth, and asset listings
 */
export class DataProviderService {
  private readonly lzScanClient: LzScanClient;
  private readonly stargateClient: StargateClient;

  constructor(config: EnvConfig) {
    // Initialize rate limiters
    const lzRateLimiter = new RateLimiter(config.RATE_LIMIT_RPS_LZ);
    const stgRateLimiter = new RateLimiter(config.RATE_LIMIT_RPS_STG);

    // Initialize API clients
    this.lzScanClient = new LzScanClient(
      config.LZ_SCAN_BASE_URL,
      lzRateLimiter,
      config.HTTP_TIMEOUT_MS,
      config.MAX_RETRIES
    );

    this.stargateClient = new StargateClient(
      config.STARGATE_BASE_URL,
      stgRateLimiter,
      config.HTTP_TIMEOUT_MS,
      config.MAX_RETRIES
    );
  }

  /**
   * Get complete snapshot of provider data for given routes and notionals.
   *
   * Coordinates fetching:
   * - Volume metrics from LayerZero Scan
   * - Rate quotes from Stargate for each route/notional
   * - Liquidity depth at 50bps and 100bps via binary search
   * - List of supported assets from Stargate
   */
  getSnapshot(params: {
    routes: Array<{ source: AssetType; destination: AssetType }>;
    notionals: string[];
    includeWindows?: Array<"24h" | "7d" | "30d">;
  }) {
    return Effect.tryPromise({
      try: async () => {
        console.log(`[LayerZero] Fetching snapshot for ${params.routes.length} routes`);

        // Fetch all data in parallel
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
   * Fetch volume metrics from LayerZero Scan
   * Sums message values across the time window
   */
  private async getVolumes(windows: Array<"24h" | "7d" | "30d">): Promise<VolumeWindowType[]> {
    const now = Date.now();
    const windowMs = {
      "24h": 24 * 60 * 60 * 1000,
      "7d": 7 * 24 * 60 * 60 * 1000,
      "30d": 30 * 24 * 60 * 60 * 1000,
    };

    const volumes = await Promise.all(
      windows.map(async (window) => {
        const start = now - windowMs[window];
        const end = now;

        const volumeData = await computeVolume(this.lzScanClient, { start, end });
        
        // Convert raw native units to USD estimate
        // Note: source.tx.value represents native gas fees, not transfer amounts
        // This is a limitation of the LayerZero Scan API
        const volumeUsd = Number(volumeData.raw) / 1e18 * 2000; // Assume ~$2000 per ETH

        return {
          window,
          volumeUsd,
          measuredAt: new Date().toISOString(),
        };
      })
    );

    return volumes;
  }

  /**
   * Fetch rate quotes from Stargate for all route/notional combinations
   */
  private async getRates(routes: Array<{ source: AssetType; destination: AssetType }>, notionals: string[]): Promise<RateType[]> {
    const rates: RateType[] = [];

    // Dummy addresses for quotes (Stargate requires addresses)
    const dummyAddress = "0x0000000000000000000000000000000000000001";

    for (const route of routes) {
      for (const notional of notionals) {
        // Map chainId to chainKey (simplified - in production, use proper mapping)
        const srcChainKey = this.getChainKey(route.source.chainId);
        const dstChainKey = this.getChainKey(route.destination.chainId);

        const quote = await this.stargateClient.getQuote({
          srcToken: route.source.assetId,
          dstToken: route.destination.assetId,
          srcChainKey,
          dstChainKey,
          srcAddress: dummyAddress,
          dstAddress: dummyAddress,
          srcAmount: notional,
          dstAmountMin: "0",
        });

        const effectiveRate = calculateEffectiveRate(
          quote.srcAmount,
          quote.dstAmount,
          route.source.decimals,
          route.destination.decimals
        );

        const totalFeesUsd = calculateTotalFees(
          quote,
          quote.srcAmount,
          route.source.decimals,
          1.0 // Assume stablecoin
        );

        rates.push({
          source: route.source,
          destination: route.destination,
          amountIn: quote.srcAmount,
          amountOut: quote.dstAmount,
          effectiveRate,
          totalFeesUsd,
          quotedAt: new Date().toISOString(),
        });
      }
    }

    return rates;
  }

  /**
   * Fetch liquidity depth using binary search on Stargate quotes
   * Finds max amount at 50bps and 100bps slippage thresholds
   */
  private async getLiquidityDepth(routes: Array<{ source: AssetType; destination: AssetType }>): Promise<LiquidityDepthType[]> {
    const liquidity: LiquidityDepthType[] = [];
    const dummyAddress = "0x0000000000000000000000000000000000000001";

    for (const route of routes) {
      const srcChainKey = this.getChainKey(route.source.chainId);
      const dstChainKey = this.getChainKey(route.destination.chainId);

      // Find max amounts at both thresholds in parallel
      const [threshold50, threshold100] = await Promise.all([
        findMaxAmountAtSlippage(this.stargateClient, {
          srcToken: route.source.assetId,
          dstToken: route.destination.assetId,
          srcChainKey,
          dstChainKey,
          srcAddress: dummyAddress,
          dstAddress: dummyAddress,
          srcDecimals: route.source.decimals,
          dstDecimals: route.destination.decimals,
          targetBps: 50,
        }),
        findMaxAmountAtSlippage(this.stargateClient, {
          srcToken: route.source.assetId,
          dstToken: route.destination.assetId,
          srcChainKey,
          dstChainKey,
          srcAddress: dummyAddress,
          dstAddress: dummyAddress,
          srcDecimals: route.source.decimals,
          dstDecimals: route.destination.decimals,
          targetBps: 100,
        }),
      ]);

      liquidity.push({
        route,
        thresholds: [
          {
            maxAmountIn: threshold50.maxSrcAmount,
            slippageBps: 50,
          },
          {
            maxAmountIn: threshold100.maxSrcAmount,
            slippageBps: 100,
          },
        ],
        measuredAt: new Date().toISOString(),
      });
    }

    return liquidity;
  }

  /**
   * Fetch list of assets from Stargate API
   */
  private async getListedAssets(): Promise<ListedAssetsType> {
    const [tokens, chains] = await Promise.all([
      this.stargateClient.getTokens(),
      this.stargateClient.getChains(),
    ]);

    // Create chain key to chain ID mapping
    const chainKeyToId = new Map(
      chains.map((chain) => [chain.chainKey, chain.chainId.toString()])
    );

    // Convert Stargate tokens to Asset format
    const assets: AssetType[] = tokens.map((token) => ({
      chainId: chainKeyToId.get(token.chainKey) || token.chainKey,
      assetId: token.address,
      symbol: token.symbol,
      decimals: token.decimals,
    }));

    return {
      assets,
      measuredAt: new Date().toISOString(),
    };
  }

  /**
   * Map chain ID to Stargate chain key
   * Simplified mapping - in production, use comprehensive chain registry
   */
  private getChainKey(chainId: string): string {
    const mapping: Record<string, string> = {
      "1": "ethereum",
      "137": "polygon",
      "42161": "arbitrum",
      "10": "optimism",
      "56": "bsc",
      "43114": "avalanche",
      "8453": "base",
    };
    return mapping[chainId] || chainId;
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
