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

// Li.Fi API Response Types
interface LiFiChain {
  id: number;
  name: string;
  key: string;
  chainType: string;
  nativeToken: {
    symbol: string;
    decimals: number;
    address: string;
    name: string;
    priceUSD?: string;
  };
  mainnet: boolean;
}

interface LiFiToken {
  address: string;
  symbol: string;
  decimals: number;
  chainId: number;
  name: string;
  priceUSD?: string;
  logoURI?: string;
}

interface LiFiQuoteEstimate {
  fromAmount: string;
  toAmount: string;
  toAmountMin: string;
  approvalAddress: string;
  feeCosts?: Array<{
    name: string;
    description?: string;
    token: {
      address: string;
      symbol: string;
      decimals: number;
    };
    amount: string;
    amountUSD?: string;
  }>;
  gasCosts?: Array<{
    type: string;
    price: string;
    estimate: string;
    limit: string;
    amount: string;
    amountUSD?: string;
    token: {
      address: string;
      symbol: string;
      decimals: number;
    };
  }>;
  executionDuration?: number;
}

interface LiFiQuote {
  id: string;
  type: string;
  tool: string;
  toolDetails: {
    key: string;
    name: string;
    logoURI: string;
  };
  action: {
    fromChainId: number;
    toChainId: number;
    fromToken: LiFiToken;
    toToken: LiFiToken;
    fromAmount: string;
    slippage: number;
    fromAddress: string;
    toAddress: string;
  };
  estimate: LiFiQuoteEstimate;
}

interface LiFiTool {
  key: string;
  name: string;
  logoURI: string;
  supportedChains: number[];
}

interface DefiLlamaBridgeResponse {
    id: string;
    displayName: string;
    lastDailyVolume: number;
    lastWeeklyVolume: number;
    lastMonthlyVolume: number;
}

class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly maxTokens: number;
  private readonly refillRate: number;

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

export class DataProviderService {
  private readonly rateLimiter: RateLimiter;
  private chains: LiFiChain[] | null = null;
  private tokens: Map<number, LiFiToken[]> | null = null;
  private tools: { bridges: LiFiTool[], exchanges: LiFiTool[] } | null = null;

  private readonly LIFI_LLAMA_ID = "lifi";
  private volumeCache: { data: DefiLlamaBridgeResponse | null; fetchedAt: number } | null = null;
  private readonly VOLUME_CACHE_TTL = 10 * 60 * 1000; // 10 minutes
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAYS = [1000, 2000, 4000];

  constructor(
    private readonly baseUrl: string,
    private readonly defillamaBaseUrl: string,
    private readonly apiKey: string,
    private readonly timeout: number,
    maxRequestsPerSecond: number = 10
  ) {
    this.rateLimiter = new RateLimiter(maxRequestsPerSecond, maxRequestsPerSecond / 2);
  }

  ping() {
    return Effect.tryPromise({
      try: async () => ({ status: 'ok' as const, timestamp: new Date().toISOString() }),
      catch: (error) => { throw error; },
    });
  }

  getSnapshot(params: {
    routes: Array<{ source: AssetType; destination: AssetType }>;
    notionals: string[];
    includeWindows?: Array<"24h" | "7d" | "30d">;
  }) {
    return Effect.tryPromise({
      try: async () => {
        const { routes, notionals, includeWindows = ["24h"] } = params;
        await this.ensureMetadataLoaded();
        const [volumes, rates, liquidity, listedAssets] = await Promise.all([
          this.getVolumes(includeWindows),
          this.getRates(routes, notionals),
          this.getLiquidity(routes),
          this.getListedAssets(),
        ]);
        return { volumes, rates, liquidity, listedAssets } satisfies ProviderSnapshotType;
      },
      catch: (error) => {
        console.error('[Li.Fi] getSnapshot failed:', error);
        return new Error(error instanceof Error ? error.message : String(error));
      },
    });
  }

  private async getVolumes(windows: Array<"24h" | "7d" | "30d">): Promise<VolumeWindowType[]> {
    try {
      const bridgeData = await this.fetchDefiLlamaVolumes();
      if (!bridgeData) {
        console.warn("[Li.Fi] No volume data available from DefiLlama");
        return [];
      }
      const volumes: VolumeWindowType[] = [];
      const now = new Date().toISOString();
      for (const window of windows) {
        let volumeUsd: number | undefined;
        switch (window) {
          case "24h": volumeUsd = bridgeData.lastDailyVolume; break;
          case "7d": volumeUsd = bridgeData.lastWeeklyVolume; break;
          case "30d": volumeUsd = bridgeData.lastMonthlyVolume; break;
        }
        if (volumeUsd !== undefined) {
          volumes.push({ window, volumeUsd, measuredAt: now });
        }
      }
      return volumes;
    } catch (error) {
      console.error("[Li.Fi] Failed to fetch volumes from DefiLlama:", error);
      return [];
    }
  }

  private async getRates(
    routes: Array<{ source: AssetType; destination: AssetType }>,
    notionals: string[]
  ): Promise<RateType[]> {
    const rates: RateType[] = [];
    for (const route of routes) {
      for (const notional of notionals) {
        try {
          const quote = await this.fetchQuoteWithRetry(route.source, route.destination, notional);
          if (quote && quote.estimate) {
            const fromAmount = BigInt(quote.estimate.fromAmount);
            const toAmount = BigInt(quote.estimate.toAmount);
            const effectiveRate = (Number(toAmount) / Math.pow(10, route.destination.decimals)) /
                                 (Number(fromAmount) / Math.pow(10, route.source.decimals));
            const totalFeesUsd = this.calculateFeesUsd(quote);
            rates.push({
              source: route.source,
              destination: route.destination,
              amountIn: quote.estimate.fromAmount,
              amountOut: quote.estimate.toAmount,
              effectiveRate,
              totalFeesUsd,
              quotedAt: new Date().toISOString(),
            });
          }
        } catch (error) {
          console.error(`[Li.Fi] Failed to get quote for route:`, error);
        }
      }
    }
    return rates;
  }

  private calculateFeesUsd(quote: LiFiQuote): number | null {
    try {
      let totalUsd = 0;
      if (quote.estimate.feeCosts) {
        for (const fee of quote.estimate.feeCosts) {
          if (fee.amountUSD) totalUsd += parseFloat(fee.amountUSD);
        }
      }
      if (quote.estimate.gasCosts) {
        for (const gas of quote.estimate.gasCosts) {
          if (gas.amountUSD) totalUsd += parseFloat(gas.amountUSD);
        }
      }
      return totalUsd > 0 ? totalUsd : null;
    } catch (error) {
      console.error('[Li.Fi] Error calculating fees:', error);
      return null;
    }
  }

  private async getLiquidity(
    routes: Array<{ source: AssetType; destination: AssetType }>
  ): Promise<LiquidityDepthType[]> {
    const liquidity: LiquidityDepthType[] = [];
    for (const route of routes) {
      try {
        // Find max amounts for 50bps and 100bps slippage thresholds
        const maxAt50bps = await this.findMaxAmountForSlippage(route, 50);
        const maxAt100bps = await this.findMaxAmountForSlippage(route, 100);

        if (maxAt50bps !== null && maxAt100bps !== null) {
          liquidity.push({
            route,
            thresholds: [
              { maxAmountIn: maxAt50bps, slippageBps: 50 },
              { maxAmountIn: maxAt100bps, slippageBps: 100 }
            ],
            measuredAt: new Date().toISOString(),
          });
        }
      } catch (error) {
        console.error(`[Li.Fi] Failed to get liquidity for route:`, error);
      }
    }
    return liquidity;
  }

  /**
   * Find the maximum amount that can be traded while keeping slippage within the threshold
   * Uses progressive testing with amounts: 100, 1K, 10K, 100K, 500K, 1M, 5M, 10M
   */
  private async findMaxAmountForSlippage(
    route: { source: AssetType; destination: AssetType },
    slippageBps: number
  ): Promise<string | null> {
    const maxSlippage = slippageBps / 10000; // Convert bps to decimal (50bps = 0.005)

    // Test amounts in ascending order (in whole units, will be converted to smallest units)
    const testAmountsInUnits = [100, 1000, 10000, 100000, 500000, 1000000, 5000000, 10000000];

    // Get baseline rate with smallest amount to use as reference
    const baselineAmountStr = (BigInt(100) * BigInt(10 ** route.source.decimals)).toString();
    const baselineQuote = await this.fetchQuoteWithRetry(route.source, route.destination, baselineAmountStr);

    if (!baselineQuote || !baselineQuote.estimate) {
      console.warn('[Li.Fi] Failed to get baseline quote for liquidity depth');
      return null;
    }

    const baselineRate = this.calculateNormalizedRate(
      baselineQuote.estimate.fromAmount,
      baselineQuote.estimate.toAmount,
      route.source.decimals,
      route.destination.decimals
    );

    if (baselineRate === 0) {
      console.warn('[Li.Fi] Baseline rate is zero, cannot calculate slippage');
      return null;
    }

    let maxValidAmount: string | null = baselineAmountStr;

    // Test progressively larger amounts
    for (const amountInUnits of testAmountsInUnits) {
      const amountStr = (BigInt(amountInUnits) * BigInt(10 ** route.source.decimals)).toString();

      try {
        const quote = await this.fetchQuoteWithRetry(route.source, route.destination, amountStr);

        if (!quote || !quote.estimate) {
          // No quote available at this amount, stop testing
          break;
        }

        const actualRate = this.calculateNormalizedRate(
          quote.estimate.fromAmount,
          quote.estimate.toAmount,
          route.source.decimals,
          route.destination.decimals
        );

        // Calculate slippage: (baselineRate - actualRate) / baselineRate
        const slippage = Math.abs((baselineRate - actualRate) / baselineRate);

        if (slippage <= maxSlippage) {
          // This amount is within acceptable slippage
          maxValidAmount = amountStr;
        } else {
          // Slippage exceeded, stop testing larger amounts
          break;
        }
      } catch (error) {
        // Error getting quote at this amount, stop testing
        console.warn(`[Li.Fi] Failed to get quote for amount ${amountInUnits}:`, error);
        break;
      }
    }

    return maxValidAmount;
  }

  /**
   * Calculate normalized exchange rate accounting for token decimals
   */
  private calculateNormalizedRate(
    fromAmount: string,
    toAmount: string,
    fromDecimals: number,
    toDecimals: number
  ): number {
    const fromBigInt = BigInt(fromAmount);
    const toBigInt = BigInt(toAmount);

    if (fromBigInt === BigInt(0)) return 0;

    // Normalize: (toAmount / 10^toDecimals) / (fromAmount / 10^fromDecimals)
    // = (toAmount * 10^fromDecimals) / (fromAmount * 10^toDecimals)
    const numerator = Number(toBigInt) / Math.pow(10, toDecimals);
    const denominator = Number(fromBigInt) / Math.pow(10, fromDecimals);

    return numerator / denominator;
  }

  private async getListedAssets(): Promise<ListedAssetsType> {
    await this.ensureMetadataLoaded();
    const assets: AssetType[] = [];
    if (this.tokens) {
      for (const [chainId, tokenList] of this.tokens.entries()) {
        for (const token of tokenList) {
          assets.push({
            chainId: chainId.toString(),
            assetId: token.address,
            symbol: token.symbol,
            decimals: token.decimals,
          });
        }
      }
    }
    return { assets, measuredAt: new Date().toISOString() };
  }
  
  private async fetchWithRetry(url: string, options: RequestInit = {}, attempt = 0): Promise<Response> {
    await this.rateLimiter.acquire();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeoutId);
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (attempt < this.MAX_RETRIES - 1) {
        const delay = this.RETRY_DELAYS[attempt];
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.fetchWithRetry(url, options, attempt + 1);
      }
      throw error;
    }
  }

  private async fetchDefiLlamaVolumes(): Promise<DefiLlamaBridgeResponse | null> {
    if (this.volumeCache && (Date.now() - this.volumeCache.fetchedAt) < this.VOLUME_CACHE_TTL) {
      return this.volumeCache.data;
    }
    const url = `${this.defillamaBaseUrl}/bridge/${this.LIFI_LLAMA_ID}`;
    try {
      const response = await this.fetchWithRetry(url);
      const data: DefiLlamaBridgeResponse = await response.json();
      this.volumeCache = { data, fetchedAt: Date.now() };
      return data;
    } catch (error) {
      console.error(`[Li.Fi] DefiLlama request failed: ${url}`, error);
      return null;
    }
  }

  private async fetchQuoteWithRetry(
    source: AssetType,
    destination: AssetType,
    amount: string,
    maxRetries: number = 3
  ): Promise<LiFiQuote | null> {
    const url = new URL(`${this.baseUrl}/quote`);
    url.searchParams.set('fromChain', source.chainId);
    url.searchParams.set('toChain', destination.chainId);
    url.searchParams.set('fromToken', source.assetId);
    url.searchParams.set('toToken', destination.assetId);
    url.searchParams.set('fromAmount', amount);
    url.searchParams.set('fromAddress', '0x0000000000000000000000000000000000000001');
    const headers: HeadersInit = { 'Accept': 'application/json' };
    if (this.apiKey && this.apiKey !== 'not-required') {
      headers['x-lifi-api-key'] = this.apiKey;
    }
    try {
        const response = await this.fetchWithRetry(url.toString(), { headers });
        return await response.json() as LiFiQuote;
    } catch (error) {
        console.error(`[Li.Fi] Failed after ${maxRetries} retries:`, error);
        return null;
    }
  }

  private async ensureMetadataLoaded(): Promise<void> {
    if (!this.chains || !this.tokens) {
        const [chains, tokens] = await Promise.all([
            this.fetchChainsWithRetry(),
            this.fetchTokensWithRetry()
        ]);
        this.chains = chains;
        this.tokens = tokens;
    }
  }

  private async fetchChainsWithRetry(maxRetries: number = 3): Promise<LiFiChain[]> {
    try {
        const response = await this.fetchWithRetry(`${this.baseUrl}/chains`);
        const data = await response.json() as { chains: LiFiChain[] };
        return data.chains;
    } catch (error) {
        console.error('[Li.Fi] Failed to fetch chains:', error);
        return [];
    }
  }

  private async fetchTokensWithRetry(maxRetries: number = 3): Promise<Map<number, LiFiToken[]>> {
    try {
        const response = await this.fetchWithRetry(`${this.baseUrl}/tokens`);
        const data = await response.json() as { tokens: Record<string, LiFiToken[]> };
        const tokenMap = new Map<number, LiFiToken[]>();
        for (const [chainIdStr, tokens] of Object.entries(data.tokens)) {
          tokenMap.set(parseInt(chainIdStr), tokens);
        }
        return tokenMap;
    } catch (error) {
        console.error('[Li.Fi] Failed to fetch tokens:', error);
        return new Map();
    }
  }
}