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
import { SubgraphClient } from "./subgraph";

type AssetType = z.infer<typeof Asset>;
type RateType = z.infer<typeof Rate>;
type LiquidityDepthType = z.infer<typeof LiquidityDepth>;
type VolumeWindowType = z.infer<typeof VolumeWindow>;
type ListedAssetsType = z.infer<typeof ListedAssets>;
type ProviderSnapshotType = z.infer<typeof ProviderSnapshot>;

const CCTP_SUPPORTED_CHAINS: Record<string, { chainId: string; usdcAddress: string; domain: number }> = {
  ethereum: { chainId: "1", usdcAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0c3606eB48", domain: 0 },
  avalanche: { chainId: "43114", usdcAddress: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E", domain: 1 },
  polygon: { chainId: "137", usdcAddress: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359", domain: 2 },
  arbitrum: { chainId: "42161", usdcAddress: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", domain: 3 },
  optimism: { chainId: "10", usdcAddress: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85", domain: 4 },
  base: { chainId: "8453", usdcAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", domain: 6 },
  solana: { chainId: "solana-mainnet", usdcAddress: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", domain: 5 },
};

const USDC_DECIMALS = 6;

export class CCTPService {
  private readonly subgraphClient: SubgraphClient | null;

  constructor(
    private readonly timeout: number,
    private readonly maxRetries: number = 3,
    private readonly requestsPerSecond: number = 5,
    private readonly subgraphApiKey: string | null = null,
    private readonly subgraphBaseUrl: string = "https://gateway.thegraph.com/api"
  ) {
    if (subgraphApiKey) {
      this.subgraphClient = new SubgraphClient({
        apiKey: subgraphApiKey,
        baseUrl: `${subgraphBaseUrl}/${subgraphApiKey}/subgraphs/id`,
        requestsPerSecond: Math.min(5, requestsPerSecond),
        timeout,
      });
    } else {
      this.subgraphClient = null;
    }
  }

  getSnapshot(params: {
    routes: Array<{ source: AssetType; destination: AssetType }>;
    notionals: string[];
    includeWindows?: Array<"24h" | "7d" | "30d">;
  }) {
    return Effect.tryPromise({
      try: async () => {
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

  private async getVolumes(windows: Array<"24h" | "7d" | "30d">): Promise<VolumeWindowType[]> {
    const now = Date.now();
    const windowMs = {
      "24h": 24 * 60 * 60 * 1000,
      "7d": 7 * 24 * 60 * 60 * 1000,
      "30d": 30 * 24 * 60 * 60 * 1000,
    };

    const volumes: VolumeWindowType[] = [];

    for (const window of windows) {
      const startTime = new Date(now - windowMs[window]);
      
      try {
        const volume = await this.calculateVolumeForWindow(window, startTime);
        volumes.push({
          window,
          volumeUsd: volume,
          measuredAt: new Date().toISOString(),
        });
      } catch (error) {
        console.warn(`Failed to calculate volume for ${window}:`, error);
        volumes.push({
          window,
          volumeUsd: 0,
          measuredAt: new Date().toISOString(),
        });
      }
    }

    return volumes;
  }

  private async calculateVolumeForWindow(window: "24h" | "7d" | "30d", startTime: Date): Promise<number> {
    if (this.subgraphClient) {
      return this.calculateVolumeFromSubgraph(window, startTime);
    }

    return 0;
  }

  private async calculateVolumeFromSubgraph(window: "24h" | "7d" | "30d", startTime: Date): Promise<number> {
    if (!this.subgraphClient) return 0;

    const endTime = new Date();
    const startTimestamp = Math.floor(startTime.getTime() / 1000);
    const endTimestamp = Math.floor(endTime.getTime() / 1000);

    let totalVolume = 0;

    const supportedChains = Object.values(CCTP_SUPPORTED_CHAINS).filter(
      (chain) => chain.chainId !== "solana-mainnet"
    );

    for (const chain of supportedChains) {
      try {
        const subgraphUrl = this.getSubgraphUrl(chain.chainId);
        if (!subgraphUrl) continue;

        const messageSents = await this.subgraphClient.getMessageSents(
          subgraphUrl,
          startTimestamp,
          endTimestamp,
          1000
        );

        for (const msg of messageSents) {
          const amount = BigInt(msg.amount);
          const amountUsd = Number(amount) / Math.pow(10, USDC_DECIMALS);
          totalVolume += amountUsd;
        }
      } catch (error) {
        console.warn(`Error fetching volume from subgraph for chain ${chain.chainId}:`, error);
      }
    }

    return totalVolume;
  }

  private getSubgraphUrl(chainId: string): string | null {
    if (!this.subgraphApiKey) return null;

    const subgraphDeployments: Record<string, string> = {
      "1": process.env.ETHEREUM_SUBGRAPH_ID || "E6iPLnDGEgrcc4gu9uiHJxENSRAAzTvUJqQqJcHZqJT1",
      "137": process.env.POLYGON_SUBGRAPH_ID || "",
      "42161": process.env.ARBITRUM_SUBGRAPH_ID || "9DgSggKVrvfi4vdyYTdmSBuPgDfm3D7zfLZ1qaQFjYYW",
      "10": process.env.OPTIMISM_SUBGRAPH_ID || "",
      "8453": process.env.BASE_SUBGRAPH_ID || "",
      "43114": process.env.AVALANCHE_SUBGRAPH_ID || "",
    };

    const deploymentId = subgraphDeployments[chainId];
    if (!deploymentId) return null;

    if (this.subgraphBaseUrl.includes("gateway.thegraph.com")) {
      return `https://gateway.thegraph.com/api/${this.subgraphApiKey}/subgraphs/id/${deploymentId}`;
    }
    return `${this.subgraphBaseUrl}/${this.subgraphApiKey}/subgraphs/id/${deploymentId}`;
  }

  private async getRates(
    routes: Array<{ source: AssetType; destination: AssetType }>,
    notionals: string[]
  ): Promise<RateType[]> {
    const rates: RateType[] = [];
    const now = new Date().toISOString();

    for (const route of routes) {
      for (const notional of notionals) {
        const amountIn = BigInt(notional);
        const amountOut = amountIn;
        const effectiveRate = this.calculateEffectiveRate(route.source, route.destination, amountIn, amountOut);
        
        const estimatedGasFee = await this.estimateGasFee(route.source, route.destination);
        const totalFeesUsd = estimatedGasFee;

        rates.push({
          source: route.source,
          destination: route.destination,
          amountIn: notional,
          amountOut: amountOut.toString(),
          effectiveRate,
          totalFeesUsd: totalFeesUsd > 0 ? totalFeesUsd : null,
          quotedAt: now,
        });
      }
    }

    return rates;
  }

  private calculateEffectiveRate(
    source: AssetType,
    destination: AssetType,
    amountIn: bigint,
    amountOut: bigint
  ): number {
    const sourceDecimals = source.decimals;
    const destDecimals = destination.decimals;
    
    const sourceAmount = Number(amountIn) / Math.pow(10, sourceDecimals);
    const destAmount = Number(amountOut) / Math.pow(10, destDecimals);
    
    if (sourceAmount === 0) return 0;
    return destAmount / sourceAmount;
  }

  private async estimateGasFee(source: AssetType, destination: AssetType): Promise<number> {
    const sourceChain = Object.values(CCTP_SUPPORTED_CHAINS).find(
      (chain) => chain.chainId === source.chainId
    );
    const destChain = Object.values(CCTP_SUPPORTED_CHAINS).find(
      (chain) => chain.chainId === destination.chainId
    );

    if (!sourceChain || !destChain) {
      return 0;
    }

    const baseGasFee = 0.0001;
    const chainMultipliers: Record<string, number> = {
      "1": 1.5,
      "137": 0.3,
      "42161": 0.5,
      "10": 0.4,
      "8453": 0.3,
      "43114": 0.6,
    };

    const sourceMultiplier = chainMultipliers[source.chainId] || 1.0;
    const destMultiplier = chainMultipliers[destination.chainId] || 1.0;

    return baseGasFee * Math.max(sourceMultiplier, destMultiplier);
  }

  private async getLiquidityDepth(
    routes: Array<{ source: AssetType; destination: AssetType }>
  ): Promise<LiquidityDepthType[]> {
    const liquidityDepth: LiquidityDepthType[] = [];
    const now = new Date().toISOString();

    for (const route of routes) {
      try {
        const maxAmount50 = await this.estimateLiquidityDepth(route.source, route.destination, 50);
        const maxAmount100 = await this.estimateLiquidityDepth(route.source, route.destination, 100);

        liquidityDepth.push({
          route,
          thresholds: [
            {
              maxAmountIn: maxAmount50.toString(),
              slippageBps: 50,
            },
            {
              maxAmountIn: maxAmount100.toString(),
              slippageBps: 100,
            },
          ],
          measuredAt: now,
        });
      } catch (error) {
        console.warn(`Failed to estimate liquidity depth for route:`, error);
        const defaultAmount = BigInt(10_000_000) * BigInt(Math.pow(10, route.source.decimals));
        liquidityDepth.push({
          route,
          thresholds: [
            {
              maxAmountIn: defaultAmount.toString(),
              slippageBps: 50,
            },
            {
              maxAmountIn: defaultAmount.toString(),
              slippageBps: 100,
            },
          ],
          measuredAt: now,
        });
      }
    }

    return liquidityDepth;
  }

  private async estimateLiquidityDepth(
    source: AssetType,
    destination: AssetType,
    slippageBps: number
  ): Promise<bigint> {
    if (this.subgraphClient) {
      return this.estimateLiquidityDepthFromSubgraph(source, destination, slippageBps);
    }

    const defaultAmount = BigInt(10_000_000) * BigInt(Math.pow(10, source.decimals));
    return slippageBps === 50 ? defaultAmount : defaultAmount * BigInt(2);
  }

  private async estimateLiquidityDepthFromSubgraph(
    source: AssetType,
    destination: AssetType,
    slippageBps: number
  ): Promise<bigint> {
    if (!this.subgraphClient) {
      const defaultAmount = BigInt(10_000_000) * BigInt(Math.pow(10, source.decimals));
      return slippageBps === 50 ? defaultAmount : defaultAmount * BigInt(2);
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const now = new Date();
    const startTimestamp = Math.floor(sevenDaysAgo.getTime() / 1000);
    const endTimestamp = Math.floor(now.getTime() / 1000);

    let maxTransaction = BigInt(0);

    const subgraphUrl = this.getSubgraphUrl(source.chainId);
    if (subgraphUrl) {
      try {
        const messageSents = await this.subgraphClient.getMessageSents(
          subgraphUrl,
          startTimestamp,
          endTimestamp,
          1000
        );

        for (const msg of messageSents) {
          const amount = BigInt(msg.amount);
          if (amount > maxTransaction) {
            maxTransaction = amount;
          }
        }
      } catch (error) {
        console.warn(`Error fetching liquidity depth from subgraph:`, error);
      }
    }

    if (maxTransaction === BigInt(0)) {
      const defaultAmount = BigInt(10_000_000) * BigInt(Math.pow(10, source.decimals));
      return slippageBps === 50 ? defaultAmount : defaultAmount * BigInt(2);
    }

    const multiplier = slippageBps === 50 ? BigInt(2) : BigInt(4);
    return maxTransaction * multiplier;
  }

  private async getListedAssets(): Promise<ListedAssetsType> {
    const assets: AssetType[] = Object.values(CCTP_SUPPORTED_CHAINS).map((chain) => ({
      chainId: chain.chainId,
      assetId: chain.usdcAddress,
      symbol: "USDC",
      decimals: USDC_DECIMALS,
    }));

    return {
      assets,
      measuredAt: new Date().toISOString(),
    };
  }

  ping() {
    return Effect.succeed({
      status: "ok" as const,
      timestamp: new Date().toISOString(),
    });
  }
}