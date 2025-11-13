import type {
  AssetType,
  LiquidityDepthType,
  ListedAssetsType,
  RateType,
  TimeWindow,
  VolumeWindowType
} from "@data-provider/shared-contract";
import { Effect } from "every-plugin/effect";
import { createHttpClient, createRateLimiter, calculateEffectiveRate } from '@data-provider/plugin-utils';

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

interface DefiLlamaBridgeResponse {
  id: string;
  displayName: string;
  lastDailyVolume: number;
  weeklyVolume: number;
  monthlyVolume: number;
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
  private readonly CBRIDGE_BRIDGE_ID = "10"; // cBridge bridge ID on DefiLlama
  private readonly VOLUME_CACHE_TTL = 10 * 60 * 1000; // 10 minutes
  private volumeCache: { data: DefiLlamaBridgeResponse | null; fetchedAt: number } | null = null;

  private readonly baseUrl: string;
  private http: ReturnType<typeof createHttpClient>;
  private defillamaHttp: ReturnType<typeof createHttpClient>;

  constructor(
    baseUrl: string,
    private readonly defillamaBaseUrl: string,
    private readonly apiKey: string,
    private readonly timeout: number,
    maxRequestsPerSecond: number = 10
  ) {
    this.baseUrl = baseUrl || "https://cbridge-prod2.celer.app";
    // Initialize HTTP client with rate limiting (cBridge currently has NO rate limiting)
    this.http = createHttpClient({
      baseUrl: this.baseUrl,
      rateLimiter: createRateLimiter(maxRequestsPerSecond),
      timeout: this.timeout,
      retries: 3
    });

    // Initialize DefiLlama HTTP client
    this.defillamaHttp = createHttpClient({
      baseUrl: this.defillamaBaseUrl,
      rateLimiter: createRateLimiter(100), // High rate limit for DefiLlama
      timeout: this.timeout,
      retries: 3
    });
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
   * Fetch volume metrics from DefiLlama bridge aggregator.
   */
  private async getVolumes(windows: TimeWindow[]): Promise<VolumeWindowType[]> {
    try {
      const bridgeData = await this.fetchDefiLlamaVolumes();
      if (!bridgeData) {
        console.warn("[cBridge] No volume data available from DefiLlama");
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
            volumeUsd = bridgeData.weeklyVolume || 0;
            break;
          case "30d":
            volumeUsd = bridgeData.monthlyVolume || 0;
            break;
        }
        volumes.push({ window, volumeUsd, measuredAt: now });
        console.log(`[cBridge] Volume ${window}: $${volumeUsd.toLocaleString()}`);
      }
      return volumes;
    } catch (error) {
      console.error("[cBridge] Failed to fetch volumes from DefiLlama:", error);
      // Return zero volumes for each requested window
      return windows.map(window => ({
        window,
        volumeUsd: 0,
        measuredAt: new Date().toISOString()
      }));
    }
  }

  /**
   * Fetch transfer latency for a route
   */
  private async getTransferLatency(srcChainId: string, dstChainId: string): Promise<number | null> {
    try {
      const data = await this.http.get<CBridgeLatencyResponse>('/v2/getLatest7DayTransferLatencyForQuery', {
        params: {
          src_chain_id: srcChainId,
          dst_chain_id: dstChainId
        }
      });

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

          const data = await this.http.get<CBridgeEstimateResponse>('/v2/estimateAmt', {
            params: {
              src_chain_id: srcChainId,
              dst_chain_id: dstChainId,
              token_symbol: tokenSymbol,
              amt: amt,
              usr_addr: '0x0000000000000000000000000000000000000000',
              slippage_tolerance: '5000'
            }
          });

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
          });
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
            const data = await this.http.get<CBridgeEstimateResponse>('/v2/estimateAmt', {
              params: {
                src_chain_id: srcChainId,
                dst_chain_id: dstChainId,
                token_symbol: tokenSymbol,
                amt: amount.toString(),
                usr_addr: '0x0000000000000000000000000000000000000000',
                slippage_tolerance: '5000'
              }
            });

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
      const data = await this.http.get<CBridgeTransferConfigs>('/v2/getTransferConfigsForAll');

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

  /**
   * Fetch volume data from DefiLlama Bridge API with caching and retry logic.
   */
  private async fetchDefiLlamaVolumes(): Promise<DefiLlamaBridgeResponse | null> {
    // Check cache first
    if (this.volumeCache && (Date.now() - this.volumeCache.fetchedAt) < this.VOLUME_CACHE_TTL) {
      console.log("[cBridge] Using cached volume data from DefiLlama");
      return this.volumeCache.data;
    }

    try {
      const data = await this.defillamaHttp.get<DefiLlamaBridgeResponse>(`/bridge/${this.CBRIDGE_BRIDGE_ID}`);

      // Validate response has expected fields
      if (typeof data.lastDailyVolume !== 'number') {
        throw new Error("Invalid response structure from DefiLlama");
      }

      // Cache the result
      this.volumeCache = {
        data,
        fetchedAt: Date.now(),
      };

      console.log(`[cBridge] Successfully fetched volumes from DefiLlama: 24h=$${data.lastDailyVolume.toLocaleString()}`);
      return data;
    } catch (error) {
      console.error(`[cBridge] Failed to fetch volumes from DefiLlama:`, error instanceof Error ? error.message : String(error));

      // Cache the null result to avoid hammering the API
      this.volumeCache = {
        data: null,
        fetchedAt: Date.now(),
      };

      return null;
    }
  }

  ping() {
    return Effect.tryPromise({
      try: async () => {
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
