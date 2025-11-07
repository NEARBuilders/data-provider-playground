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
 * Across-specific API types
 */
interface AcrossSuggestedFeesResponse {
  estimatedFillTimeSec: number;
  relayFeePct: string; // Percentage in basis points
  relayFeeTotal: string; // Total relay fee amount in destination token wei
  capitalFeePct: string; // Capital fee percentage
  capitalFeeTotal: string; // Capital fee amount
  relayGasFeePct: string; // Gas fee percentage
  relayGasFeeTotal: string; // Gas fee amount
  lpFeePct: string; // LP fee percentage (0 if no pool used)
  timestamp: string;
}

/**
 * Token price cache entry
 */
interface TokenPrice {
  priceUsd: number;
  symbol: string;
  fetchedAt: number;
}

/**
 * CoinGecko price response
 */
interface CoinGeckoPriceResponse {
  [address: string]: {
    usd: number;
  };
}

/**
 * DefiLlama Bridge Stats Response
 * API returns numeric bridge ID and volume metrics
 */
interface DefiLlamaBridgeResponse {
  id: number; // Bridge ID is numeric, not string
  displayName: string;
  lastDailyVolume: number; // Last complete 24h period
  weeklyVolume: number; // Last 7 days (not lastWeeklyVolume)
  monthlyVolume: number; // Last 30 days (not lastMonthlyVolume)
  currentDayVolume: number;
  dayBeforeLastVolume: number;
}

/**
 * Token Bucket Rate Limiter
 * Implements rate limiting using token bucket algorithm
 */
class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly maxTokens: number;
  private readonly refillRate: number; // tokens per second

  constructor(maxTokens: number, refillRate: number) {
    this.maxTokens = maxTokens;
    this.tokens = maxTokens;
    this.refillRate = refillRate;
    this.lastRefill = Date.now();
  }

  private refill(): void {
    const now = Date.now();
    const timePassed = (now - this.lastRefill) / 1000; // seconds
    const tokensToAdd = timePassed * this.refillRate;

    this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  async acquire(): Promise<void> {
    this.refill();

    if (this.tokens >= 1) {
      this.tokens -= 1;
      return;
    }

    // Wait until we have a token
    const waitTime = ((1 - this.tokens) / this.refillRate) * 1000;
    await new Promise(resolve => setTimeout(resolve, waitTime));
    this.tokens = 0;
  }
}

interface AcrossLimitsResponse {
  minDeposit: string;
  maxDeposit: string;
  maxDepositInstant: string; // Maximum for instant fill
  maxDepositShortDelay: string; // Maximum with short delay
  recommendedDepositInstant: string; // Recommended for instant fill
  relayerFeeDetails: {
    capitalFeeTotal: string;
    capitalFeePercent: string;
  };
  gasFeeDetails: {
    originGas: string;
    destinationGas: string;
  };
}

interface AcrossTokenResponse {
  chainId: number;
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoUrl?: string;
  priceUsd?: string;
}

interface AcrossChainResponse {
  chainId: number;
  name: string;
  publicRpcUrl?: string;
  explorerUrl?: string;
  logoUrl?: string;
}

/**
 * Data Provider Service for Across Protocol
 *
 * Across is a cross-chain bridge optimized for capital efficiency using an intent-based architecture.
 *
 * Key features:
 * - Fast cross-chain transfers (typically <1 min)
 * - Support for many chains (Ethereum, Optimism, Arbitrum, Polygon, Base, etc.)
 * - No API key required (optional integratorId for tracking)
 * - Dynamic fee pricing based on liquidity utilization
 * - Instant fills with relayer network
 */
export class DataProviderService {
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAYS = [1000, 2000, 4000]; // 1s, 2s, 4s
  private readonly PRICE_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly VOLUME_CACHE_TTL = 10 * 60 * 1000; // 10 minutes
  private readonly ACROSS_BRIDGE_ID = "19"; // Across bridge ID on DefiLlama (numeric ID)

  // Cache for token prices and volumes to avoid excessive API calls
  private priceCache: Map<string, TokenPrice> = new Map();
  private volumeCache: { data: DefiLlamaBridgeResponse | null; fetchedAt: number } | null = null;

  // Rate limiter to prevent API throttling
  private rateLimiter: RateLimiter;

  constructor(
    private readonly baseUrl: string,
    private readonly coingeckoBaseUrl: string, // From ENV - not hardcoded
    private readonly defillamaBaseUrl: string, // From ENV - not hardcoded
    private readonly apiKey: string, // Optional integratorId (not required)
    private readonly timeout: number,
    maxRequestsPerSecond: number = 10
  ) {
    // Initialize rate limiter with configurable rate
    this.rateLimiter = new RateLimiter(maxRequestsPerSecond, maxRequestsPerSecond);
  }

  /**
   * Get complete snapshot of Across data for given routes and notionals.
   */
  getSnapshot(params: {
    routes: Array<{ source: AssetType; destination: AssetType }>;
    notionals: string[];
    includeWindows?: Array<"24h" | "7d" | "30d">;
  }) {
    return Effect.tryPromise({
      try: async () => {
        console.log(`[Across] Fetching snapshot for ${params.routes.length} routes`);

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
   * DefiLlama aggregates bridge volume data across all chains.
   *
   * @param windows - Time windows to fetch (24h, 7d, 30d)
   * @returns Array of volume windows with USD amounts
   */
  private async getVolumes(windows: Array<"24h" | "7d" | "30d">): Promise<VolumeWindowType[]> {
    try {
      const bridgeData = await this.fetchDefiLlamaVolumes();

      if (!bridgeData) {
        console.warn("[Across] No volume data available from DefiLlama");
        return [];
      }

      const volumes: VolumeWindowType[] = [];
      const now = new Date().toISOString();

      for (const window of windows) {
        let volumeUsd: number;

        switch (window) {
          case "24h":
            // Use lastDailyVolume which represents the last complete 24h period
            volumeUsd = bridgeData.lastDailyVolume || 0;
            break;
          case "7d":
            // Use weeklyVolume which represents the last 7 days
            volumeUsd = bridgeData.weeklyVolume || 0;
            break;
          case "30d":
            // Use monthlyVolume which represents the last 30 days
            volumeUsd = bridgeData.monthlyVolume || 0;
            break;
        }

        volumes.push({
          window,
          volumeUsd,
          measuredAt: now,
        });

        console.log(`[Across] Volume ${window}: $${volumeUsd.toLocaleString()}`);
      }

      return volumes;
    } catch (error) {
      console.error("[Across] Failed to fetch volumes from DefiLlama:", error);
      // Return empty array instead of throwing - volumes are optional
      return [];
    }
  }

  /**
   * Fetch rate quotes for route/notional combinations.
   *
   * Uses Across suggested-fees API to get detailed fee breakdown.
   * All amounts are kept in smallest units (wei) as per contract specification.
   */
  private async getRates(
    routes: Array<{ source: AssetType; destination: AssetType }>,
    notionals: string[]
  ): Promise<RateType[]> {
    const rates: RateType[] = [];

    for (const route of routes) {
      for (const notional of notionals) {
        try {
          const fees = await this.fetchSuggestedFeesWithRetry(
            route.source.assetId,
            route.destination.assetId,
            route.source.chainId,
            route.destination.chainId,
            notional
          );

          if (fees) {
            // All amounts in smallest units (wei)
            // notional is already in wei (source smallest units)
            const amountInWei = BigInt(notional);

            // relayFeeTotal is in destination token wei
            const relayFeeWei = BigInt(fees.relayFeeTotal);

            // For cross-chain transfers, we need to consider:
            // - Input is in source chain units
            // - Fee is in destination chain units
            // - Output is input minus fees (assuming 1:1 rate for same token)
            // The Across API returns fees in destination token smallest units

            // Calculate output amount in destination smallest units
            // Assumption: For same token (e.g. USDC->USDC), 1:1 base rate
            const amountOutWei = amountInWei - relayFeeWei;

            // Calculate effective rate (normalized for decimals)
            // effectiveRate = (amountOut / 10^dstDecimals) / (amountIn / 10^srcDecimals)
            // Simplified: effectiveRate = (amountOut * 10^srcDecimals) / (amountIn * 10^dstDecimals)
            const srcDecimalsFactor = Math.pow(10, route.source.decimals);
            const dstDecimalsFactor = Math.pow(10, route.destination.decimals);
            const effectiveRate = (Number(amountOutWei) / dstDecimalsFactor) /
                                  (Number(amountInWei) / srcDecimalsFactor);

            // Calculate total fees in USD
            // Get token price and convert fee to USD
            const tokenPrice = await this.getTokenPrice(route.destination.chainId, route.destination.assetId);
            const feeInTokens = Number(relayFeeWei) / dstDecimalsFactor;
            const totalFeesUsd = tokenPrice !== null ? feeInTokens * tokenPrice : null;

            rates.push({
              source: route.source,
              destination: route.destination,
              amountIn: amountInWei.toString(), // Keep as string in wei
              amountOut: amountOutWei.toString(), // Keep as string in wei
              effectiveRate,
              totalFeesUsd,
              quotedAt: new Date().toISOString(),
            });
          }
        } catch (error) {
          console.error(`[Across] Failed to get rate for ${route.source.symbol} -> ${route.destination.symbol}:`, error);
          // Continue to next route/notional instead of failing completely
        }
      }
    }

    return rates;
  }

  /**
   * Fetch liquidity depth using Across limits API.
   *
   * Across provides maxDepositInstant which indicates available liquidity for instant fills.
   */
  private async getLiquidityDepth(
    routes: Array<{ source: AssetType; destination: AssetType }>
  ): Promise<LiquidityDepthType[]> {
    const liquidity: LiquidityDepthType[] = [];

    for (const route of routes) {
      try {
        const limits = await this.fetchLimitsWithRetry(
          route.source.assetId,
          route.destination.assetId,
          route.source.chainId,
          route.destination.chainId
        );

        if (limits) {
          // Keep amounts in source smallest units (wei) as per contract specification
          // maxAmountIn must be in source units, not converted to decimal
          liquidity.push({
            route,
            thresholds: [
              {
                // Recommended instant amount: low slippage (50bps)
                // Contract requires string in source smallest units
                maxAmountIn: limits.recommendedDepositInstant,
                slippageBps: 50,
              },
              {
                // Max instant fill: higher slippage (100bps)
                // Contract requires string in source smallest units
                maxAmountIn: limits.maxDepositInstant,
                slippageBps: 100,
              }
            ],
            measuredAt: new Date().toISOString(),
          });
        }
      } catch (error) {
        console.error(`[Across] Failed to fetch liquidity for ${route.source.symbol}:`, error);
      }
    }

    return liquidity;
  }

  /**
   * Fetch list of assets supported by Across.
   * Uses /swap/tokens endpoint.
   */
  private async getListedAssets(): Promise<ListedAssetsType> {
    try {
      const tokens = await this.fetchTokensWithRetry();

      const assets: AssetType[] = tokens.map(token => ({
        chainId: token.chainId.toString(),
        assetId: token.address,
        symbol: token.symbol,
        decimals: token.decimals,
      }));

      return {
        assets,
        measuredAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error("[Across] Failed to fetch listed assets:", error);
      return {
        assets: [],
        measuredAt: new Date().toISOString(),
      };
    }
  }

  /**
   * Fetch suggested fees from Across API with retry logic and rate limiting.
   */
  private async fetchSuggestedFeesWithRetry(
    inputToken: string,
    outputToken: string,
    originChainId: string,
    destinationChainId: string,
    amount: string
  ): Promise<AcrossSuggestedFeesResponse | null> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.MAX_RETRIES; attempt++) {
      try {
        // Apply rate limiting
        await this.rateLimiter.acquire();

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const params = new URLSearchParams({
          inputToken,
          outputToken,
          originChainId,
          destinationChainId,
          amount,
        });

        const url = `${this.baseUrl}/suggested-fees?${params}`;
        console.log(`[Across] Fetching fees (attempt ${attempt + 1}/${this.MAX_RETRIES}): ${url}`);

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

        const data: AcrossSuggestedFeesResponse = await response.json();

        // Validate response structure
        if (!data.relayFeeTotal || typeof data.relayFeeTotal !== 'string') {
          throw new Error("Invalid response structure: missing relayFeeTotal");
        }

        console.log(`[Across] Successfully fetched fees: ${data.relayFeeTotal}`);
        return data;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`[Across] Fees attempt ${attempt + 1} failed:`, lastError.message);

        if (attempt < this.MAX_RETRIES - 1) {
          const delay = this.RETRY_DELAYS[attempt];
          console.log(`[Across] Retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    console.warn("[Across] All fee fetch attempts failed");
    return null;
  }

  /**
   * Fetch deposit limits from Across API with retry logic and rate limiting.
   */
  private async fetchLimitsWithRetry(
    inputToken: string,
    outputToken: string,
    originChainId: string,
    destinationChainId: string
  ): Promise<AcrossLimitsResponse | null> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.MAX_RETRIES; attempt++) {
      try {
        // Apply rate limiting
        await this.rateLimiter.acquire();

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const params = new URLSearchParams({
          inputToken,
          outputToken,
          originChainId,
          destinationChainId,
        });

        const url = `${this.baseUrl}/limits?${params}`;
        console.log(`[Across] Fetching limits (attempt ${attempt + 1}/${this.MAX_RETRIES}): ${url}`);

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

        const data: AcrossLimitsResponse = await response.json();

        // Validate response structure
        if (!data.maxDepositInstant || !data.recommendedDepositInstant) {
          throw new Error("Invalid response structure: missing deposit limits");
        }

        console.log(`[Across] Successfully fetched limits: max=${data.maxDepositInstant}`);
        return data;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`[Across] Limits attempt ${attempt + 1} failed:`, lastError.message);

        if (attempt < this.MAX_RETRIES - 1) {
          const delay = this.RETRY_DELAYS[attempt];
          console.log(`[Across] Retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    console.warn("[Across] All limits fetch attempts failed");
    return null;
  }

  /**
   * Fetch supported tokens from Across API with retry logic and rate limiting.
   */
  private async fetchTokensWithRetry(): Promise<AcrossTokenResponse[]> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.MAX_RETRIES; attempt++) {
      try {
        // Apply rate limiting
        await this.rateLimiter.acquire();

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const url = `${this.baseUrl}/swap/tokens`;
        console.log(`[Across] Fetching tokens (attempt ${attempt + 1}/${this.MAX_RETRIES}): ${url}`);

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

        const data: AcrossTokenResponse[] = await response.json();

        // Validate response structure
        if (!Array.isArray(data)) {
          throw new Error("Invalid response structure: expected array of tokens");
        }

        console.log(`[Across] Successfully fetched ${data.length} tokens`);
        return data;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`[Across] Tokens attempt ${attempt + 1} failed:`, lastError.message);

        if (attempt < this.MAX_RETRIES - 1) {
          const delay = this.RETRY_DELAYS[attempt];
          console.log(`[Across] Retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    // Return empty array if all retries fail
    console.warn("[Across] Using empty token list after retries failed");
    return [];
  }

  /**
   * Fetch volume data from DefiLlama Bridge API with caching and retry logic.
   * DefiLlama provides aggregated bridge statistics including 24h, 7d, and 30d volumes.
   *
   * @returns Bridge data from DefiLlama or null if unavailable
   */
  private async fetchDefiLlamaVolumes(): Promise<DefiLlamaBridgeResponse | null> {
    // Check cache first
    if (this.volumeCache && (Date.now() - this.volumeCache.fetchedAt) < this.VOLUME_CACHE_TTL) {
      console.log("[Across] Using cached volume data from DefiLlama");
      return this.volumeCache.data;
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.MAX_RETRIES; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const url = `${this.defillamaBaseUrl}/bridge/${this.ACROSS_BRIDGE_ID}`;
        console.log(`[Across] Fetching volumes from DefiLlama (attempt ${attempt + 1}/${this.MAX_RETRIES}): ${url}`);

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

        console.log(`[Across] Successfully fetched volumes from DefiLlama: 24h=$${data.lastDailyVolume.toLocaleString()}`);
        return data;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`[Across] DefiLlama attempt ${attempt + 1} failed:`, lastError.message);

        if (attempt < this.MAX_RETRIES - 1) {
          const delay = this.RETRY_DELAYS[attempt];
          console.log(`[Across] Retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    console.warn("[Across] All DefiLlama fetch attempts failed");

    // Cache the null result to avoid hammering the API
    this.volumeCache = {
      data: null,
      fetchedAt: Date.now(),
    };

    return null;
  }

  /**
   * Get token price in USD from CoinGecko API with caching.
   * Falls back to Across API priceUsd if available.
   *
   * @param chainId - The chain ID where the token exists
   * @param tokenAddress - The token contract address
   * @returns Price in USD or null if unavailable
   */
  private async getTokenPrice(chainId: string, tokenAddress: string): Promise<number | null> {
    const cacheKey = `${chainId}:${tokenAddress.toLowerCase()}`;

    // Check cache first
    const cached = this.priceCache.get(cacheKey);
    if (cached && (Date.now() - cached.fetchedAt) < this.PRICE_CACHE_TTL) {
      console.log(`[Across] Using cached price for ${cached.symbol}: $${cached.priceUsd}`);
      return cached.priceUsd;
    }

    try {
      // Try to get price from Across tokens API first (they include priceUsd)
      const tokens = await this.fetchTokensWithRetry();
      const token = tokens.find(
        t => t.address.toLowerCase() === tokenAddress.toLowerCase() &&
        t.chainId.toString() === chainId
      );

      if (token?.priceUsd) {
        const price = parseFloat(token.priceUsd);
        this.priceCache.set(cacheKey, {
          priceUsd: price,
          symbol: token.symbol,
          fetchedAt: Date.now(),
        });
        console.log(`[Across] Fetched price from Across API for ${token.symbol}: $${price}`);
        return price;
      }

      // Fallback to CoinGecko for price data
      const platformId = this.getCoingeckoPlatformId(chainId);
      if (!platformId) {
        console.warn(`[Across] No CoinGecko platform mapping for chain ${chainId}`);
        return null;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const url = `${this.coingeckoBaseUrl}/simple/token_price/${platformId}?contract_addresses=${tokenAddress}&vs_currencies=usd`;

      const response = await fetch(url, {
        method: "GET",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(`[Across] CoinGecko API returned ${response.status} for ${tokenAddress}`);
        return null;
      }

      const data: CoinGeckoPriceResponse = await response.json();
      const price = data[tokenAddress.toLowerCase()]?.usd;

      if (price) {
        this.priceCache.set(cacheKey, {
          priceUsd: price,
          symbol: token?.symbol || 'UNKNOWN',
          fetchedAt: Date.now(),
        });
        console.log(`[Across] Fetched price from CoinGecko: $${price}`);
        return price;
      }

      console.warn(`[Across] No price data available for ${tokenAddress} on chain ${chainId}`);
      return null;
    } catch (error) {
      console.error(`[Across] Failed to fetch token price:`, error);
      return null;
    }
  }

  /**
   * Map chain ID to CoinGecko platform identifier
   */
  private getCoingeckoPlatformId(chainId: string): string | null {
    const mapping: Record<string, string> = {
      '1': 'ethereum',
      '10': 'optimistic-ethereum',
      '137': 'polygon-pos',
      '42161': 'arbitrum-one',
      '8453': 'base',
      '324': 'zksync',
      '59144': 'linea',
      '534352': 'scroll',
    };
    return mapping[chainId] || null;
  }

  ping() {
    return Effect.tryPromise({
      try: async () => {
        // Test API connectivity with swap/chains endpoint
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), this.timeout);

          const response = await fetch(`${this.baseUrl}/swap/chains`, {
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
          console.error("[Across] Health check failed:", error);
          throw error;
        }
      },
      catch: (error: unknown) => new Error(`Health check failed: ${error instanceof Error ? error.message : String(error)}`)
    });
  }
}
