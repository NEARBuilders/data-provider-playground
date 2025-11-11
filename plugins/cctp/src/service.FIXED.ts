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

// Infer the types from the schemas
type AssetType = z.infer<typeof Asset>;
type RateType = z.infer<typeof Rate>;
type LiquidityDepthType = z.infer<typeof LiquidityDepth>;
type VolumeWindowType = z.infer<typeof VolumeWindow>;
type ListedAssetsType = z.infer<typeof ListedAssets>;
type ProviderSnapshotType = z.infer<typeof ProviderSnapshot>;

/**
 * Token Bucket Rate Limiter
 * CCTP API limit: 35 requests per second
 */
class RateLimiter {
  private tokens: number;
  private lastRefill: number;

  constructor(
    private readonly maxTokens: number,
    private readonly refillRate: number // tokens per second
  ) {
    this.tokens = maxTokens;
    this.lastRefill = Date.now();
  }

  async acquire(): Promise<void> {
    this.refill();

    if (this.tokens >= 1) {
      this.tokens -= 1;
      return;
    }

    // Wait for next token
    const waitTime = (1 / this.refillRate) * 1000;
    await new Promise((resolve) => setTimeout(resolve, waitTime));
    this.tokens = 0;
  }

  private refill(): void {
    const now = Date.now();
    const timePassed = (now - this.lastRefill) / 1000;
    const tokensToAdd = timePassed * this.refillRate;

    this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }
}

/**
 * CCTP-specific API types
 */
type CCTPFeeResponse = Array<{
  finalityThreshold: number; // 1000 = Fast, 2000 = Standard
  minimumFee: number; // In basis points (1 = 0.01%)
}>;

interface CCTPAllowanceResponse {
  allowance: number; // USDC available for Fast Transfers (up to 6 decimals)
  lastUpdated: string; // ISO8601 timestamp
}

/**
 * DefiLlama Bridge Response for Volume Data
 */
interface DefiLlamaBridgeResponse {
  id: string;
  displayName: string;
  lastDailyVolume: number;
  lastWeeklyVolume: number;
  lastMonthlyVolume: number;
  currentDayVolume: number;
  dayBeforeLastVolume: number;
  weeklyVolume: number;
  monthlyVolume: number;
}

/**
 * CCTP Domain ID to Chain ID mapping
 * Source: Circle CCTP V2 documentation
 * https://developers.circle.com/cctp/cctp-supported-blockchains
 */
const CCTP_DOMAIN_MAP: Record<number, string> = {
  0: "1",      // Ethereum
  1: "43114",  // Avalanche
  2: "10",     // Optimism
  3: "42161",  // Arbitrum
  6: "8453",   // Base
  7: "137",    // Polygon PoS
  // Note: Domain 5 (Solana) and other non-EVM chains excluded for now
};

/**
 * Reverse mapping: Chain ID to CCTP Domain
 */
const CHAIN_TO_DOMAIN: Record<string, number> = Object.entries(CCTP_DOMAIN_MAP).reduce(
  (acc, [domain, chain]) => {
    acc[chain] = parseInt(domain, 10);
    return acc;
  },
  {} as Record<string, number>
);

/**
 * USDC Token Addresses by Chain ID
 * Source: Circle Official Documentation
 * https://developers.circle.com/stablecoins/usdc-contract-addresses
 * Last verified: 2025-01-XX
 *
 * NOTE: These addresses are from Circle's official documentation.
 * They are canonical and immutable (contract ownership is with Circle).
 * For production, consider implementing on-chain verification via TokenMinter contracts.
 */
const USDC_ADDRESSES_BY_CHAIN: Record<string, { address: string; decimals: number; source: string }> = {
  "1": {
    address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    decimals: 6,
    source: "Circle Official Docs - Ethereum Mainnet USDC"
  },
  "43114": {
    address: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
    decimals: 6,
    source: "Circle Official Docs - Avalanche USDC"
  },
  "10": {
    address: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
    decimals: 6,
    source: "Circle Official Docs - Optimism USDC"
  },
  "42161": {
    address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    decimals: 6,
    source: "Circle Official Docs - Arbitrum USDC"
  },
  "8453": {
    address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    decimals: 6,
    source: "Circle Official Docs - Base USDC"
  },
  "137": {
    address: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
    decimals: 6,
    source: "Circle Official Docs - Polygon PoS USDC"
  },
};

/**
 * Data Provider Service for CCTP (Circle Cross-Chain Transfer Protocol)
 *
 * CCTP is Circle's native burn-and-mint protocol for USDC cross-chain transfers.
 *
 * Key features:
 * - USDC-only transfers (native burn & mint, 1:1)
 * - Public API (no API key required)
 * - Rate limit: 35 requests/second
 * - Exponential backoff: 1s, 2s, 4s on errors
 * - Fast Transfer (confirmed, ~8-20s) vs Standard (finalized, ~15 min on Ethereum)
 */
export class DataProviderService {
  private rateLimiter: RateLimiter;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAYS = [1000, 2000, 4000]; // 1s, 2s, 4s
  private readonly DEFILLAMA_BASE_URL = "https://bridges.llama.fi";
  private readonly CCTP_BRIDGE_ID = "cctp";

  // Cache for volume data to avoid excessive API calls
  private volumeCache: { data: DefiLlamaBridgeResponse | null; fetchedAt: number } | null = null;
  private readonly VOLUME_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string, // Not used - CCTP is public
    private readonly timeout: number
  ) {
    // Rate limiting: 35 req/sec per CCTP docs
    const maxRequestsPerSecond = parseInt(
      process.env.MAX_REQUESTS_PER_SECOND || "35",
      10
    );
    this.rateLimiter = new RateLimiter(maxRequestsPerSecond, maxRequestsPerSecond);
  }

  /**
   * Get complete snapshot of CCTP data for given routes and notionals.
   */
  getSnapshot(params: {
    routes: Array<{ source: AssetType; destination: AssetType }>;
    notionals: string[];
    includeWindows?: Array<"24h" | "7d" | "30d">;
  }) {
    return Effect.tryPromise({
      try: async () => {
        console.log(`[CCTP] Fetching snapshot for ${params.routes.length} routes`);

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
   * Fetch volume metrics from DefiLlama Bridge API.
   * Circle CCTP API doesn't provide volume statistics.
   *
   * DefiLlama aggregates on-chain CCTP transfer data across all chains.
   *
   * @param windows - Time windows to fetch (24h, 7d, 30d)
   * @returns Array of volume windows with USD amounts
   */
  private async getVolumes(windows: Array<"24h" | "7d" | "30d">): Promise<VolumeWindowType[]> {
    try {
      const bridgeData = await this.fetchDefiLlamaVolumes();

      if (!bridgeData) {
        console.warn("[CCTP] No volume data available from DefiLlama");
        return [];
      }

      const volumes: VolumeWindowType[] = [];
      const now = new Date().toISOString();

      for (const window of windows) {
        let volumeUsd: number;

        switch (window) {
          case "24h":
            volumeUsd = bridgeData.lastDailyVolume || 0;
            break;
          case "7d":
            volumeUsd = bridgeData.lastWeeklyVolume || 0;
            break;
          case "30d":
            volumeUsd = bridgeData.lastMonthlyVolume || 0;
            break;
        }

        volumes.push({
          window,
          volumeUsd,
          measuredAt: now,
        });

        console.log(`[CCTP] Volume ${window}: $${volumeUsd.toLocaleString()}`);
      }

      return volumes;
    } catch (error) {
      console.error("[CCTP] Failed to fetch volumes from DefiLlama:", error);
      // Return empty array instead of throwing - volumes are optional
      return [];
    }
  }

  /**
   * Fetch volume data from DefiLlama Bridge API with caching and retry logic.
   * DefiLlama provides aggregated CCTP statistics across all chains.
   *
   * @returns Bridge data from DefiLlama or null if unavailable
   */
  private async fetchDefiLlamaVolumes(): Promise<DefiLlamaBridgeResponse | null> {
    // Check cache first
    if (this.volumeCache && (Date.now() - this.volumeCache.fetchedAt) < this.VOLUME_CACHE_TTL) {
      console.log("[CCTP] Using cached volume data from DefiLlama");
      return this.volumeCache.data;
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.MAX_RETRIES; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const url = `${this.DEFILLAMA_BASE_URL}/bridge/${this.CCTP_BRIDGE_ID}`;
        console.log(`[CCTP] Fetching volumes from DefiLlama (attempt ${attempt + 1}/${this.MAX_RETRIES}): ${url}`);

        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Accept": "application/json",
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data: DefiLlamaBridgeResponse = await response.json();

        // Validate response has expected fields
        if (typeof data.lastDailyVolume !== 'number') {
          throw new Error("Invalid response structure from DefiLlama");
        }

        // Cache the result
        this.volumeCache = {
          data,
          fetchedAt: Date.now(),
        };

        console.log(`[CCTP] Successfully fetched volumes from DefiLlama: 24h=$${data.lastDailyVolume.toLocaleString()}`);
        return data;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`[CCTP] DefiLlama attempt ${attempt + 1} failed:`, lastError.message);

        if (attempt < this.MAX_RETRIES - 1) {
          const delay = this.RETRY_DELAYS[attempt];
          console.log(`[CCTP] Retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    console.warn("[CCTP] All DefiLlama fetch attempts failed");

    // Cache the null result to avoid hammering the API
    this.volumeCache = {
      data: null,
      fetchedAt: Date.now(),
    };

    return null;
  }

  /**
   * Fetch rate quotes for route/notional combinations.
   *
   * CCTP transfers are 1:1 USDC burns/mints with minimal fees.
   * Rate calculation: amountOut = amountIn - fee
   */
  private async getRates(
    routes: Array<{ source: AssetType; destination: AssetType }>,
    notionals: string[]
  ): Promise<RateType[]> {
    const rates: RateType[] = [];

    for (const route of routes) {
      // CCTP only supports USDC
      if (route.source.symbol !== "USDC" || route.destination.symbol !== "USDC") {
        console.warn(`[CCTP] Non-USDC route: ${route.source.symbol} -> ${route.destination.symbol} (skipped)`);
        continue;
      }

      // Get domain IDs
      const sourceDomain = CHAIN_TO_DOMAIN[route.source.chainId];
      const destDomain = CHAIN_TO_DOMAIN[route.destination.chainId];

      if (sourceDomain === undefined || destDomain === undefined) {
        console.warn(`[CCTP] Unsupported chain: ${route.source.chainId} -> ${route.destination.chainId}`);
        continue;
      }

      // Fetch fees for this route
      const fees = await this.fetchFeesWithRetry(sourceDomain, destDomain);

      for (const notional of notionals) {
        try {
          const amountInNum = parseFloat(notional);

          // Use Standard Transfer fee (typically 1 bps = 0.01%)
          const standardFee = fees.find(f => f.finalityThreshold === 2000);
          const feeBps = standardFee?.minimumFee || 1; // Default to 1 bps if not found

          // Calculate fee: (amount * bps) / 10000
          const feeUsd = (amountInNum * feeBps) / 10000;
          const amountOutNum = amountInNum - feeUsd;

          rates.push({
            source: route.source,
            destination: route.destination,
            amountIn: notional,
            amountOut: amountOutNum.toString(),
            effectiveRate: amountOutNum / amountInNum,
            totalFeesUsd: feeUsd,
            quotedAt: new Date().toISOString(),
          });
        } catch (error) {
          console.error(`[CCTP] Failed to calculate rate for ${route.source.symbol}:`, error);
        }
      }
    }

    return rates;
  }

  /**
   * Fetch liquidity depth using Fast Transfer Allowance as proxy.
   *
   * CCTP maintains a "Fast Transfer Allowance" (collateral pool) for fast transfers.
   * We use this as a proxy for available liquidity.
   */
  private async getLiquidityDepth(
    routes: Array<{ source: AssetType; destination: AssetType }>
  ): Promise<LiquidityDepthType[]> {
    try {
      const allowance = await this.fetchAllowanceWithRetry();

      if (!allowance) {
        console.warn("[CCTP] Failed to fetch allowance, returning empty liquidity");
        return [];
      }

      const liquidity: LiquidityDepthType[] = [];

      // Fast Transfer Allowance represents available liquidity for all routes
      const allowanceUsd = allowance.allowance;

      for (const route of routes) {
        // Only USDC routes supported
        if (route.source.symbol !== "USDC" || route.destination.symbol !== "USDC") {
          continue;
        }

        liquidity.push({
          route,
          thresholds: [
            {
              // 50bps: 80% of fast allowance
              maxAmountIn: (allowanceUsd * 0.8).toString(),
              slippageBps: 50,
            },
            {
              // 100bps: Full fast allowance (essentially no limit for standard)
              maxAmountIn: allowanceUsd.toString(),
              slippageBps: 100,
            }
          ],
          measuredAt: new Date().toISOString(),
        });
      }

      return liquidity;
    } catch (error) {
      console.error("[CCTP] Failed to fetch liquidity depth:", error);
      return [];
    }
  }

  /**
   * Fetch list of assets supported by CCTP.
   * CCTP only supports USDC on supported chains.
   *
   * Addresses sourced from Circle's official documentation:
   * https://developers.circle.com/stablecoins/usdc-contract-addresses
   */
  private async getListedAssets(): Promise<ListedAssetsType> {
    const assets: AssetType[] = Object.entries(USDC_ADDRESSES_BY_CHAIN).map(([chainId, config]) => {
      console.log(`[CCTP] Adding USDC for chain ${chainId}: ${config.address} (Source: ${config.source})`);

      return {
        chainId,
        assetId: config.address,
        symbol: "USDC",
        decimals: config.decimals,
      };
    });

    return {
      assets,
      measuredAt: new Date().toISOString(),
    };
  }

  /**
   * Fetch CCTP fees with retry logic.
   * Implements exponential backoff: 1s, 2s, 4s
   */
  private async fetchFeesWithRetry(
    sourceDomain: number,
    destDomain: number
  ): Promise<CCTPFeeResponse> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.MAX_RETRIES; attempt++) {
      try {
        await this.rateLimiter.acquire();

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const url = `${this.baseUrl}/v2/burn/USDC/fees/${sourceDomain}/${destDomain}`;
        console.log(`[CCTP] Fetching fees (attempt ${attempt + 1}/${this.MAX_RETRIES}): ${url}`);

        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data: CCTPFeeResponse = await response.json();
        console.log(`[CCTP] Successfully fetched fees:`, data);
        return data;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`[CCTP] Fees attempt ${attempt + 1} failed:`, lastError.message);

        if (attempt < this.MAX_RETRIES - 1) {
          const delay = this.RETRY_DELAYS[attempt];
          console.log(`[CCTP] Retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    // Return default fees if all retries fail
    console.warn("[CCTP] Using default fees after retries failed");
    return [
      { finalityThreshold: 1000, minimumFee: 1 }, // Fast: 1 bps
      { finalityThreshold: 2000, minimumFee: 1 }, // Standard: 1 bps
    ];
  }

  /**
   * Fetch CCTP Fast Transfer Allowance with retry logic.
   */
  private async fetchAllowanceWithRetry(): Promise<CCTPAllowanceResponse | null> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.MAX_RETRIES; attempt++) {
      try {
        await this.rateLimiter.acquire();

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const url = `${this.baseUrl}/v2/fastBurn/USDC/allowance`;
        console.log(`[CCTP] Fetching allowance (attempt ${attempt + 1}/${this.MAX_RETRIES}): ${url}`);

        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data: CCTPAllowanceResponse = await response.json();
        console.log(`[CCTP] Successfully fetched allowance: $${data.allowance.toLocaleString()} USDC`);
        return data;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`[CCTP] Allowance attempt ${attempt + 1} failed:`, lastError.message);

        if (attempt < this.MAX_RETRIES - 1) {
          const delay = this.RETRY_DELAYS[attempt];
          console.log(`[CCTP] Retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    // Return null instead of throwing for graceful degradation
    console.error("[CCTP] Failed to fetch allowance from API after all retries");
    return null;
  }

  ping() {
    return Effect.tryPromise({
      try: async () => {
        // Test API connectivity with allowance endpoint
        try {
          await this.rateLimiter.acquire();

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), this.timeout);

          const response = await fetch(`${this.baseUrl}/v2/fastBurn/USDC/allowance`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (response.ok) {
            return {
              status: "ok" as const,
              timestamp: new Date().toISOString(),
            };
          } else {
            throw new Error(`API returned ${response.status}`);
          }
        } catch (error) {
          console.error("[CCTP] Health check failed:", error);
          throw error;
        }
      },
      catch: (error: unknown) => new Error(`Health check failed: ${error instanceof Error ? error.message : String(error)}`)
    });
  }
}
