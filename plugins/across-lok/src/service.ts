import { Effect } from "every-plugin/effect";
import type { z } from "every-plugin/zod";
import { fetchTokenMetadata, fetchTokenMetadataBatch } from "./utils/tokenMetadata";

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
 * Across API response types
 */
interface AcrossRoute {
  originChainId: number;
  originToken: string;
  destinationChainId: number;
  destinationToken: string;
  enabled: boolean;
}

interface AcrossSuggestedFees {
  capitalFeePct: string;
  capitalFeeTotal: string;
  relayGasFeePct: string;
  relayGasFeeTotal: string;
  relayFeePct: string;
  relayFeeTotal: string;
  lpFeePct: string;
  lpFeeTotal: string;
  timestamp: string;
  isAmountTooLow: boolean;
  quoteBlock: string;
  spokePoolAddress: string;
  expectedFillTimeSec: number;
  outputAmount: string;
  totalRelayFee: {
    pct: string;
    total: string;
  };
}

interface AcrossLimits {
  minDeposit: string;
  maxDeposit: string;
  maxDepositInstant: string;
  maxDepositShortDelay: string;
}

interface FeeComparison {
  amount: string;
  amountDecimal: number;
  fees: AcrossSuggestedFees;
  totalFeesUsd: number | null;
  effectiveRate: number;
  feeBreakdown: {
    capitalFeePct: number;
    relayGasFeePct: number;
    lpFeePct: number;
    totalRelayFeePct: number;
  };
}

/**
 * Data Provider Service for Across Protocol
 */
export class DataProviderService {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string,
    private readonly timeout: number
  ) { }

  /**
   * Get complete snapshot of provider data for given routes and notionals.
   */
  getSnapshot(params: {
    routes?: Array<{ source: AssetType; destination: AssetType }>;
    notionals?: string[];
    includeWindows?: Array<"24h" | "7d" | "30d">;
  }) {
    return Effect.tryPromise({
      try: async () => {
        const hasRoutes = params.routes && params.routes.length > 0;
        const hasNotionals = params.notionals && params.notionals.length > 0;

        console.log(`[Across] Fetching snapshot for ${params.routes?.length || 0} routes`);

        const [volumes, rates, liquidity, listedAssets] = await Promise.all([
          this.getVolumes(params.includeWindows || ["24h"]),
          hasRoutes && hasNotionals ? this.getRates(params.routes!, params.notionals!) : Promise.resolve([]),
          hasRoutes ? this.getLiquidityDepth(params.routes!) : Promise.resolve([]),
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
   * Fetch volume metrics for specified time windows.
   * 
   * IMPORTANT: Across API does NOT expose public volume endpoints.
   * This returns 0 with clear documentation that volume data is not available.
   * 
   * To get real volume data, integrate with:
   * - DefiLlama API: https://api.llama.fi/protocol/across-protocol
   * - Dune Analytics: Custom query with API key
   * - On-chain aggregation: Query SpokePool events across all chains
   */
  private async getVolumes(windows: Array<"24h" | "7d" | "30d">): Promise<VolumeWindowType[]> {
    console.warn('[Across] Volume data not available - Across API does not provide volume endpoints');
    console.warn('[Across] To get real volume, integrate DefiLlama, Dune Analytics, or on-chain aggregation');

    // Return 0 to indicate unavailable data
    // Dashboard should handle this and show "Data Not Available"
    return windows.map(window => ({
      window,
      volumeUsd: 0, // Set to 0 to indicate unavailable data
      measuredAt: new Date().toISOString(),
    }));
  }

  /**
   * Fetch rate quotes for route/notional combinations using Across suggested-fees API
   */
  private async getRates(
    routes: Array<{ source: AssetType; destination: AssetType }>, 
    notionals: string[]
  ): Promise<RateType[]> {
    const rates: RateType[] = [];

    for (const route of routes) {
      for (const notional of notionals) {
        try {
          const quote = await this.fetchQuote(
            route.source,
            route.destination,
            notional
          );
          rates.push(quote);
        } catch (error) {
          console.warn(`[Across] Failed to fetch rate for route`, error);
          // Continue with other routes even if one fails
        }
      }
    }

    return rates;
  }

  /**
   * Fetch a single quote from Across API
   */
  private async fetchQuote(
    source: AssetType,
    destination: AssetType,
    amount: string
  ): Promise<RateType> {
    const data = await this.fetchSuggestedFees(source, destination, amount);

    // Calculate effective rate with decimal normalization
    const amountInDecimal = this.toDecimal(amount, source.decimals);
    const amountOutDecimal = this.toDecimal(data.outputAmount, destination.decimals);
    const effectiveRate = amountInDecimal > 0 ? amountOutDecimal / amountInDecimal : 0;

    // Calculate total fees in USD (approximate based on input amount)
    const totalFeesUsd = this.calculateTotalFeesUsd(data, amountInDecimal, source.symbol);

    return {
      source,
      destination,
      amountIn: amount,
      amountOut: data.outputAmount,
      effectiveRate,
      totalFeesUsd,
      quotedAt: new Date().toISOString(),
    };
  }

  /**
   * Fetch liquidity depth at 50bps and 100bps thresholds using binary search
   */
  private async getLiquidityDepth(
    routes: Array<{ source: AssetType; destination: AssetType }>
  ): Promise<LiquidityDepthType[]> {
    const liquidityData: LiquidityDepthType[] = [];

    for (const route of routes) {
      try {
        // Fetch limits first to understand the range
        const limits = await this.fetchLimits(route.source, route.destination);
        
        // Base amount for reference rate (1% of max)
        const baseAmount = BigInt(limits.maxDeposit) / 100n;
        
        // Get reference rate with small amount
        const baseQuote = await this.fetchQuote(route.source, route.destination, baseAmount.toString());
        const baseRate = baseQuote.effectiveRate;

        // Binary search for 50bps (0.5%) slippage threshold
        const max50bps = await this.findMaxAmountForSlippage(
          route.source,
          route.destination,
          baseRate,
          BigInt(baseAmount.toString()),
          BigInt(limits.maxDeposit),
          50 // 50 bps
        );

        // Binary search for 100bps (1.0%) slippage threshold
        const max100bps = await this.findMaxAmountForSlippage(
          route.source,
          route.destination,
          baseRate,
          BigInt(baseAmount.toString()),
          BigInt(limits.maxDeposit),
          100 // 100 bps
        );

        liquidityData.push({
          route,
          thresholds: [
            { maxAmountIn: max50bps.toString(), slippageBps: 50 },
            { maxAmountIn: max100bps.toString(), slippageBps: 100 },
          ],
          measuredAt: new Date().toISOString(),
        });
      } catch (error) {
        console.warn(`[Across] Failed to calculate liquidity depth for route`, error);
        // Provide fallback with conservative estimates
        liquidityData.push({
      route,
      thresholds: [
            { maxAmountIn: "1000000000000000000", slippageBps: 50 }, // 1 unit
            { maxAmountIn: "10000000000000000000", slippageBps: 100 }, // 10 units
          ],
          measuredAt: new Date().toISOString(),
        });
      }
    }

    return liquidityData;
  }

  /**
   * Fetch suggested fees for multiple test amounts and compare them
   * This complements liquidity determination by showing how fees vary across different amounts
   */
  async compareFeesAcrossAmounts(
    route: { source: AssetType; destination: AssetType },
    testAmounts: string[]
  ): Promise<FeeComparison[]> {
    const comparisons: FeeComparison[] = [];

    for (const amount of testAmounts) {
      try {
        const fees = await this.fetchSuggestedFees(
          route.source,
          route.destination,
          amount
        );

        const amountInDecimal = this.toDecimal(amount, route.source.decimals);
        const amountOutDecimal = this.toDecimal(fees.outputAmount, route.destination.decimals);
        const effectiveRate = amountInDecimal > 0 ? amountOutDecimal / amountInDecimal : 0;
        const totalFeesUsd = this.calculateTotalFeesUsd(fees, amountInDecimal, route.source.symbol);

        comparisons.push({
          amount,
          amountDecimal: amountInDecimal,
          fees,
          totalFeesUsd,
          effectiveRate,
          feeBreakdown: {
            capitalFeePct: parseFloat(fees.capitalFeePct),
            relayGasFeePct: parseFloat(fees.relayGasFeePct),
            lpFeePct: parseFloat(fees.lpFeePct),
            totalRelayFeePct: parseFloat(fees.totalRelayFee.pct),
          },
        });

        // Small delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.warn(`[Across] Failed to fetch fees for amount ${amount}`, error);
      }
    }

    return comparisons;
  }

  /**
   * Fetch suggested fees from Across API (raw response)
   * Returns the full fee breakdown structure
   */
  private async fetchSuggestedFees(
    source: AssetType,
    destination: AssetType,
    amount: string
  ): Promise<AcrossSuggestedFees> {
    const url = new URL(`${this.baseUrl}/suggested-fees`);
    url.searchParams.set('inputToken', source.assetId);
    url.searchParams.set('outputToken', destination.assetId);
    url.searchParams.set('originChainId', source.chainId);
    url.searchParams.set('destinationChainId', destination.chainId);
    url.searchParams.set('amount', amount);

    return this.fetchJson<AcrossSuggestedFees>(url);
  }

  /**
   * Fetch deposit limits from Across API
   */
  private async fetchLimits(source: AssetType, destination: AssetType): Promise<AcrossLimits> {
    const url = new URL(`${this.baseUrl}/limits`);
    url.searchParams.set('token', source.assetId);
    url.searchParams.set('originChainId', source.chainId);
    url.searchParams.set('destinationChainId', destination.chainId);

    return this.fetchJson<AcrossLimits>(url);
  }

  /**
   * Binary search to find maximum amount for given slippage threshold
   */
  private async findMaxAmountForSlippage(
    source: AssetType,
    destination: AssetType,
    baseRate: number,
    minAmount: bigint,
    maxAmount: bigint,
    thresholdBps: number
  ): Promise<bigint> {
    const maxIterations = 15; // Limit iterations to prevent excessive API calls
    let lo = minAmount;
    let hi = maxAmount;
    let result = minAmount;

    for (let i = 0; i < maxIterations; i++) {
      if (lo > hi) break;

      const mid = (lo + hi) / 2n;
      
      try {
        const quote = await this.fetchQuote(source, destination, mid.toString());
        const slippageBps = this.calculateSlippageBps(baseRate, quote.effectiveRate);

        if (slippageBps <= thresholdBps) {
          result = mid;
          lo = mid + 1n;
        } else {
          hi = mid - 1n;
        }

        // Small delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        // If quote fails (amount too high), search lower
        hi = mid - 1n;
      }
    }

    return result;
  }

  /**
   * Calculate slippage in basis points
   */
  private calculateSlippageBps(baseRate: number, actualRate: number): number {
    if (baseRate === 0) return 0;
    return Math.round(((baseRate - actualRate) / baseRate) * 10000);
  }

  /**
   * Fetch list of assets supported by Across with REAL on-chain metadata
   */
  private async getListedAssets(): Promise<ListedAssetsType> {
    const url = new URL(`${this.baseUrl}/available-routes`);
    const routes = await this.fetchJson<AcrossRoute[]>(url);

    // Extract unique assets from routes
    const uniqueTokens = new Map<string, { chainId: string; address: string }>();

    for (const route of routes) {
      if (!route.enabled) continue;

      const originKey = `${route.originChainId}-${route.originToken}`;
      const destKey = `${route.destinationChainId}-${route.destinationToken}`;

      if (!uniqueTokens.has(originKey)) {
        uniqueTokens.set(originKey, {
          chainId: route.originChainId.toString(),
          address: route.originToken,
        });
      }

      if (!uniqueTokens.has(destKey)) {
        uniqueTokens.set(destKey, {
          chainId: route.destinationChainId.toString(),
          address: route.destinationToken,
        });
      }
    }

    // Fetch REAL metadata from blockchain in batch
    // Gracefully falls back to showing address if RPC unavailable
    console.log(`[Across] Fetching real token metadata for ${uniqueTokens.size} tokens from blockchain...`);
    
    const tokenList = Array.from(uniqueTokens.values());
    const metadataMap = await fetchTokenMetadataBatch(tokenList);

    // Build assets with real metadata or graceful fallback
    const assets: AssetType[] = [];
    for (const [key, token] of uniqueTokens.entries()) {
      const metadata = metadataMap.get(`${token.chainId}:${token.address.toLowerCase()}`);
      
      if (metadata) {
        // ✅ REAL DATA from blockchain
        assets.push({
          chainId: token.chainId,
          assetId: token.address,
          symbol: metadata.symbol,
          decimals: metadata.decimals,
        });
      } else {
        // Graceful fallback if RPC unavailable (e.g., in tests or network issues)
        assets.push({
          chainId: token.chainId,
          assetId: token.address,
          symbol: token.address.slice(0, 10), // Show first 10 chars of address
          decimals: 18, // Safe default for most ERC20 tokens
        });
      }
    }

    return {
      assets,
      measuredAt: new Date().toISOString(),
    };
  }

  /**
   * Convert raw token amount to decimal
   */
  private toDecimal(raw: string, decimals: number): number {
    try {
      const value = BigInt(raw);
      const divisor = BigInt(10 ** decimals);
      const intPart = value / divisor;
      const fracPart = value % divisor;
      return Number(intPart) + Number(fracPart) / Number(divisor);
    } catch {
      return 0;
    }
  }

  /**
   * Calculate total fees in USD (approximate)
   */
  private calculateTotalFeesUsd(fees: AcrossSuggestedFees, amountDecimal: number, symbol: string): number | null {
    try {
      // For stablecoins, assume 1:1 with USD
      const isStablecoin = ['USDC', 'USDT', 'DAI', 'BUSD'].includes(symbol.toUpperCase());
      
      if (isStablecoin) {
        const feePct = parseFloat(fees.totalRelayFee.pct);
        return amountDecimal * feePct;
      }

      // For non-stablecoins, we'd need price oracle data
      // Return null to indicate we can't determine USD value without price feed
      return null;
    } catch {
      return null;
    }
  }

  // REMOVED: inferSymbolFromAddress and inferDecimalsFromToken
  // Now using REAL on-chain data via fetchTokenMetadata()

  /**
   * Generic HTTP client helper for fetching JSON from Across API
   */
  private async fetchJson<T>(url: URL): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: this.getHeaders(),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      return await response.json() as T;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timeout after ${this.timeout}ms`);
      }
      throw error;
    }
  }

  /**
   * Get HTTP headers for Across API requests
   */
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    return headers;
  }

  ping() {
    return Effect.tryPromise({
      try: async () => {
        // Test connection to Across API
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
          const response = await fetch(`${this.baseUrl}/available-routes`, {
            method: 'GET',
            headers: this.getHeaders(),
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            throw new Error(`Across API health check failed: ${response.status}`);
          }

        return {
          status: "ok" as const,
          timestamp: new Date().toISOString(),
        };
        } finally {
          clearTimeout(timeoutId);
        }
      },
      catch: (error: unknown) => new Error(`Health check failed: ${error instanceof Error ? error.message : String(error)}`)
    });
  }
}
