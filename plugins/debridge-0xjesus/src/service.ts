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
 * Implements configurable rate limiting with token bucket algorithm
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
    this.tokens = 0; // Reset after waiting
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
 * deBridge-specific API types
 */
interface DebridgeTokenAmount {
  address: string;
  chainId: number;
  decimals: number;
  name: string;
  symbol: string;
  amount: string;
  recommendedAmount?: string;
  maxTheoreticalAmount?: string;
  approximateUsdValue?: number;
  recommendedApproximateUsdValue?: number;
  maxTheoreticalApproximateUsdValue?: number;
  approximateOperatingExpense?: string;
  mutatedWithOperatingExpense?: boolean;
  originApproximateUsdValue?: number;
}

interface DebridgeCostsDetail {
  chain: string;
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  amountOut: string;
  type: string;
  payload?: Record<string, unknown>;
}

interface DebridgeQuoteEstimation {
  srcChainTokenIn: DebridgeTokenAmount;
  dstChainTokenOut: DebridgeTokenAmount;
  costsDetails?: DebridgeCostsDetail[];
  recommendedSlippage?: number;
}

interface DebridgeQuoteResponse {
  estimation?: DebridgeQuoteEstimation | null;
}

interface DebridgeTokenInfo {
  symbol: string;
  name: string;
  decimals: number;
  address: string;
}

interface DebridgeTokenListResponse {
  tokens: Record<string, DebridgeTokenInfo>;
}

interface DebridgeSupportedChainsResponse {
  chains: Array<number | string>;
}

interface DefiLlamaBridgeResponse {
  id: string;
  displayName: string;
  lastDailyVolume: number;
  weeklyVolume: number;
  monthlyVolume: number;
}


/**
 * Data Provider Service for deBridge
 *
 * Implements the contract to fetch real-time market data from the deBridge DLN API.
 * This implementation replaces a previously deficient one.
 */
export class DataProviderService {
  private static readonly DEFAULT_BASE_URL = "https://dln.debridge.finance/v1.0";
  private static readonly DEFAULT_DEFILLAMA_BASE_URL = "https://bridges.llama.fi";
  private static readonly DEFAULT_ACCOUNT = "0x1111111111111111111111111111111111111111";
  private static readonly TOKEN_LIST_TTL = 5 * 60 * 1000; // 5 minutes

  private readonly baseUrl: string;
  private readonly defillamaBaseUrl: string;
  private readonly apiKey: string;
  private readonly timeout: number;
  private rateLimiter: RateLimiter;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAYS = [1000, 2000, 4000];
  private readonly DEBRIDGE_LLAMA_ID = "20";
  private volumeCache: { data: DefiLlamaBridgeResponse | null; fetchedAt: number } | null = null;
  private readonly VOLUME_CACHE_TTL = 10 * 60 * 1000; // 10 minutes
  private tokenListCache = new Map<string, { assets: AssetType[]; fetchedAt: number }>();

  constructor(
    baseUrl: string, // Should be https://dln.debridge.finance/v1.0
    defillamaBaseUrl: string, // From ENV - not hardcoded
    apiKey: string, // Not used for deBridge public API
    timeout: number,
    maxRequestsPerSecond: number = 10
  ) {
    this.baseUrl = this.sanitizeHttpUrl(
      baseUrl,
      DataProviderService.DEFAULT_BASE_URL,
      "baseUrl",
    );
    this.defillamaBaseUrl = this.sanitizeHttpUrl(
      defillamaBaseUrl,
      DataProviderService.DEFAULT_DEFILLAMA_BASE_URL,
      "defillamaBaseUrl",
    );
    this.apiKey = apiKey?.trim?.() ?? "not-required";
    this.timeout = timeout;
    this.rateLimiter = new RateLimiter(maxRequestsPerSecond, maxRequestsPerSecond);
    console.log("[deBridge] Service configuration", {
      baseUrl: this.baseUrl,
      defillamaBaseUrl: this.defillamaBaseUrl,
      timeout: this.timeout,
      maxRequestsPerSecond,
    });
  }

  getSnapshot(params: {
    routes: Array<{ source: AssetType; destination: AssetType }>;
    notionals: string[];
    includeWindows?: Array<"24h" | "7d" | "30d">;
  }) {
    return Effect.tryPromise({
      try: async () => {
        console.log(`[deBridge] Fetching snapshot for ${params.routes.length} routes`);

        const volumes = await this.getVolumes(params.includeWindows || ["24h"]).catch((error) => {
          this.raiseStepError("getVolumes", error);
        });
        const rates = await this.getRates(params.routes, params.notionals).catch((error) => {
          this.raiseStepError("getRates", error);
        });
        const liquidity = await this.getLiquidityDepth(params.routes).catch((error) => {
          this.raiseStepError("getLiquidityDepth", error);
        });
        const listedAssets = await this.getListedAssets(params.routes).catch((error) => {
          this.raiseStepError("getListedAssets", error);
        });

        return {
          volumes,
          rates,
          liquidity,
          listedAssets,
        } satisfies ProviderSnapshotType;
      },
      catch: (error: unknown) =>
        new Error(`Failed to fetch snapshot: ${error instanceof Error ? error.message : String(error)}`, {
          cause: (() => {
            const message = error instanceof Error ? error.message : String(error);
            console.error("[deBridge] Snapshot computation failed:", message);
            if (error instanceof Error && error.stack) {
              process.stderr.write(`[deBridge] Snapshot stack\n${error.stack}\n`);
            }
            return error instanceof Error ? error : undefined;
          })(),
        })
    });
  }

  private async getVolumes(windows: Array<"24h" | "7d" | "30d">): Promise<VolumeWindowType[]> {
    try {
      const bridgeData = await this.fetchDefiLlamaVolumes();
      if (!bridgeData) {
        console.warn("[deBridge] No volume data available from DefiLlama");
        return [];
      }

      const volumes: VolumeWindowType[] = [];
      const now = new Date().toISOString();

      for (const window of windows) {
        let volumeUsd: number | undefined;
        switch (window) {
          case "24h":
            volumeUsd = bridgeData.lastDailyVolume;
            break;
          case "7d":
            volumeUsd = bridgeData.weeklyVolume;
            break;
          case "30d":
            volumeUsd = bridgeData.monthlyVolume;
            break;
        }
        if (volumeUsd !== undefined) {
          volumes.push({ window, volumeUsd, measuredAt: now });
          console.log(`[deBridge] Volume ${window}: $${volumeUsd.toLocaleString()}`);
        }
      }
      return volumes;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("[deBridge] Failed to fetch volumes from DefiLlama:", message);
      return [];
    }
  }

  private raiseStepError(step: string, error: unknown): never {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[deBridge] ${step} failed:`, message);
    throw error instanceof Error
      ? new Error(`${step} failed: ${message}`, { cause: error })
      : new Error(`${step} failed: ${message}`);
  }

  private async getRates(
    routes: Array<{ source: AssetType; destination: AssetType }>,
    notionals: string[]
  ): Promise<RateType[]> {
    const rates: RateType[] = [];

    for (const route of routes) {
      for (const notional of notionals) {
        try {
          const atomicAmount = this.toAtomicAmount(notional, route.source.decimals);
          if (!atomicAmount) {
            console.warn(
              `[deBridge] Skipping notional "${notional}" for ${route.source.symbol} -> ${route.destination.symbol}: invalid amount`,
            );
            continue;
          }

          const quote = await this.fetchQuoteWithRetry(route.source, route.destination, atomicAmount);
          const estimation = quote?.estimation;
          if (!estimation) {
            continue;
          }

          const srcToken = estimation.srcChainTokenIn;
          const dstToken = estimation.dstChainTokenOut;

          const amountInRaw = srcToken?.amount ?? notional;
          const amountOutRaw = dstToken?.recommendedAmount ?? dstToken?.amount;

          if (!amountInRaw || !amountOutRaw) {
            continue;
          }

          const amountInNormalized = this.normalizeTokenAmount(amountInRaw, srcToken.decimals);
          const amountOutNormalized = this.normalizeTokenAmount(amountOutRaw, dstToken.decimals);

          if (amountInNormalized === null || amountInNormalized === 0 || amountOutNormalized === null) {
            continue;
          }

          const approximateInUsd = this.toNumber(
            srcToken.approximateUsdValue ?? srcToken.originApproximateUsdValue
          );
          const approximateOutUsd = this.toNumber(
            dstToken.recommendedApproximateUsdValue ??
            dstToken.approximateUsdValue ??
            dstToken.maxTheoreticalApproximateUsdValue
          );

          const totalFeesUsd =
            approximateInUsd !== null && approximateOutUsd !== null
              ? Math.max(approximateInUsd - approximateOutUsd, 0)
              : null;

          rates.push({
            source: route.source,
            destination: route.destination,
            amountIn: amountInRaw,
            amountOut: amountOutRaw,
            effectiveRate: amountOutNormalized / amountInNormalized,
            totalFeesUsd,
            quotedAt: new Date().toISOString(),
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          console.error(
            `[deBridge] Failed to get rate for ${route.source.symbol} -> ${route.destination.symbol}: ${message}`,
          );
        }
      }
    }

    return rates;
  }

  private async getLiquidityDepth(
    routes: Array<{ source: AssetType; destination: AssetType }>
  ): Promise<LiquidityDepthType[]> {
    const liquidity: LiquidityDepthType[] = [];

    for (const route of routes) {
      try {
        let referenceAmount = '0';
        try {
          const decimals = BigInt(route.source.decimals);
          referenceAmount = (1000n * (10n ** decimals)).toString();
        } catch {
          referenceAmount = '1000000000000';
        }

        const quote = await this.fetchQuoteWithRetry(route.source, route.destination, referenceAmount);
        const estimation = quote?.estimation;
        if (!estimation) {
          continue;
        }

        const srcToken = estimation.srcChainTokenIn;
        const dstToken = estimation.dstChainTokenOut;

        const srcAmount = srcToken?.amount ?? referenceAmount;
        const recommendedDest = dstToken?.recommendedAmount ?? dstToken?.amount;
        const maxDest = dstToken?.maxTheoreticalAmount ?? recommendedDest;

        if (!srcAmount || !recommendedDest) {
          continue;
        }

        let maxSource = srcAmount;
        if (maxDest && recommendedDest !== '0') {
          try {
            const srcBig = BigInt(srcAmount);
            const recommendedBig = BigInt(recommendedDest);
            const maxBig = BigInt(maxDest);
            if (recommendedBig > 0n) {
              maxSource = ((srcBig * maxBig) / recommendedBig).toString();
            }
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            console.warn(
              "[deBridge] Failed to compute max source for liquidity thresholds:",
              message,
            );
          }
        }

        liquidity.push({
          route,
          thresholds: [
            {
              maxAmountIn: srcAmount,
              slippageBps: 50,
            },
            {
              maxAmountIn: maxSource,
              slippageBps: 100,
            }
          ],
          measuredAt: new Date().toISOString(),
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(
          `[deBridge] Failed to fetch liquidity for ${route.source.symbol}: ${message}`,
        );
      }
    }

    return liquidity;
  }

  private async getListedAssets(
    routes: Array<{ source: AssetType; destination: AssetType }>,
  ): Promise<ListedAssetsType> {
    const measuredAt = new Date().toISOString();

    const chainIds = new Set<string>(
      routes.flatMap((route) => [route.source.chainId, route.destination.chainId]),
    );

    const assets: AssetType[] = [];
    const seen = new Set<string>();

    for (const chainId of chainIds) {
      const chainIdStr = String(chainId);
      if (!chainIdStr) {
        continue;
      }

      const cached = this.tokenListCache.get(chainIdStr);
      if (cached && Date.now() - cached.fetchedAt < DataProviderService.TOKEN_LIST_TTL) {
        for (const token of cached.assets) {
          const key = `${chainIdStr}:${token.assetId.toLowerCase()}`;
          if (seen.has(key)) continue;
          seen.add(key);
          assets.push(token);
        }
        continue;
      }

      try {
        const tokenList = await this.fetchJson<DebridgeTokenListResponse>(
          `${this.baseUrl}/token-list?chainId=${encodeURIComponent(chainIdStr)}`,
        );
        const tokens = tokenList?.tokens;
        if (!tokens) {
          continue;
        }

        const chainAssets: AssetType[] = [];
        for (const token of Object.values(tokens)) {
          if (!token?.address) {
            continue;
          }

          const assetId = token.address.toLowerCase();
          const key = `${chainIdStr}:${assetId}`;
          if (seen.has(key)) {
            continue;
          }
          seen.add(key);

          const decimalsRaw =
            typeof token.decimals === "number"
              ? token.decimals
              : Number.parseInt(String(token.decimals ?? "18"), 10);
          const decimals = Number.isFinite(decimalsRaw) ? decimalsRaw : 18;

          const asset: AssetType = {
            chainId: chainIdStr,
            assetId,
            symbol: token.symbol ?? token.address,
            decimals,
          };
          chainAssets.push(asset);
          assets.push(asset);
        }

        this.tokenListCache.set(chainIdStr, {
          assets: chainAssets,
          fetchedAt: Date.now(),
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.warn(
          `[deBridge] Token list fetch failed for chain ${chainIdStr}: ${message}`,
        );
      }
    }

    return {
      assets,
      measuredAt,
    };
  }

  private async fetchQuoteWithRetry(
    source: AssetType,
    destination: AssetType,
    amount: string
  ): Promise<DebridgeQuoteResponse | null> {
    const authorityAddress = DataProviderService.DEFAULT_ACCOUNT;
    const recipientAddress = DataProviderService.DEFAULT_ACCOUNT;

    const params = new URLSearchParams({
      srcChainId: source.chainId,
      dstChainId: destination.chainId,
      srcChainTokenIn: source.assetId.toLowerCase(),
      srcChainTokenInAmount: amount,
      dstChainTokenOut: destination.assetId.toLowerCase(),
      dstChainTokenOutAmount: "auto",
      affiliateFeeBps: "0",
      slippageBps: "100",
      srcChainTokenInSenderAddress: authorityAddress,
      dstChainTokenOutReceiver: recipientAddress,
      srcChainOrderAuthorityAddress: authorityAddress,
      dstChainOrderAuthorityAddress: authorityAddress,
      dstChainTokenOutRecipient: recipientAddress,
      senderAddress: authorityAddress,
      prependOperatingExpenses: "true",
    });
    const url = `${this.baseUrl}/dln/order/create-tx?${params.toString()}`;

    try {
      const payload = await this.fetchJson<DebridgeQuoteResponse>(url);
      if (!payload?.estimation) {
        console.warn("[deBridge] Quote response missing estimation:", {
          source: source.symbol,
          destination: destination.symbol,
        });
        return null;
      }
      return payload;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[deBridge] Quote request failed: ${url} - ${message}`);
      return null;
    }
  }

  private async fetchDefiLlamaVolumes(): Promise<DefiLlamaBridgeResponse | null> {
    if (this.volumeCache && Date.now() - this.volumeCache.fetchedAt < this.VOLUME_CACHE_TTL) {
      return this.volumeCache.data;
    }

    const sanitizedBase = this.defillamaBaseUrl.replace(/\/$/, "");
    const url = `${sanitizedBase}/bridge/${this.DEBRIDGE_LLAMA_ID}`;

    try {
      const raw = await this.fetchJson<unknown>(url);
      const data = this.parseDefiLlamaResponse(raw);

      if (!data) {
        console.warn("[deBridge] DefiLlama response missing required fields");
        this.volumeCache = { data: null, fetchedAt: Date.now() };
        return null;
      }

      this.volumeCache = { data, fetchedAt: Date.now() };
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[deBridge] DefiLlama request failed: ${url} - ${message}`);
      return null;
    }
  }

  private async fetchWithRetry(url: string, options: RequestInit = {}, attempt = 0): Promise<Response> {
    await this.rateLimiter.acquire();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      console.log("[deBridge] HTTP request", { url, attempt });
      const headers = new Headers(options.headers ?? {});

      if (!headers.has("Accept")) {
        headers.set("Accept", "application/json");
      }

      const trimmedApiKey = this.apiKey?.trim?.();
      if (trimmedApiKey && trimmedApiKey !== "not-required") {
        headers.set("x-api-key", trimmedApiKey);
      }

      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorBody = "";
        try {
          errorBody = await response.text();
        } catch {
          // ignore read errors
        }
        const err = new Error(
          `HTTP ${response.status}: ${response.statusText}${errorBody ? ` - ${errorBody}` : ""}`,
        );
        (err as Error & { status?: number }).status = response.status;
        throw err;
      }

      return response;
    } catch (error) {
      clearTimeout(timeoutId);

      const status = (error as { status?: number } | undefined)?.status;
      if (status === 400 || status === 404) {
        const message = error instanceof Error ? error.message : String(error);
        console.warn(
          `[deBridge] Request failed without retry (status ${status}): ${url} - ${message}`,
        );
        throw error instanceof Error ? error : new Error(message);
      }

      if (attempt < this.MAX_RETRIES - 1) {
        const delay =
          status === 429 ? Math.max(this.RETRY_DELAYS[attempt], 10_000) : this.RETRY_DELAYS[attempt];
        const message = error instanceof Error ? error.message : String(error);
        console.warn(
          `[deBridge] Request failed (attempt ${attempt + 1}): ${url} - ${message}`,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.fetchWithRetry(url, options, attempt + 1);
      }

      const message = error instanceof Error ? error.message : String(error);
      console.error(`[deBridge] Request permanently failed: ${url} - ${message}`);
      throw new Error(`Request failed for ${url}: ${message}`, {
        cause: error instanceof Error ? error : undefined,
      });
    }
  }

  private async fetchJson<T>(url: string, options: RequestInit = {}): Promise<T> {
    const response = await this.fetchWithRetry(url, options);
    return (await response.json()) as T;
  }

  private normalizeTokenAmount(amount: string, decimals: number): number | null {
    if (!amount) {
      return null;
    }

    const numeric = Number.parseFloat(amount);
    if (!Number.isFinite(numeric)) {
      return null;
    }

    return numeric / Math.pow(10, decimals);
  }

  private toNumber(value: unknown): number | null {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string") {
      const parsed = Number.parseFloat(value);
      return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
  }

  private toAtomicAmount(value: string, decimals: number): string | null {
    if (!value) {
      return null;
    }

    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    const parts = trimmed.split(".");
    if (parts.length > 2) {
      return null;
    }

    const [wholePartRaw, fractionRaw = ""] = parts;
    const wholePart = wholePartRaw.replace(/^0+(?=\d)/, "");
    const fraction = fractionRaw.slice(0, decimals);

    const scale = 10n ** BigInt(decimals);
    let amount = BigInt(0);

    if (wholePart) {
      try {
        amount += BigInt(wholePart) * scale;
      } catch {
        return null;
      }
    }

    if (fraction) {
      const paddedFraction = (fraction + "0".repeat(decimals)).slice(0, decimals);
      try {
        amount += BigInt(paddedFraction);
      } catch {
        return null;
      }
    }

    return amount.toString();
  }

  private parseDefiLlamaResponse(raw: unknown): DefiLlamaBridgeResponse | null {
    if (!raw || typeof raw !== "object") {
      return null;
    }

    const candidate = raw as Record<string, unknown>;

    const toNumeric = (input: unknown): number | null => {
      if (typeof input === "number" && Number.isFinite(input)) {
        return input;
      }
      if (typeof input === "string") {
        const parsed = Number.parseFloat(input);
        return Number.isFinite(parsed) ? parsed : null;
      }
      return null;
    };

    const lastDailyVolume = toNumeric(candidate.lastDailyVolume);
    const weeklyVolume = toNumeric(candidate.weeklyVolume ?? candidate.lastWeeklyVolume);
    const monthlyVolume = toNumeric(candidate.monthlyVolume ?? candidate.lastMonthlyVolume);

    if (
      lastDailyVolume === null ||
      weeklyVolume === null ||
      monthlyVolume === null
    ) {
      return null;
    }

    const id = typeof candidate.id === "string" ? candidate.id : String(candidate.id ?? "");
    const displayName = typeof candidate.displayName === "string" ? candidate.displayName : id;

    return {
      id,
      displayName,
      lastDailyVolume,
      weeklyVolume,
      monthlyVolume,
    };
  }

  ping() {
    return Effect.tryPromise({
      try: async () => {
        const response = await this.fetchWithRetry(`${this.baseUrl}/supported-chains`);
        if (response.ok) {
          return { status: "ok" as const, timestamp: new Date().toISOString() };
        }
        throw new Error(`API returned ${response.status}`);
      },
      catch: (error: unknown) => new Error(`Health check failed: ${error instanceof Error ? error.message : String(error)}`)
    });
  }

  private sanitizeHttpUrl(input: string, fallback: string, label: string): string {
    const trimmed = input?.trim?.();
    if (!trimmed) {
      console.warn(`[deBridge] Missing ${label}, falling back to ${fallback}`);
      return fallback;
    }

    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol === "http:" || parsed.protocol === "https:") {
        return parsed.toString().replace(/\/$/, "");
      }

      console.warn(
        `[deBridge] ${label} must be http(s). Received protocol "${parsed.protocol}", falling back to ${fallback}`,
      );
      return fallback;
    } catch (error) {
      console.warn(
        `[deBridge] Invalid ${label} "${trimmed}", falling back to ${fallback}`,
        error instanceof Error ? error.message : error,
      );
      return fallback;
    }
  }
}
