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
   * Fetch liquidity depth using the /limits endpoint
   * The limits endpoint directly provides:
   * - maxDepositInstant: Instant transfer limit (~0 slippage)
   * - maxDepositShortDelay: Short delay limit (~low slippage)
   * - maxDeposit: Maximum transfer amount (higher slippage acceptable)
   * 
   * We map these to approximate slippage thresholds:
   * - maxDepositInstant ≈ 50bps slippage
   * - maxDepositShortDelay ≈ 100bps slippage
   */
  private async getLiquidityDepth(
    routes: Array<{ source: AssetType; destination: AssetType }>
  ): Promise<LiquidityDepthType[]> {
    const liquidityData: LiquidityDepthType[] = [];

    for (const route of routes) {
      try {
        // Fetch limits - this gives us the liquidity thresholds directly
        const limits = await this.fetchLimits(route.source, route.destination);
        
        // Use the limits as our liquidity depth thresholds
        // maxDepositInstant represents the amount for fastest fills (low slippage)
        // maxDepositShortDelay represents the amount for slightly slower fills (moderate slippage)
        liquidityData.push({
          route,
          thresholds: [
            { 
              maxAmountIn: limits.maxDepositInstant, 
              slippageBps: 50 // Instant transfers typically have minimal slippage
            },
            { 
              maxAmountIn: limits.maxDepositShortDelay, 
              slippageBps: 100 // Short delay transfers have slightly higher slippage
            },
          ],
          measuredAt: new Date().toISOString(),
        });
      } catch (error) {
        console.warn(`[Across] Failed to fetch liquidity limits for route`, error);
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
   * Fetch list of assets supported by Across
   * 
   * Uses a simple heuristic approach for token metadata:
   * - Well-known tokens are identified by address
   * - Unknown tokens fallback to address prefix and default decimals
   * 
   * This approach is fast, reliable, and doesn't depend on RPC calls.
   */
  private async getListedAssets(): Promise<ListedAssetsType> {
    const url = new URL(`${this.baseUrl}/available-routes`);
    const routes = await this.fetchJson<AcrossRoute[]>(url);

    // Extract unique assets from routes
    const uniqueTokens = new Map<string, { chainId: string; address: string }>();

    for (const route of routes) {
      // Note: We include all routes, not just enabled ones, to get complete asset list
      // The enabled flag is checked elsewhere when validating actual transfers
      
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

    console.log(`[Across] Found ${uniqueTokens.size} unique tokens from ${routes.length} routes`);

    // Build assets with inferred metadata
    const assets: AssetType[] = [];
    for (const [key, token] of uniqueTokens.entries()) {
      const metadata = this.inferTokenMetadata(token.address);
      
      assets.push({
        chainId: token.chainId,
        assetId: token.address,
        symbol: metadata.symbol,
        decimals: metadata.decimals,
      });
    }

    return {
      assets,
      measuredAt: new Date().toISOString(),
    };
  }

  /**
   * Infer token metadata from well-known addresses
   * This is a simple, fast approach that works for major tokens
   */
  private inferTokenMetadata(address: string): { symbol: string; decimals: number } {
    const addr = address.toLowerCase();
    
    // Well-known token addresses (case-insensitive)
    const KNOWN_TOKENS: Record<string, { symbol: string; decimals: number }> = {
      // USDC variants
      '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': { symbol: 'USDC', decimals: 6 }, // Ethereum
      '0x2791bca1f2de4661ed88a30c99a7a9449aa84174': { symbol: 'USDC', decimals: 6 }, // Polygon
      '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8': { symbol: 'USDC', decimals: 6 }, // Arbitrum
      '0x7f5c764cbc14f9669b88837ca1490cca17c31607': { symbol: 'USDC', decimals: 6 }, // Optimism
      '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913': { symbol: 'USDC', decimals: 6 }, // Base
      '0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e': { symbol: 'USDC', decimals: 6 }, // Avalanche
      
      // USDT variants
      '0xdac17f958d2ee523a2206206994597c13d831ec7': { symbol: 'USDT', decimals: 6 }, // Ethereum
      '0xc2132d05d31c914a87c6611c10748aeb04b58e8f': { symbol: 'USDT', decimals: 6 }, // Polygon
      '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9': { symbol: 'USDT', decimals: 6 }, // Arbitrum
      '0x94b008aa00579c1307b0ef2c499ad98a8ce58e58': { symbol: 'USDT', decimals: 6 }, // Optimism
      
      // WETH variants
      '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2': { symbol: 'WETH', decimals: 18 }, // Ethereum
      '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619': { symbol: 'WETH', decimals: 18 }, // Polygon
      '0x82af49447d8a07e3bd95bd0d56f35241523fbab1': { symbol: 'WETH', decimals: 18 }, // Arbitrum
      '0x4200000000000000000000000000000000000006': { symbol: 'WETH', decimals: 18 }, // Optimism & Base
      '0x49d5c2bdffac6ce2bfdb6640f4f80f226bc10bab': { symbol: 'WETH', decimals: 18 }, // Avalanche
      
      // DAI variants
      '0x6b175474e89094c44da98b954eedeac495271d0f': { symbol: 'DAI', decimals: 18 }, // Ethereum
      '0x8f3cf7ad23cd3cadbd9735aff958023239c6a063': { symbol: 'DAI', decimals: 18 }, // Polygon
      '0xda10009cbd5d07dd0cecc66161fc93d7c9000da1': { symbol: 'DAI', decimals: 18 }, // Arbitrum & Optimism
      '0x50c5725949a6f0c72e6c4a641f24049a917db0cb': { symbol: 'DAI', decimals: 18 }, // Base
      
      // WBTC variants
      '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599': { symbol: 'WBTC', decimals: 8 }, // Ethereum
      '0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6': { symbol: 'WBTC', decimals: 8 }, // Polygon
      '0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f': { symbol: 'WBTC', decimals: 8 }, // Arbitrum
      '0x68f180fcce6836688e9084f035309e29bf0a2095': { symbol: 'WBTC', decimals: 8 }, // Optimism
      
      // UMA
      '0x04fa0d235c4abf4bcf4787af4cf447de572ef828': { symbol: 'UMA', decimals: 18 }, // Ethereum
      
      // ACX (Across token)
      '0x44108f0223a3c3028f5fe7aec7f9bb2e66bef82f': { symbol: 'ACX', decimals: 18 }, // Ethereum
      
      // BAL (Balancer)
      '0xba100000625a3754423978a60c9317c58a424e3d': { symbol: 'BAL', decimals: 18 }, // Ethereum
      
      // POOL (PoolTogether)
      '0x0cec1a9154ff802e7934fc916ed7ca50bde6844e': { symbol: 'POOL', decimals: 18 }, // Ethereum
    };

    if (KNOWN_TOKENS[addr]) {
      return KNOWN_TOKENS[addr];
    }

    // Default fallback: use address prefix and 18 decimals
    return {
      symbol: addr.slice(0, 10),
      decimals: 18,
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

      return await response.json();
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
