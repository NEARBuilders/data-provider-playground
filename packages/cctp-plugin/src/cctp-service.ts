import { Effect } from "every-plugin/effect";
import type { z } from "every-plugin/zod";

import type {
  Asset,
  Rate,
  LiquidityDepth,
  VolumeWindow,
  ListedAssets,
  ProviderSnapshot,
  LiquidityDepthPoint
} from "./contract";

type AssetType = z.infer<typeof Asset>;
type RateType = z.infer<typeof Rate>;
type LiquidityDepthType = z.infer<typeof LiquidityDepth>;
type VolumeWindowType = z.infer<typeof VolumeWindow>;
type ListedAssetsType = z.infer<typeof ListedAssets>;
type ProviderSnapshotType = z.infer<typeof ProviderSnapshot>;

const CCTP_CHAINS = {
  "1": { name: "ethereum", usdc: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" },
  "43114": { name: "avalanche", usdc: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E" },
  "8453": { name: "base", usdc: "0x833589fCD6eDb6E08f4c7C32D4f71b1566dA8b60" },
  "42161": { name: "arbitrum", usdc: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831" },
  "10": { name: "optimism", usdc: "0x0b2C639c533813f4Aa9D7837CAf62653d671Eeee" },
  "137": { name: "polygon", usdc: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359" },
} as const;

const USDC_DECIMALS = 6;
const RATE_LIMIT_PER_SECOND = 35;
const BLOCK_DURATION_MS = 5 * 60 * 1000;

/**
 * CCTP Data Provider Service
 * Implements data collection from Circle's Cross-Chain Transfer Protocol
 */
export class CCTPService {
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly maxRetries: number;
  private readonly initialBackoffMs: number;
  
  private requestCount: number = 0;
  private windowStart: number = Date.now();

  constructor(
    baseUrl: string,
    timeout: number,
    maxRetries: number = 3,
    initialBackoffMs: number = 1000
  ) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
    this.maxRetries = maxRetries;
    this.initialBackoffMs = initialBackoffMs;
  }

  /**
   * Get complete snapshot of CCTP data for given routes and notionals
   */
  getSnapshot(params: {
    routes: Array<{ source: AssetType; destination: AssetType }>;
    notionals: string[];
    includeWindows?: Array<"24h" | "7d" | "30d">;
  }) {
    return Effect.tryPromise({
      try: async () => {
        console.log(`[CCTPService] Fetching snapshot for ${params.routes.length} routes`);

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
        new Error(`Failed to fetch CCTP snapshot: ${error instanceof Error ? error.message : String(error)}`)
    });
  }

  /**
   * Fetch volume metrics from Celer cBridge API
   */
  private async getVolumes(windows: Array<"24h" | "7d" | "30d">): Promise<VolumeWindowType[]> {
    const volumes: VolumeWindowType[] = [];
    const now = Date.now();
    const windowSeconds = { "24h": 86400, "7d": 604800, "30d": 2592000 };

    try {
      for (const window of windows) {
        const startTime = Math.floor((now - windowSeconds[window] * 1000) / 1000);
        const endTime = Math.floor(now / 1000);

        const url = `https://cbridge-prod2.celer.app/v1/transferHistory?start_time=${startTime}&end_time=${endTime}&token=USDC`;
        
        const response = await this.makeRequestWithRetry(async () => {
          const res = await fetch(url, {
            signal: AbortSignal.timeout(this.timeout)
          });
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
          }
          return res.json();
        });

        let volumeUsd = 0;
        if (response && response.transfers && Array.isArray(response.transfers)) {
          volumeUsd = response.transfers.reduce((sum: number, transfer: any) => {
            const amount = parseFloat(transfer.amount || "0");
            return sum + amount;
          }, 0);
        }

        volumes.push({
          window,
          volumeUsd,
          measuredAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('[CCTPService] Error fetching volumes:', error);
      for (const window of windows) {
        volumes.push({
          window,
          volumeUsd: 0,
          measuredAt: new Date().toISOString(),
        });
      }
    }

    return volumes;
  }

  /**
   * Calculate rate quotes for CCTP transfers
   * 
   * CCTP uses fixed protocol fees:
   * - Standard Transfer (13-19 min): 0 bps (free)
   * - Fast Transfer (<30 sec): ~6 bps on-chain fee
   * 
   * Using 6 bps as default since most integrations use Fast Transfer
   */
  private async getRates(
    routes: Array<{ source: AssetType; destination: AssetType }>,
    notionals: string[]
  ): Promise<RateType[]> {
    const rates: RateType[] = [];
    
    // CCTP Fast Transfer fee: 6 basis points (0.06%)
    const feeBps = 6;

    for (const route of routes) {
      for (const notional of notionals) {
        const amountInBigInt = BigInt(notional);
        const feeBigInt = (amountInBigInt * BigInt(feeBps)) / BigInt(10000);
        const amountOutBigInt = amountInBigInt - feeBigInt;
        
        const effectiveRate = Number(amountOutBigInt) / Number(amountInBigInt);
        const totalFeesUsd = Number(feeBigInt) / Math.pow(10, USDC_DECIMALS);

        rates.push({
          source: route.source,
          destination: route.destination,
          amountIn: notional,
          amountOut: amountOutBigInt.toString(),
          effectiveRate,
          totalFeesUsd,
          quotedAt: new Date().toISOString(),
        });
      }
    }

    return rates;
  }

  /**
   * Fetch liquidity depth from CCTP fast burn allowance API
   * 
   * Uses working endpoint: /v2/fastBurn/USDC/allowance
   * Returns allowance in USDC (with decimals already applied)
   */
  private async getLiquidityDepth(
    routes: Array<{ source: AssetType; destination: AssetType }>
  ): Promise<LiquidityDepthType[]> {
    const liquidity: LiquidityDepthType[] = [];

    try {
      // Fetch global fast burn allowance
      const allowanceUrl = `${this.baseUrl}/v2/fastBurn/USDC/allowance`;
      
      let maxAmountUsdc = "1000000000000"; // Default 1M USDC in 6 decimals
      
      try {
        const allowanceData = await this.makeRequestWithRetry(async () => {
          const res = await fetch(allowanceUrl, {
            signal: AbortSignal.timeout(this.timeout)
          });
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
          }
          return res.json();
        });

        // allowanceData.allowance is in full USDC units (e.g., 123999.999999)
        // Convert to 6 decimals for storage
        if (allowanceData && allowanceData.allowance !== undefined) {
          const allowanceFloat = parseFloat(allowanceData.allowance.toString());
          maxAmountUsdc = (BigInt(Math.floor(allowanceFloat * 1000000))).toString();
          console.log(`[CCTPService] Fetched allowance: ${allowanceData.allowance} USDC (${maxAmountUsdc} in 6 decimals)`);
        }
      } catch (error) {
        console.error('[CCTPService] Error fetching liquidity allowance:', error);
      }

      // Apply the same allowance to all routes
      // CCTP has minimal slippage (1:1 transfers), so both thresholds use same value
      for (const route of routes) {
        const thresholds: z.infer<typeof LiquidityDepthPoint>[] = [
          { maxAmountIn: maxAmountUsdc, slippageBps: 50 },
          { maxAmountIn: maxAmountUsdc, slippageBps: 100 }
        ];

        liquidity.push({
          route,
          thresholds,
          measuredAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('[CCTPService] Error fetching liquidity depth:', error);
    }

    return liquidity;
  }

  /**
   * Get list of USDC assets on all CCTP-supported chains
   */
  private async getListedAssets(): Promise<ListedAssetsType> {
    const assets: AssetType[] = Object.entries(CCTP_CHAINS).map(([chainId, info]) => ({
      chainId,
      assetId: info.usdc,
      symbol: "USDC",
      decimals: USDC_DECIMALS,
    }));

    return {
      assets,
      measuredAt: new Date().toISOString(),
    };
  }



  /**
   * Enforce rate limiting (35 req/sec max)
   */
  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.windowStart;

    if (elapsed >= 1000) {
      this.requestCount = 0;
      this.windowStart = now;
      return;
    }

    if (this.requestCount >= RATE_LIMIT_PER_SECOND) {
      const waitTime = 1000 - elapsed;
      await new Promise(resolve => setTimeout(resolve, waitTime));
      this.requestCount = 0;
      this.windowStart = Date.now();
    }
  }

  /**
   * Make HTTP request with rate limiting and exponential backoff retry
   */
  private async makeRequestWithRetry<T>(
    fn: () => Promise<T>,
    retries: number = this.maxRetries
  ): Promise<T> {
    await this.enforceRateLimit();
    this.requestCount++;
    
    try {
      return await fn();
    } catch (error) {
      if (retries > 0 && this.isRetryable(error)) {
        const delay = this.initialBackoffMs * Math.pow(2, this.maxRetries - retries);
        console.log(`[CCTPService] Retrying request after ${delay}ms (${retries} retries left)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.makeRequestWithRetry(fn, retries - 1);
      }
      throw error;
    }
  }

  /**
   * Determine if error is retryable
   */
  private isRetryable(error: any): boolean {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      if (message.includes('429') || message.includes('rate limit')) return true;
      if (message.includes('503') || message.includes('service unavailable')) return true;
      if (message.includes('504') || message.includes('gateway timeout')) return true;
      if (message.includes('timeout') || message.includes('aborted')) return true;
    }
    return false;
  }

  ping() {
    return Effect.tryPromise({
      try: async () => {
        const healthUrl = `${this.baseUrl}/v1/circleUsdcConfig`;
        await fetch(healthUrl, {
          signal: AbortSignal.timeout(this.timeout)
        });
        return {
          status: "ok" as const,
          timestamp: new Date().toISOString(),
        };
      },
      catch: (error: unknown) => 
        new Error(`CCTP health check failed: ${error instanceof Error ? error.message : String(error)}`)
    });
  }
}
