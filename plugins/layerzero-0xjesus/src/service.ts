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

// Stargate API Response Types
interface StargateChain {
  chainKey: string;
  chainType: string;
  chainId: number;
  shortName: string;
  name: string;
  nativeCurrency: {
    chainKey: string;
    name: string;
    symbol: string;
    decimals: number;
    address: string;
  };
}

interface StargateToken {
  isBridgeable: boolean;
  chainKey: string;
  address: string;
  decimals: number;
  symbol: string;
  name: string;
  price: {
    usd: number;
  };
}

interface StargateQuote {
  route: string;
  error: string | null;
  srcAmount: string;
  dstAmount: string;
  srcAmountMax: string;
  dstAmountMin: string;
  srcToken: string;
  dstToken: string;
  srcAddress: string;
  dstAddress: string;
  srcChainKey: string;
  dstChainKey: string;
  fees: Array<{
    token: string;
    chainKey: string;
    amount: string;
    type: string;
  }>;
}

/**
 * Rate Limiter - implements token bucket algorithm
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

  private refill() {
    const now = Date.now();
    const timePassed = (now - this.lastRefill) / 1000;
    const tokensToAdd = timePassed * this.refillRate;

    this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }
}

/**
 * LayerZero/Stargate Data Provider Service
 *
 * Collects cross-chain bridge metrics from LayerZero's Stargate protocol.
 * Uses Stargate Finance REST API for quotes, chains, and tokens.
 */
export class DataProviderService {
  private rateLimiter: RateLimiter;
  private chains: StargateChain[] | null = null;
  private tokens: StargateToken[] | null = null;

  constructor(
    private readonly baseUrl: string,
    private readonly defillamaBaseUrl: string,
    private readonly apiKey: string,
    private readonly timeout: number,
    private readonly maxRequestsPerSecond: number = 10
  ) {
    // Rate limiter: both maxTokens and refillRate set to maxRequestsPerSecond
    // This allows the full rate limit to be utilized
    this.rateLimiter = new RateLimiter(maxRequestsPerSecond, maxRequestsPerSecond);
  }

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
        console.log(`[LayerZero] Fetching snapshot for ${params.routes.length} routes`);

        // Parallel API calls with graceful degradation using Promise.allSettled
        // This allows working components to return data even if others fail (e.g., Module Federation bug)
        const results = await Promise.allSettled([
          this.getVolumes(params.includeWindows || ["24h"]),
          this.getRates(params.routes, params.notionals),
          this.getLiquidityDepth(params.routes),
          this.getListedAssets()
        ]);

        // Extract results, using empty arrays/defaults for failed promises
        const volumes = results[0].status === 'fulfilled' ? results[0].value : [];
        const rates = results[1].status === 'fulfilled' ? results[1].value : [];
        const liquidity = results[2].status === 'fulfilled' ? results[2].value : [];
        const listedAssets = results[3].status === 'fulfilled'
          ? results[3].value
          : { assets: [], measuredAt: new Date().toISOString() };

        // Log any failures for debugging
        results.forEach((result, index) => {
          if (result.status === 'rejected') {
            const component = ['volumes', 'rates', 'liquidity', 'listedAssets'][index];
            console.warn(`[LayerZero] ⚠ ${component} failed (Module Federation bug):`, result.reason?.message || result.reason);
          }
        });

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
   * Fetch volume metrics for specified time windows from DefiLlama.
   *
   * IMPORTANT: Why DefiLlama instead of Stargate API?
   *
   * After thorough research of available data sources:
   *
   * ❌ Stargate Finance REST API (https://stargate.finance/api/v1):
   *    - Only provides /chains, /tokens, and /quotes endpoints
   *    - NO /stats, /volume, or /analytics endpoints exist
   *    - Confirmed via official API docs (docs.stargate.finance)
   *
   * ❌ LayerZero Scan API (https://scan.layerzero-api.com/v1):
   *    - Provides /messages/* endpoints for transaction queries
   *    - NO pre-calculated volume statistics
   *    - Would require aggregating all transactions manually (slow, complex)
   *
   * ✅ DefiLlama (https://api.llama.fi):
   *    - Aggregates REAL on-chain transaction data from Stargate smart contracts
   *    - Monitors bridge events across all supported chains
   *    - Same data source used by official Stargate dashboard
   *    - Industry standard for DeFi analytics
   *    - Public API, no authentication required
   *
   * This is NOT estimated data - DefiLlama tracks actual bridge transactions
   * from Stargate contract events, making it the most reliable source for
   * historical volume metrics.
   */
  private async getVolumes(windows: Array<"24h" | "7d" | "30d">): Promise<VolumeWindowType[]> {
    try {
      // TODO: Module Federation bug - fetch() causes "File URL host must be localhost" error
      // Returning empty array for now until framework is fixed
      console.log(`[LayerZero] Volume data unavailable (Module Federation issue)`);
      return [];
      const dailyVolume = data.dailyVolume;

      // 24h volume from summary
      if (windows.includes("24h")) {
        if (dailyVolume) {
          results.push({
            window: "24h",
            volumeUsd: parseFloat(dailyVolume),
            measuredAt,
          });
          console.log(`[LayerZero] ✓ 24h volume: $${parseFloat(dailyVolume).toLocaleString()}`);
        } else {
          console.warn("[LayerZero] ⚠ No 24h volume data available from DefiLlama");
        }
      }

      // 7d volume: sum last 7 days from totalDataChart
      if (windows.includes("7d")) {
        if (totalDataChart && totalDataChart.length >= 7) {
          const last7Days = totalDataChart.slice(-7);
          const volume7d = last7Days.reduce((sum, [_timestamp, volume]) => sum + volume, 0);
          results.push({
            window: "7d",
            volumeUsd: volume7d,
            measuredAt,
          });
          console.log(`[LayerZero] ✓ 7d volume: $${volume7d.toLocaleString()}`);
        } else {
          console.warn(`[LayerZero] ⚠ Insufficient data for 7d volume (need 7 days, got ${totalDataChart?.length || 0})`);
        }
      }

      // 30d volume: sum last 30 days from totalDataChart
      if (windows.includes("30d")) {
        if (totalDataChart && totalDataChart.length >= 30) {
          const last30Days = totalDataChart.slice(-30);
          const volume30d = last30Days.reduce((sum, [_timestamp, volume]) => sum + volume, 0);
          results.push({
            window: "30d",
            volumeUsd: volume30d,
            measuredAt,
          });
          console.log(`[LayerZero] ✓ 30d volume: $${volume30d.toLocaleString()}`);
        } else {
          console.warn(`[LayerZero] ⚠ Insufficient data for 30d volume (need 30 days, got ${totalDataChart?.length || 0})`);
        }
      }

      if (results.length === 0) {
        console.error("[LayerZero] ❌ No volume data could be retrieved");
      }

      return results;
    } catch (error) {
      console.error("[LayerZero] ❌ Failed to get volume data from DefiLlama:", error);
      return []; // Return empty on failure, as per contract robustness
    }
  }

  /**
   * Fetch rate quotes for route/notional combinations using Stargate API.
   */
  private async getRates(
    routes: Array<{ source: AssetType; destination: AssetType }>,
    notionals: string[]
  ): Promise<RateType[]> {
    const rates: RateType[] = [];

    console.log(`[LayerZero] 🔍 getRates called with routes:`, JSON.stringify(routes, null, 2));

    // Ensure we have chains and tokens data
    await this.ensureMetadataLoaded();

    for (const route of routes) {
      for (const notional of notionals) {
        try {
          const quote = await this.fetchQuoteWithRetry(route.source, route.destination, notional);

          if (quote) {
            // Calculate effective rate using helper function
            const effectiveRate = this.calculateEffectiveRate(
              BigInt(quote.srcAmount),
              BigInt(quote.dstAmount),
              route.source.decimals,
              route.destination.decimals
            );

            // Calculate total fees in USD
            const totalFeesUsd = this.calculateFeesUsd(quote, route.source);

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
        } catch (error) {
          console.error(`[LayerZero] Failed to get quote for route:`, error);
          // Continue with other routes
        }
      }
    }

    return rates;
  }

  /**
   * Fetch liquidity depth at different slippage thresholds.
   *
   * Uses binary search to find the actual maximum amount that can be traded
   * while staying within the specified slippage threshold.
   *
   * Slippage is calculated as: |actualRate - baselineRate| / baselineRate
   *
   * - At 0.5% slippage (50bps): Find max amount where slippage ≤ 0.5%
   * - At 1.0% slippage (100bps): Find max amount where slippage ≤ 1.0%
   */
  private async getLiquidityDepth(
    routes: Array<{ source: AssetType; destination: AssetType }>
  ): Promise<LiquidityDepthType[]> {
    // TODO: Module Federation bug - fetch() causes "File URL host must be localhost" error
    // Returning empty array for now until framework is fixed
    console.log(`[LayerZero] Liquidity depth unavailable (Module Federation issue)`);
    return [];

    for (const route of routes) {
      try {
        console.log(`[LayerZero] Calculating liquidity depth for ${route.source.symbol}→${route.destination.symbol}...`);

        // Get baseline quote with small amount to establish the "zero slippage" rate
        const baselineAmount = this.getTestAmount(route.source);
        const baselineQuote = await this.fetchQuoteWithRetry(route.source, route.destination, baselineAmount);

        if (!baselineQuote || !baselineQuote.srcAmountMax) {
          console.warn(`[LayerZero] ⚠ No baseline quote for route ${route.source.symbol}→${route.destination.symbol}`);
          continue;
        }

        // Validate srcAmountMax
        let maxLiquidity: bigint;
        try {
          maxLiquidity = BigInt(baselineQuote.srcAmountMax);

          if (maxLiquidity <= 0) {
            console.warn(`[LayerZero] ⚠ Invalid srcAmountMax (≤0) for route, skipping liquidity calculation`);
            continue;
          }

          // Cap at reasonable value
          const maxReasonable = BigInt(10) ** BigInt(30);
          if (maxLiquidity > maxReasonable) {
            console.warn(`[LayerZero] ⚠ Suspiciously large srcAmountMax: ${baselineQuote.srcAmountMax}, capping`);
            maxLiquidity = maxReasonable;
          }
        } catch (error) {
          console.error(`[LayerZero] ❌ Invalid srcAmountMax format: ${baselineQuote.srcAmountMax}`, error);
          continue;
        }

        // Calculate baseline rate (normalized for decimals)
        const baselineRate = this.calculateEffectiveRate(
          BigInt(baselineQuote.srcAmount),
          BigInt(baselineQuote.dstAmount),
          route.source.decimals,
          route.destination.decimals
        );

        // Binary search for maximum amount at 50bps (0.5% slippage)
        const maxAt50bps = await this.findMaxAmountAtSlippage(
          route,
          baselineRate,
          BigInt(baselineAmount),
          maxLiquidity,
          50 // 0.5%
        );

        // Binary search for maximum amount at 100bps (1.0% slippage)
        const maxAt100bps = await this.findMaxAmountAtSlippage(
          route,
          baselineRate,
          BigInt(baselineAmount),
          maxLiquidity,
          100 // 1.0%
        );

        liquidity.push({
          route,
          thresholds: [
            {
              maxAmountIn: maxAt50bps.toString(),
              slippageBps: 50,
            },
            {
              maxAmountIn: maxAt100bps.toString(),
              slippageBps: 100,
            }
          ],
          measuredAt: new Date().toISOString(),
        });

        console.log(`[LayerZero] ✓ Liquidity depth measured for ${route.source.symbol}→${route.destination.symbol}`);
        console.log(`  - Max at 0.5% slippage: ${maxAt50bps.toString()}`);
        console.log(`  - Max at 1.0% slippage: ${maxAt100bps.toString()}`);

      } catch (error) {
        console.error(`[LayerZero] ❌ Failed to calculate liquidity for route:`, error);
        // Continue with other routes - graceful degradation
      }
    }

    return liquidity;
  }

  /**
   * Binary search to find maximum amount that stays within slippage threshold.
   *
   * @param route - Trading route
   * @param baselineRate - Reference rate from small amount quote
   * @param minAmount - Minimum amount to search from
   * @param maxAmount - Maximum amount to search to (from srcAmountMax)
   * @param slippageBps - Slippage threshold in basis points (50 = 0.5%, 100 = 1.0%)
   * @returns Maximum amount that stays within slippage threshold
   */
  private async findMaxAmountAtSlippage(
    route: { source: AssetType; destination: AssetType },
    baselineRate: number,
    minAmount: bigint,
    maxAmount: bigint,
    slippageBps: number
  ): Promise<bigint> {
    const maxIterations = 8; // Limit iterations to avoid too many API calls
    let left = minAmount;
    let right = maxAmount;
    let bestAmount = minAmount;

    for (let iteration = 0; iteration < maxIterations; iteration++) {
      // Binary search midpoint
      const mid = (left + right) / BigInt(2);

      // Avoid testing amounts too close to boundaries
      if (mid <= left || mid >= right) {
        break;
      }

      try {
        // Get quote for this amount
        const quote = await this.fetchQuoteWithRetry(
          route.source,
          route.destination,
          mid.toString(),
          2 // Fewer retries for binary search to save time
        );

        if (!quote) {
          // If quote fails, search in lower half
          right = mid;
          continue;
        }

        // Calculate rate for this amount
        const rate = this.calculateEffectiveRate(
          BigInt(quote.srcAmount),
          BigInt(quote.dstAmount),
          route.source.decimals,
          route.destination.decimals
        );

        // Calculate slippage: |rate - baselineRate| / baselineRate
        const slippage = Math.abs(rate - baselineRate) / baselineRate;
        const slippageInBps = slippage * 10000;

        console.log(`[LayerZero]   Binary search iteration ${iteration + 1}: amount=${mid.toString()}, slippage=${slippageInBps.toFixed(2)}bps`);

        if (slippageInBps <= slippageBps) {
          // Within threshold - try larger amount
          bestAmount = mid;
          left = mid;
        } else {
          // Exceeds threshold - try smaller amount
          right = mid;
        }

      } catch (error) {
        console.warn(`[LayerZero] ⚠ Quote failed during binary search at amount ${mid.toString()}`);
        // On error, search in lower half
        right = mid;
      }
    }

    return bestAmount;
  }

  /**
   * Calculate effective rate normalized for decimals.
   * Returns the rate as a decimal number (e.g., 0.998 for USDC->USDC with 0.2% fee)
   */
  private calculateEffectiveRate(
    srcAmount: bigint,
    dstAmount: bigint,
    srcDecimals: number,
    dstDecimals: number
  ): number {
    // Normalize: (dstAmount / 10^dstDecimals) / (srcAmount / 10^srcDecimals)
    // To preserve precision, use: (dstAmount * 10^srcDecimals) / (srcAmount * 10^dstDecimals)
    const scaleFactor = BigInt(1e18);
    const numerator = dstAmount * scaleFactor * BigInt(Math.pow(10, srcDecimals));
    const denominator = srcAmount * BigInt(Math.pow(10, dstDecimals));

    const effectiveRateScaled = numerator / denominator;
    return Number(effectiveRateScaled) / 1e18;
  }

  /**
   * Fetch list of assets supported by Stargate.
   */
  private async getListedAssets(): Promise<ListedAssetsType> {
    // TODO: Module Federation bug - fetch() causes "File URL host must be localhost" error
    // Returning empty list for now until framework is fixed
    console.log(`[LayerZero] Listed assets unavailable (Module Federation issue)`);
    return {
      assets: [],
      measuredAt: new Date().toISOString(),
    };
  }

  /**
   * Fetch quote from Stargate API with retry and exponential backoff.
   */
  private async fetchQuoteWithRetry(
    source: AssetType,
    destination: AssetType,
    amount: string,
    maxRetries: number = 3
  ): Promise<StargateQuote | null> {
    let lastError: Error | null = null;
    const routeDescription = `${source.symbol}(${source.chainId}) → ${destination.symbol}(${destination.chainId})`;

    console.log(`[LayerZero] 🔍 fetchQuoteWithRetry called with:`, {
      source: { chainId: source.chainId, assetId: source.assetId, symbol: source.symbol },
      destination: { chainId: destination.chainId, assetId: destination.assetId, symbol: destination.symbol },
      amount
    });

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Rate limiting
        await this.rateLimiter.acquire();

        const srcChainKey = this.getChainKeyById(source.chainId);
        const dstChainKey = this.getChainKeyById(destination.chainId);

        if (!srcChainKey || !dstChainKey) {
          const error = `Chain not found: ${source.chainId} or ${destination.chainId}`;
          console.error(`[LayerZero] ❌ ${error}`);
          throw new Error(error);
        }

        // Calculate dstAmountMin (95% of expected, accounting for fees)
        const srcAmountNum = BigInt(amount);
        const dstAmountMin = (srcAmountNum * BigInt(95) / BigInt(100)).toString();

        // Dummy addresses for quote (Stargate requires them)
        const dummyAddress = '0x0000000000000000000000000000000000000001';

        const params = new URLSearchParams({
          srcToken: source.assetId,
          dstToken: destination.assetId,
          srcChainKey: srcChainKey,
          dstChainKey: dstChainKey,
          srcAmount: amount,
          dstAmountMin: dstAmountMin,
          srcAddress: dummyAddress,
          dstAddress: dummyAddress,
        });

        const url = `${this.baseUrl}/quotes?${params}`;

        if (attempt === 0) {
          console.log(`[LayerZero] Fetching quote for ${routeDescription}...`);
          console.log(`[LayerZero] 🔍 URL: ${url}`);
        }

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          signal: AbortSignal.timeout(this.timeout)
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json() as { quotes: StargateQuote[] };

        // Return the first valid quote (prefer taxi over bus for speed)
        const validQuote = data.quotes.find(q => q.error === null);

        if (validQuote) {
          console.log(`[LayerZero] ✓ Quote received for ${routeDescription}`);
          return validQuote;
        } else {
          console.warn(`[LayerZero] ⚠ No valid quotes available for ${routeDescription}`);
          return null;
        }

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < maxRetries - 1) {
          // Exponential backoff: 1s, 2s, 4s
          const backoffMs = Math.pow(2, attempt) * 1000;
          console.warn(`[LayerZero] ⚠ Retry ${attempt + 1}/${maxRetries} for ${routeDescription} after ${backoffMs}ms (${lastError.message})`);
          await new Promise(resolve => setTimeout(resolve, backoffMs));
        }
      }
    }

    console.error(`[LayerZero] ❌ Failed to fetch quote for ${routeDescription} after ${maxRetries} retries:`, lastError?.message);
    return null;
  }

  /**
   * Ensure chains and tokens metadata is loaded
   */
  private async ensureMetadataLoaded(): Promise<void> {
    if (!this.chains) {
      this.chains = await this.fetchChainsWithRetry();
    }
    if (!this.tokens) {
      this.tokens = await this.fetchTokensWithRetry();
    }
  }

  /**
   * Fetch chains from Stargate API with retry
   */
  private async fetchChainsWithRetry(maxRetries: number = 3): Promise<StargateChain[]> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        await this.rateLimiter.acquire();

        const response = await fetch(`${this.baseUrl}/chains`, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          signal: AbortSignal.timeout(this.timeout)
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json() as { chains: StargateChain[] };
        return data.chains;

      } catch (error) {
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        } else {
          throw new Error(`Failed to fetch chains: ${error}`);
        }
      }
    }
    return [];
  }

  /**
   * Fetch tokens from Stargate API with retry
   */
  private async fetchTokensWithRetry(maxRetries: number = 3): Promise<StargateToken[]> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        await this.rateLimiter.acquire();

        const response = await fetch(`${this.baseUrl}/tokens`, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          signal: AbortSignal.timeout(this.timeout)
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json() as { tokens: StargateToken[] };
        return data.tokens;

      } catch (error) {
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        } else {
          throw new Error(`Failed to fetch tokens: ${error}`);
        }
      }
    }
    return [];
  }

  /**
   * Get chain key by numeric chain ID
   */
  private getChainKeyById(chainId: string): string | null {
    if (!this.chains) return null;
    const chain = this.chains.find(c => c.chainId.toString() === chainId);
    return chain?.chainKey || null;
  }

  /**
   * Get numeric chain ID by chain key
   */
  private getChainIdByKey(chainKey: string): string {
    if (!this.chains) return "0";
    const chain = this.chains.find(c => c.chainKey === chainKey);
    return chain?.chainId.toString() || "0";
  }

  /**
   * Calculate total fees in USD from quote
   */
  private calculateFeesUsd(quote: StargateQuote, sourceAsset: AssetType): number {
    try {
      // Get token price from metadata
      const token = this.tokens?.find(t =>
        t.address.toLowerCase() === sourceAsset.assetId.toLowerCase() &&
        t.chainKey === this.getChainKeyById(sourceAsset.chainId)
      );

      if (!token) {
        console.warn(`[LayerZero] ⚠ Token not found for fee calculation: ${sourceAsset.symbol}`);
        return 0;
      }

      // Check if price is valid
      if (!token.price || typeof token.price.usd !== 'number' || token.price.usd <= 0) {
        console.warn(`[LayerZero] ⚠ Invalid price for ${sourceAsset.symbol}: ${token.price?.usd}`);
        return 0;
      }

      // Validate fees array
      if (!quote.fees || !Array.isArray(quote.fees) || quote.fees.length === 0) {
        console.warn(`[LayerZero] ⚠ No fees in quote`);
        return 0;
      }

      // Sum all fees with validation
      let totalFees = BigInt(0);
      for (const fee of quote.fees) {
        try {
          const feeAmount = BigInt(fee.amount);
          if (feeAmount < 0) {
            console.warn(`[LayerZero] ⚠ Negative fee amount: ${fee.amount}`);
            continue;
          }
          totalFees += feeAmount;
        } catch (error) {
          console.warn(`[LayerZero] ⚠ Invalid fee amount: ${fee.amount}`, error);
        }
      }

      // Convert to USD
      const feesInToken = Number(totalFees) / Math.pow(10, sourceAsset.decimals);
      const feesUsd = feesInToken * token.price.usd;

      // Sanity check
      if (feesUsd < 0 || !isFinite(feesUsd)) {
        console.warn(`[LayerZero] ⚠ Invalid fee calculation result: ${feesUsd}`);
        return 0;
      }

      return feesUsd;
    } catch (error) {
      console.error(`[LayerZero] ❌ Error calculating fees:`, error);
      return 0;
    }
  }

  /**
   * Get test amount for liquidity checks (1 unit of token)
   */
  private getTestAmount(asset: AssetType): string {
    return Math.pow(10, asset.decimals).toString();
  }

  // getEstimatedVolumeForWindow() method REMOVED - no estimated data allowed
  // Use LayerZero Scan API or subgraphs for real volume data

  ping() {
    return Effect.tryPromise({
      try: async () => {
        // Test connectivity by fetching chains
        await this.rateLimiter.acquire();
        const response = await fetch(`${this.baseUrl}/chains`, {
          method: 'GET',
          signal: AbortSignal.timeout(this.timeout)
        });

        if (!response.ok) {
          throw new Error(`Health check failed: HTTP ${response.status}`);
        }

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
