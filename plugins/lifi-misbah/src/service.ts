import { Effect } from "every-plugin/effect";
import type { z } from "every-plugin/zod";

import type {
  Asset,
  Rate,
  LiquidityDepth,
  VolumeWindow,
  ListedAssets,
  ProviderSnapshot
} from "./contract";

type AssetType = z.infer<typeof Asset>;
type RateType = z.infer<typeof Rate>;
type LiquidityDepthType = z.infer<typeof LiquidityDepth>;
type VolumeWindowType = z.infer<typeof VolumeWindow>;
type ListedAssetsType = z.infer<typeof ListedAssets>;
type ProviderSnapshotType = z.infer<typeof ProviderSnapshot>;

/**
 * Simple rate limiter to prevent hitting API rate limits
 */
class RateLimiter {
  private queue: Array<() => void> = [];
  private running = 0;
  private readonly maxConcurrent: number;
  private readonly minDelay: number;

  constructor(maxConcurrent: number = 3, minDelay: number = 500) {
    this.maxConcurrent = maxConcurrent;
    this.minDelay = minDelay;
  }

  async acquire(): Promise<void> {
    return new Promise((resolve) => {
      this.queue.push(resolve);
      this.process();
    });
  }

  private async process(): Promise<void> {
    if (this.running >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    this.running++;
    const resolve = this.queue.shift();
    if (resolve) {
      resolve();
      await new Promise((r) => setTimeout(r, this.minDelay));
      this.running--;
      this.process();
    }
  }
}

/**
 * Retry helper with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000,
  backoffMultiplier: number = 2
): Promise<T> {
  let lastError: Error | unknown;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        break;
      }
      
      // Calculate delay: initialDelay * (backoffMultiplier ^ attempt)
      const delay = initialDelay * Math.pow(backoffMultiplier, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

export class DataProviderService {
  private readonly rateLimiter: RateLimiter;

  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string,
    private readonly timeout: number
  ) {
    // Initialize rate limiter: max 3 concurrent requests, 500ms minimum delay (to avoid 429s)
    this.rateLimiter = new RateLimiter(3, 500);
  }

  /**
   * Main entry point — builds the full ProviderSnapshot for NEAR dashboard.
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

        console.log("[LiFiService] Building snapshot...");

        const [volumes, rates, liquidity, listedAssets] = await Promise.all([
          this.getVolumes(params.includeWindows || ["24h", "7d", "30d"]),
          hasRoutes && hasNotionals ? this.getRates(params.routes!, params.notionals!) : Promise.resolve([]),
          hasRoutes ? this.getLiquidityDepth(params.routes!) : Promise.resolve([]),
          this.getListedAssets()
        ]);

        console.log("✅ [getSnapshot] Rates fetched:", rates.length);
        console.log("✅ [getSnapshot] Snapshot ready.");

        return { volumes, rates, liquidity, listedAssets };
      },
      catch: (error: unknown) => new Error(`Failed to fetch snapshot: ${String(error)}`)
    });
}

  /**
   * Fetches real volume data from Li.Fi analytics API.
   * Uses /v1/analytics/transfers endpoint to get transfer data and aggregate volume.
   */
  private async getVolumes(windows: Array<"24h" | "7d" | "30d">): Promise<VolumeWindowType[]> {
    const results: VolumeWindowType[] = [];
    const now = Math.floor(Date.now() / 1000); // Current Unix timestamp in seconds

    for (const window of windows) {
      try {
        // Calculate time range in seconds
        let fromTimestamp: number;
        switch (window) {
          case "24h":
            fromTimestamp = now - (24 * 60 * 60); // 24 hours ago
            break;
          case "7d":
            fromTimestamp = now - (7 * 24 * 60 * 60); // 7 days ago
            break;
          case "30d":
            fromTimestamp = now - (30 * 24 * 60 * 60); // 30 days ago
            break;
        }

        const baseUrl = this.baseUrl.replace(/\/$/, "");
        // Request maximum 1000 transfers per window (API limit)
        const url = `${baseUrl}/analytics/transfers?fromTimestamp=${fromTimestamp}&toTimestamp=${now}&limit=1000`;

        // Apply rate limiting and retry logic
        await this.rateLimiter.acquire();

        const res = await retryWithBackoff(async () => {
          const fetchRes = await fetch(url, {
            headers: {
              accept: "application/json",
              ...(this.apiKey ? { "x-lifi-api-key": this.apiKey } : {}),
            },
            signal: AbortSignal.timeout(this.timeout),
          });

          // Handle rate limiting (429) - wait longer before retry
          if (fetchRes.status === 429) {
            const retryAfter = fetchRes.headers.get('Retry-After');
            const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 5000;
            await new Promise((resolve) => setTimeout(resolve, waitTime));
            throw new Error(`API rate limited (429), retrying after ${waitTime}ms`);
          }

          if (!fetchRes.ok) {
            throw new Error(`API request failed with status ${fetchRes.status}`);
          }

          return fetchRes;
        }, 3, 2000, 2);

        const data: any = await res.json();

        // Aggregate volume from transfers
        // Sum up sending.amountUSD from all transfers (USD value of tokens sent)
        let totalVolume = 0;
        let transferCount = 0;
        let validTransferCount = 0;
        
        if (data.transfers && Array.isArray(data.transfers)) {
          transferCount = data.transfers.length;
          
          for (const transfer of data.transfers) {
            if (transfer.sending?.amountUSD) {
              const amount = Number(transfer.sending.amountUSD);
              if (!isNaN(amount) && amount > 0) {
                totalVolume += amount;
                validTransferCount++;
              }
            }
          }
        }

        // Log volume calculation details
        console.log(`📊 [getVolumes] ${window} window: ${validTransferCount}/${transferCount} valid transfers, total volume: $${totalVolume.toFixed(2)}${transferCount >= 1000 ? ' (max 1000 transfers reached)' : ''}`);

        results.push({
          window,
          volumeUsd: totalVolume,
          measuredAt: new Date().toISOString(),
        });
      } catch (err) {
        // On error, return 0 volume for this window (graceful degradation)
        // This ensures we always return data even if API fails
        console.error(`⚠️ [getVolumes] Failed to fetch ${window} volume:`, (err as Error).message);
        results.push({
          window,
          volumeUsd: 0,
          measuredAt: new Date().toISOString(),
        });
      }
    }

    return results;
  }

  /**
   * Queries Li.Fi quote API for real-time bridge/swap rates.
   */
  
private async getRates(
  routes: Array<{ source: AssetType; destination: AssetType }>,
  notionals: string[]
): Promise<RateType[]> {
  const rates: RateType[] = [];

  for (const route of routes) {
    for (const notional of notionals) {
      const fromAddress = "0x1111111254EEB25477B68fb85Ed929f73A960582";
      const slippage = 0.003;

      // Convert notional from token units to smallest units
      const notionalNum = Number(notional);
      if (isNaN(notionalNum) || notionalNum <= 0) {
        continue;
      }

      // Convert to smallest units: multiply by 10^decimals
      const fromAmount = Math.floor(notionalNum * Math.pow(10, route.source.decimals)).toString();

      // Normalize addresses to lowercase (LiFi API accepts lowercase)
      const fromToken = route.source.assetId.toLowerCase();
      const toToken = route.destination.assetId.toLowerCase();
      const toAddress = fromAddress;

             const baseUrl = this.baseUrl.replace(/\/$/, "");
       // Build URL - try without integrator/fee first (they're optional)
       const url = `${baseUrl}/quote?fromChain=${route.source.chainId}&toChain=${route.destination.chainId}&fromToken=${fromToken}&toToken=${toToken}&fromAmount=${fromAmount}&fromAddress=${fromAddress}&toAddress=${toAddress}&slippage=${slippage}`;

       try {
         // Apply rate limiting and retry logic
         await this.rateLimiter.acquire();
         
                   const res = await retryWithBackoff(async () => {
            const fetchRes = await fetch(url, {
              headers: {
                accept: "application/json",
                ...(this.apiKey ? { "x-lifi-api-key": this.apiKey } : {}),
              },
              signal: AbortSignal.timeout(this.timeout)
            });
            
            // Handle rate limiting (429) - wait longer before retry
            if (fetchRes.status === 429) {
              const retryAfter = fetchRes.headers.get('Retry-After');
              const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 5000;
              await new Promise((resolve) => setTimeout(resolve, waitTime));
              throw new Error(`API rate limited (429), retrying after ${waitTime}ms`);
            }
            
            // Throw error if not ok so retry logic can catch it
            if (!fetchRes.ok) {
              throw new Error(`API request failed with status ${fetchRes.status}`);
            }
            
            return fetchRes;
          }, 3, 2000, 2); // Start with 2s delay instead of 1s

         // If we get here, the request succeeded after retries

        let data;
        try {
          data = await res.json();
        } catch (parseError) {
          // If JSON parsing fails, skip this route
          continue;
        }

        // Check if response has the expected structure
        if (!data || typeof data !== 'object') {
          continue;
        }

        // Check for estimate in response
        const est = data?.estimate;
        if (!est || typeof est !== 'object') {
          continue;
        }

        // Try to get amountOut - prefer toAmount, fallback to toAmountMin
        let amountOut = null;
        if (est.toAmount && est.toAmount !== "0" && Number(est.toAmount) > 0) {
          amountOut = est.toAmount;
        } else if (est.toAmountMin && est.toAmountMin !== "0" && Number(est.toAmountMin) > 0) {
          amountOut = est.toAmountMin;
        }
        
        if (!amountOut) {
          continue;
        }

        // Get amountIn - prefer from estimate, fallback to requested amount
        const amountIn = (est.fromAmount && est.fromAmount !== "0") ? est.fromAmount : fromAmount;
        if (!amountIn || amountIn === "0" || Number(amountIn) === 0) {
          continue;
        }
        
        // Calculate effective rate accounting for decimals
        const amountInNum = Number(amountIn) / Math.pow(10, route.source.decimals);
        const amountOutNum = Number(amountOut) / Math.pow(10, route.destination.decimals);
        
        if (amountInNum <= 0 || amountOutNum <= 0) {
          continue;
        }
        
        const effectiveRate = amountOutNum / amountInNum;
        
        const totalFeesUsd =
          (est.feeCosts && Array.isArray(est.feeCosts))
            ? est.feeCosts.reduce(
                (sum: number, f: any) => sum + (Number(f?.amountUSD) || 0),
                0
              )
            : 0;

        const rate: RateType = {
          source: route.source,
          destination: route.destination,
          amountIn: String(amountIn),
          amountOut: String(amountOut),
          effectiveRate,
          totalFeesUsd,
          quotedAt: new Date().toISOString()
        };

        rates.push(rate);
      } catch (err) {
        // Silently continue on error - we'll return whatever rates we managed to collect
        continue;
      }
    }
  }

  return rates;
}



private async getListedAssets(): Promise<ListedAssetsType> {
  try {
    const url = `${this.baseUrl.replace(/\/$/, "")}/tokens`;
    
    // Apply rate limiting and retry logic
    await this.rateLimiter.acquire();
    
         const res = await retryWithBackoff(async () => {
       const fetchRes = await fetch(url, {
         headers: {
           accept: "application/json",
           ...(this.apiKey ? { "x-lifi-api-key": this.apiKey } : {}),
         },
         signal: AbortSignal.timeout(this.timeout),
       });
       
       // Handle rate limiting (429) - wait longer before retry
       if (fetchRes.status === 429) {
         const retryAfter = fetchRes.headers.get('Retry-After');
         const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 5000;
         await new Promise((resolve) => setTimeout(resolve, waitTime));
         throw new Error(`API rate limited (429), retrying after ${waitTime}ms`);
       }
       
       if (!fetchRes.ok) {
         throw new Error(`API request failed with status ${fetchRes.status}`);
       }
       
       return fetchRes;
     }, 3, 2000, 2); // Start with 2s delay instead of 1s

    const text = await res.text();
    if (!res.ok) {
      console.error("❌ Failed to fetch /tokens:", res.status, text);
      return { assets: [], measuredAt: new Date().toISOString() };
    }

    const data = JSON.parse(text);

    // Handle both `{ "1": [...] }` and `{ tokens: { "1": [...] } }`
    const tokenRoot =
      data.tokens && typeof data.tokens === "object" ? data.tokens : data;
    const allTokens = Object.values(tokenRoot).flat() as any[];

    const assets = allTokens
      .filter((t) => t?.address && t?.symbol)
      .map((t) => ({
        chainId: String(t.chainId),
        assetId: t.address,
        symbol: t.symbol,
        decimals: Number(t.decimals) || 18,
      }));

    console.log(`✅ Loaded ${assets.length} total tokens from Li.Fi`);
    return { assets, measuredAt: new Date().toISOString() };
  } catch (err) {
    console.error("⚠️ getListedAssets failed:", (err as Error).message);
    return { assets: [], measuredAt: new Date().toISOString() };
  }
}



  /**
   * Measures liquidity depth via quote-based rate decay simulation.
   */
  private async getLiquidityDepth(
    routes: Array<{ source: AssetType; destination: AssetType }>
  ): Promise<LiquidityDepthType[]> {
    const liquidity: LiquidityDepthType[] = [];

    for (const route of routes) {
      // Use 1 token unit as base, then convert to smallest units
      const baseTokenAmount = 1; // 1 token unit
      const baseAmount = Math.floor(baseTokenAmount * Math.pow(10, route.source.decimals)); // Convert to smallest units
      const amounts = [baseAmount, baseAmount * 10, baseAmount * 100];

             const baseUrl = this.baseUrl.replace(/\/$/, "");
       const quotes = await Promise.all(
         amounts.map(async (amt) => {
           const fromAddress = "0x1111111254EEB25477B68fb85Ed929f73A960582";
           const toAddress = fromAddress;
           const slippage = 0.5;
           // Normalize addresses to lowercase
           const fromToken = route.source.assetId.toLowerCase();
           const toToken = route.destination.assetId.toLowerCase();
           const url = `${baseUrl}/quote?fromChain=${route.source.chainId}&toChain=${route.destination.chainId}&fromToken=${fromToken}&toToken=${toToken}&fromAmount=${amt}&fromAddress=${fromAddress}&toAddress=${toAddress}&slippage=${slippage}`;
           try {
             // Apply rate limiting and retry logic
             await this.rateLimiter.acquire();
             
             const res = await retryWithBackoff(async () => {
               const fetchRes = await fetch(url, {
                 headers: {
                   accept: "application/json",
                   ...(this.apiKey ? { "x-lifi-api-key": this.apiKey } : {}),
                 },
                 signal: AbortSignal.timeout(this.timeout)
               });
               
               // Handle rate limiting (429) - wait longer before retry
               if (fetchRes.status === 429) {
                 const retryAfter = fetchRes.headers.get('Retry-After');
                 const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 5000;
                 await new Promise((resolve) => setTimeout(resolve, waitTime));
                 throw new Error(`API rate limited (429), retrying after ${waitTime}ms`);
               }
               
               if (!fetchRes.ok) {
                 throw new Error(`API request failed with status ${fetchRes.status}`);
               }
               
               return fetchRes;
             }, 3, 2000, 2); // Start with 2s delay instead of 1s
             
             const data: any = await res.json();
             const rate = Number(data?.estimate?.toAmountMin || 0) / amt;
             return { amt, rate };
           } catch (err) {
             console.error(`🔥 [getLiquidityDepth] Exception for amount ${amt}:`, err);
             return { amt, rate: 0 };
           }
         })
       );

      // Calculate rateDiff only if we have valid rates
      // If all quotes failed (rate = 0), use conservative defaults
      const validQuotes = quotes.filter(q => q.rate > 0);
      
      if (validQuotes.length === 0) {
        // All quotes failed - return conservative defaults
        liquidity.push({
          route,
          thresholds: [
            {
              maxAmountIn: (baseAmount * 10).toString(),
              slippageBps: 50,
            },
            {
              maxAmountIn: (baseAmount * 20).toString(),
              slippageBps: 100,
            },
          ],
          measuredAt: new Date().toISOString(),
        });
        continue;
      }

      // Calculate rateDiff using valid quotes
      // Use first and last valid quotes, or first and last if we have all 3
      const firstRate = quotes[0].rate > 0 ? quotes[0].rate : validQuotes[0].rate;
      const lastRate = quotes[2].rate > 0 ? quotes[2].rate : validQuotes[validQuotes.length - 1].rate;
      
      const rateDiff = firstRate > 0 ? (firstRate - lastRate) / firstRate : 0;
      const liquidity50bps = rateDiff < 0.005;
      const liquidity100bps = rateDiff < 0.01;

      liquidity.push({
        route,
        thresholds: [
          {
            maxAmountIn: liquidity50bps
              ? (baseAmount * 100).toString()
              : (baseAmount * 10).toString(),
            slippageBps: 50,
          },
          {
            maxAmountIn: liquidity100bps
              ? (baseAmount * 200).toString()
              : (baseAmount * 20).toString(),
            slippageBps: 100,
          },
        ],
        measuredAt: new Date().toISOString(),
      });
    }

    return liquidity;
  }

  

  /**
   * Simple health check for the plugin runtime.
   */
  ping() {
    return Effect.tryPromise({
      try: async () => {
        await new Promise((r) => setTimeout(r, 10));
        return { status: "ok" as const, timestamp: new Date().toISOString() };
      },
      catch: (e: unknown) =>
        new Error(`Health check failed: ${e instanceof Error ? e.message : String(e)}`),
    });
  }
}
