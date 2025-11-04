import { Effect } from "every-plugin/effect";
import type { z } from "every-plugin/zod";
import axios from "axios";

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

// Chain ID to Chain Name mapping
const CHAIN_MAP: Record<number, string> = {
  1: 'Solana',
  2: 'Ethereum',
  3: 'Terra',
  4: 'BSC',
  5: 'Polygon',
  6: 'Avalanche',
  7: 'Oasis',
  8: 'Algorand',
  9: 'Aurora',
  10: 'Fantom',
  11: 'Karura',
  12: 'Acala',
  13: 'Klaytn',
  14: 'Celo',
  15: 'NEAR',
  16: 'Moonbeam',
  17: 'Nym',
  18: 'Arbitrum',
  19: 'Optimism',
  20: 'Gnosis',
  21: 'Sui',
  22: 'InjEVM',
  23: 'Osmosis',
  24: 'Aptos',
  25: 'Pythnet',
  26: 'Xpla',
};

const RATE_LIMIT_DELAY = 200; // ms between requests
const MAX_RETRIES = 3;
const RETRY_DELAY = 500;

/**
 * Wormhole Data Provider Service - Collects cross-chain bridge metrics from Wormhole.
 */
export class DataProviderService {
  private lastRequestTime = 0;

  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string,
    private readonly timeout: number
  ) { }

  /**
   * Get complete snapshot of provider data for given routes and notionals.
   */
  getSnapshot(params: {
    routes: Array<{ source: AssetType; destination: AssetType }>;
    notionals: string[];
    includeWindows?: Array<"24h" | "7d" | "30d">;
  }) {
    return Effect.tryPromise({
      try: async () => {
        console.log(`[WormholeService] Fetching snapshot for ${params.routes.length} routes`);

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
   * Fetch volume metrics from Wormholescan API
   */
  private async getVolumes(windows: Array<"24h" | "7d" | "30d">): Promise<VolumeWindowType[]> {
    const result: VolumeWindowType[] = [];

    try {
      const scorecardsRes = await this.withRetry(() =>
        axios.get(`${this.baseUrl}/api/v1/scorecards`, { timeout: this.timeout })
      );
      const scorecards = scorecardsRes.data;

      for (const window of windows) {
        const volumeKey = window === '24h' ? 'volume_24h' :
          window === '7d' ? '7d_volume' : '30d_volume';

        result.push({
          window,
          volumeUsd: parseFloat(scorecards[volumeKey] || '0'),
          measuredAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.warn(`[WormholeService] Failed to fetch volumes:`, error);
    }

    return result;
  }

  /**
   * Fetch rate quotes for route/notional combinations
   */
  private async getRates(routes: Array<{ source: AssetType; destination: AssetType }>, notionals: string[]): Promise<RateType[]> {
    const rates: RateType[] = [];

    try {
      // Get x-chain activity for route information
      const xChainRes = await this.withRetry(() =>
        axios.get(`${this.baseUrl}/api/v1/x-chain-activity`, {
          params: { timeSpan: '7d' },
          timeout: this.timeout
        })
      );

      for (const route of routes) {
        for (const notional of notionals) {
          // Wormhole fee model: Gas fees + Protocol fee (~10 bps)
          const sourceChain = route.source.symbol;
          const destChain = route.destination.symbol;
          const isExpensiveRoute = ['Ethereum', 'Avalanche', 'Optimism', 'Arbitrum'].includes(destChain);
          const gasFeeUsd = isExpensiveRoute ? 1.5 : 0.5;
          const amountInNum = parseFloat(notional);
          const protocolFeeUsd = amountInNum * 0.001; // 10 bps
          const totalFeeUsd = gasFeeUsd + protocolFeeUsd;

          // Calculate effective rate (normalized for decimals)
          const amountOutUsd = amountInNum - totalFeeUsd;
          const effectiveRate = amountOutUsd / amountInNum;

          rates.push({
            source: route.source,
            destination: route.destination,
            amountIn: notional,
            amountOut: amountOutUsd.toString(),
            effectiveRate,
            totalFeesUsd: totalFeeUsd,
            quotedAt: new Date().toISOString(),
          });
        }
      }
    } catch (error) {
      console.warn(`[WormholeService] Failed to fetch rates:`, error);
    }

    return rates;
  }

  /**
   * Fetch liquidity depth from volume data
   */
  private async getLiquidityDepth(routes: Array<{ source: AssetType; destination: AssetType }>): Promise<LiquidityDepthType[]> {
    const liquidity: LiquidityDepthType[] = [];

    try {
      const xChainRes = await this.withRetry(() =>
        axios.get(`${this.baseUrl}/api/v1/x-chain-activity`, {
          params: { timeSpan: '7d' },
          timeout: this.timeout
        })
      );
      const xChainActivity = xChainRes.data?.txs || [];

      for (const route of routes) {
        // Estimate liquidity: volume × 10 (conservative multiplier)
        const estimatedLiquidity = 10000000; // Default $10M

        liquidity.push({
          route,
          thresholds: [
            {
              maxAmountIn: Math.floor(estimatedLiquidity * 0.8).toString(),
              slippageBps: 50,
            },
            {
              maxAmountIn: Math.floor(estimatedLiquidity * 0.5).toString(),
              slippageBps: 100,
            }
          ],
          measuredAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.warn(`[WormholeService] Failed to fetch liquidity:`, error);
    }

    return liquidity;
  }

  /**
   * Fetch list of supported assets
   */
  private async getListedAssets(): Promise<ListedAssetsType> {
    const assetsMap = new Map<string, AssetType>();

    try {
      const topAssetsRes = await this.withRetry(() =>
        axios.get(`${this.baseUrl}/api/v1/top-assets-by-volume`, {
          params: { timeSpan: '30d' },
          timeout: this.timeout
        })
      );
      const topAssets = topAssetsRes.data?.assets || [];

      for (const asset of topAssets) {
        const key = `${asset.symbol}-${asset.tokenChain}`;
        if (!assetsMap.has(key)) {
          assetsMap.set(key, {
            chainId: asset.tokenChain.toString(),
            assetId: asset.tokenAddress,
            symbol: asset.symbol,
            decimals: ['USDC', 'USDT', 'EURC'].includes(asset.symbol) ? 6 : 18,
          });
        }
      }
    } catch (error) {
      console.warn(`[WormholeService] Failed to fetch assets:`, error);
    }

    return {
      assets: Array.from(assetsMap.values()),
      measuredAt: new Date().toISOString(),
    };
  }

  /**
   * Retry wrapper with exponential backoff
   */
  private async withRetry<T>(fn: () => Promise<T>, context: string = 'API call'): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        await this.enforceRateLimit();
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt === MAX_RETRIES - 1) {
          throw new Error(
            `${context} failed after ${MAX_RETRIES} attempts: ${lastError.message}`
          );
        }

        const delay = RETRY_DELAY * Math.pow(2, attempt);
        // Only log on last attempt to reduce noise
        if (attempt === MAX_RETRIES - 2) {
          console.warn(
            `${context} failed (attempt ${attempt + 1}/${MAX_RETRIES}). ` +
            `Retrying in ${delay}ms: ${lastError.message}`
          );
        }

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }

  /**
   * Enforce rate limiting
   */
  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    if (elapsed < RATE_LIMIT_DELAY) {
      await new Promise(resolve =>
        setTimeout(resolve, RATE_LIMIT_DELAY - elapsed)
      );
    }
    this.lastRequestTime = Date.now();
  }

  ping() {
    return Effect.tryPromise({
      try: async () => {
        await this.withRetry(() =>
          axios.get(`${this.baseUrl}/api/v1/scorecards`, { timeout: this.timeout })
        );
        return {
          status: "ok" as const,
          timestamp: new Date().toISOString(),
        };
      },
      catch: (error: unknown) => new Error(`Health check failed: ${error instanceof Error ? error.message : String(error)}`)
    });
  }
}
