import type {
  AssetType,
  LiquidityDepthType,
  ListedAssetsType,
  RateType,
  TimeWindow,
  VolumeWindowType
} from "@data-provider/shared-contract";
import { Effect } from "every-plugin/effect";

interface CBridgeChain {
  id: number;
  name: string;
  icon: string;
  gas_token_symbol: string;
  contract_addr: string;
}

interface CBridgeToken {
  token: {
    symbol: string;
    address: string;
    decimal: number;
  };
  name: string;
  icon: string;
}

interface CBridgeTransferConfigs {
  err: null | { msg: string };
  chains: CBridgeChain[];
  chain_token: Record<string, { token: CBridgeToken[] }>;
}

interface CBridgeEstimateResponse {
  err: null | { msg: string };
  eq_value_token_amt: string;
  bridge_rate: number;
  perc_fee: string;
  base_fee: string;
  estimated_receive_amt: string;
  max_slippage?: number;
  slippage_tolerance?: number;
}

interface CBridgeLatencyResponse {
  err: null | { msg: string };
  median_transfer_latency_in_second: number;
}

interface CBridgeStatsResponse {
  totalTxVolume: string;
  last24HourTxVolume: string;
  totalTx: string;
  last24HourTx: string;
}

/**
 * cBridge Data Provider Service - Collects cross-chain bridge metrics from cBridge.
 *
 * API Documentation: https://cbridge-docs.celer.network/developer/api-reference
 * Endpoints:
 * - v2/getTransferConfigsForAll: Get chains and tokens
 * - v2/estimateAmt: Get rate quotes
 */
export class DataProviderService {
  private readonly baseUrl: string;
  private retryCount = 0;
  private readonly maxRetries = 3;

  constructor(
    baseUrl: string,
    private readonly apiKey: string,
    private readonly timeout: number
  ) {
    this.baseUrl = baseUrl || "https://cbridge-prod2.celer.app";
  }

  /**
   * Exponential backoff helper
   */
  private async delay(attempt: number): Promise<void> {
    const baseDelay = 1000; // 1 second
    const delay = baseDelay * Math.pow(2, attempt);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Fetch with retry logic and exponential backoff
   */
  private async fetchWithRetry(url: string, options?: RequestInit): Promise<Response> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.status === 429) {
          // Rate limited
          if (attempt < this.maxRetries - 1) {
            await this.delay(attempt);
            continue;
          }
        }

        if (!response.ok && response.status >= 500) {
          // Server error, retry
          if (attempt < this.maxRetries - 1) {
            await this.delay(attempt);
            continue;
          }
        }

        return response;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (attempt < this.maxRetries - 1) {
          await this.delay(attempt);
          continue;
        }
      }
    }

    throw lastError || new Error('Fetch failed after retries');
  }

  /**
   * Get complete snapshot of provider data for given routes and notionals.
   */
  getSnapshot(params: {
    routes?: Array<{ source: AssetType; destination: AssetType }>;
    notionals?: string[];
    includeWindows?: TimeWindow[];
  }) {
    return Effect.tryPromise({
      try: async () => {
        const hasRoutes = params.routes && params.routes.length > 0;
        const hasNotionals = params.notionals && params.notionals.length > 0;

        const [volumes, listedAssets] = await Promise.all([
          this.getVolumes(params.includeWindows || ["24h"]),
          this.getListedAssets()
        ]);

        const rates = hasRoutes && hasNotionals
          ? await this.getRates(params.routes!, params.notionals!)
          : [];

        const liquidity = hasRoutes
          ? await this.getLiquidityDepth(params.routes!)
          : [];

        return {
          volumes,
          listedAssets,
          ...(rates.length > 0 && { rates }),
          ...(liquidity.length > 0 && { liquidity }),
        };
      },
      catch: (error: unknown) =>
        new Error(`Failed to fetch snapshot: ${error instanceof Error ? error.message : String(error)}`)
    });
  }

  /**
   * Fetch volume metrics for specified time windows.
   * Uses official cBridge statistics API from S3 bucket.
   */
  private async getVolumes(windows: TimeWindow[]): Promise<VolumeWindowType[]> {
    try {
      const response = await this.fetchWithRetry('https://cbridge-stat.s3.us-west-2.amazonaws.com/mainnet/cbridge-stat.json');
      const data = await response.json() as CBridgeStatsResponse;

      const volumes: VolumeWindowType[] = [];

      // Parse 24h volume if requested
      if (windows.includes('24h')) {
        const volume24h = parseFloat(data.last24HourTxVolume.replace(/[$,]/g, ''));
        volumes.push({
          window: '24h',
          volumeUsd: volume24h,
          measuredAt: new Date().toISOString(),
        });
      }

      // Note: Official API only provides 24h data. 7d and 30d would require historical aggregation
      // which is not available from this endpoint. Returning only what's officially available.

      return volumes;
    } catch (error) {
      console.warn(`Error fetching volumes: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  /**
   * Fetch transfer latency for a route
   */
  private async getTransferLatency(srcChainId: string, dstChainId: string): Promise<number | null> {
    try {
      const url = new URL(`${this.baseUrl}/v2/getLatest7DayTransferLatencyForQuery`);
      url.searchParams.append('src_chain_id', srcChainId);
      url.searchParams.append('dst_chain_id', dstChainId);

      const response = await this.fetchWithRetry(url.toString());
      const data = await response.json() as CBridgeLatencyResponse;

      if (data.err) {
        return null;
      }

      return data.median_transfer_latency_in_second;
    } catch (error) {
      console.warn(`Error fetching transfer latency: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }

  /**
   * Fetch rate quotes for route/notional combinations.
   * Uses cBridge's estimateAmt endpoint to get actual quotes.
   */
  private async getRates(
    routes: Array<{ source: AssetType; destination: AssetType }>,
    notionals: string[]
  ): Promise<RateType[]> {
    const rates: RateType[] = [];

    // Cache latencies per route to avoid duplicate requests
    const latencyCache = new Map<string, number | null>();

    for (const route of routes) {
      // Get latency for this route (cached)
      const latencyKey = `${route.source.chainId}-${route.destination.chainId}`;
      if (!latencyCache.has(latencyKey)) {
        const latency = await this.getTransferLatency(route.source.chainId, route.destination.chainId);
        latencyCache.set(latencyKey, latency);
      }

      for (const notional of notionals) {
        try {
          const srcChainId = route.source.chainId;
          const dstChainId = route.destination.chainId;
          const tokenSymbol = route.source.symbol;

          // Use notional as amount in smallest units
          const amt = notional;

          const url = new URL(`${this.baseUrl}/v2/estimateAmt`);
          url.searchParams.append('src_chain_id', srcChainId);
          url.searchParams.append('dst_chain_id', dstChainId);
          url.searchParams.append('token_symbol', tokenSymbol);
          url.searchParams.append('amt', amt);
          url.searchParams.append('usr_addr', '0x0000000000000000000000000000000000000000');
          url.searchParams.append('slippage_tolerance', '5000');

          const response = await this.fetchWithRetry(url.toString());
          const data = await response.json() as CBridgeEstimateResponse;

          if (data.err) {
            console.warn(`Failed to get rate for ${tokenSymbol}: ${data.err.msg}`);
            continue;
          }

          // Calculate effective rate (normalized for decimals)
          const amountIn = BigInt(amt);
          const amountOut = BigInt(data.estimated_receive_amt);
          const effectiveRate = Number(amountOut) / Number(amountIn);

          // Calculate total fees in USD (approximate)
          const baseFee = BigInt(data.base_fee);
          const percFee = BigInt(data.perc_fee);
          const totalFee = baseFee + percFee;
          const totalFeesUsd = Number(totalFee) / Math.pow(10, route.source.decimals);

          const latency = latencyCache.get(latencyKey);

          rates.push({
            source: route.source,
            destination: route.destination,
            amountIn: amt,
            amountOut: data.estimated_receive_amt,
            effectiveRate,
            totalFeesUsd,
            quotedAt: new Date().toISOString(),
            // Store additional cBridge-specific data in a way that doesn't break the contract
            bridgeRate: data.bridge_rate,
            maxSlippage: data.max_slippage,
            estimatedLatencySeconds: latency,
          } as any); // Type assertion since we're adding extra fields
        } catch (error) {
          console.warn(`Error fetching rate: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }

    return rates;
  }

  /**
   * Fetch liquidity depth at 50bps and 100bps thresholds.
   * Simulates liquidity depth by making multiple estimate calls with increasing amounts.
   */
  private async getLiquidityDepth(
    routes: Array<{ source: AssetType; destination: AssetType }>
  ): Promise<LiquidityDepthType[]> {
    const liquidityResults: LiquidityDepthType[] = [];

    for (const route of routes) {
      try {
        const srcChainId = route.source.chainId;
        const dstChainId = route.destination.chainId;
        const tokenSymbol = route.source.symbol;

        // Test amounts: 100, 1000, 10000, 100000 (in token base units)
        const testAmounts = [
          BigInt(100) * BigInt(Math.pow(10, route.source.decimals)),
          BigInt(1000) * BigInt(Math.pow(10, route.source.decimals)),
          BigInt(10000) * BigInt(Math.pow(10, route.source.decimals)),
          BigInt(100000) * BigInt(Math.pow(10, route.source.decimals)),
        ];

        const thresholds: Array<{ maxAmountIn: string; slippageBps: number }> = [];

        for (const amount of testAmounts) {
          try {
            const url = new URL(`${this.baseUrl}/v2/estimateAmt`);
            url.searchParams.append('src_chain_id', srcChainId);
            url.searchParams.append('dst_chain_id', dstChainId);
            url.searchParams.append('token_symbol', tokenSymbol);
            url.searchParams.append('amt', amount.toString());
            url.searchParams.append('usr_addr', '0x0000000000000000000000000000000000000000');
            url.searchParams.append('slippage_tolerance', '5000');

            const response = await this.fetchWithRetry(url.toString());
            const data = await response.json() as CBridgeEstimateResponse;

            if (data.err) continue;

            // Calculate slippage in basis points
            const amountIn = amount;
            const amountOut = BigInt(data.estimated_receive_amt);
            const expectedOut = amountIn; // 1:1 expected
            const slippage = expectedOut > amountOut
              ? Number((expectedOut - amountOut) * BigInt(10000) / expectedOut)
              : 0;

            // Only add if slippage is <= 100bps (1%)
            if (slippage <= 100) {
              thresholds.push({
                maxAmountIn: amount.toString(),
                slippageBps: Math.floor(slippage),
              });
            }
          } catch (error) {
            // Skip this amount on error
            continue;
          }
        }

        if (thresholds.length > 0) {
          liquidityResults.push({
            route: { source: route.source, destination: route.destination },
            thresholds,
            measuredAt: new Date().toISOString(),
          });
        }
      } catch (error) {
        console.warn(`Error measuring liquidity depth: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return liquidityResults;
  }

  /**
   * Fetch list of assets supported by the provider.
   * Uses cBridge's getTransferConfigsForAll endpoint.
   */
  private async getListedAssets(): Promise<ListedAssetsType> {
    try {
      const url = `${this.baseUrl}/v2/getTransferConfigsForAll`;
      const response = await this.fetchWithRetry(url);
      const data = await response.json() as CBridgeTransferConfigs;

      if (data.err) {
        throw new Error(`API error: ${data.err.msg}`);
      }

      const assets: AssetType[] = [];
      const seen = new Set<string>();

      // Extract unique tokens from all chains
      for (const [chainId, chainData] of Object.entries(data.chain_token)) {
        const chain = data.chains.find(c => c.id.toString() === chainId);
        if (!chain) continue;

        for (const tokenData of chainData.token) {
          const key = `${chainId}-${tokenData.token.address}`;
          if (seen.has(key)) continue;
          seen.add(key);

          assets.push({
            chainId: chainId,
            assetId: tokenData.token.address,
            symbol: tokenData.token.symbol,
            decimals: tokenData.token.decimal,
          });
        }
      }

      return {
        assets,
        measuredAt: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(`Failed to fetch assets: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  ping() {
    return Effect.tryPromise({
      try: async () => {
        // Test the connection by fetching transfer configs
        const url = `${this.baseUrl}/v2/getTransferConfigsForAll`;
        const response = await this.fetchWithRetry(url);
        const data = await response.json() as CBridgeTransferConfigs;

        if (data.err) {
          throw new Error(`Ping failed: ${data.err.msg}`);
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
