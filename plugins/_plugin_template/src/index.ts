import { createPlugin } from "every-plugin";
import { Effect } from "every-plugin/effect";
import { z } from "every-plugin/zod";

import { createTransformRoutesMiddleware, getBlockchainFromChainId, getChainId, transformRate, transformLiquidity } from "@data-provider/plugin-utils";
import { ProviderApiClient } from "./client";
import type { AssetType, ProviderAssetType, ProviderRouteType, RouteType } from "./contract";
import { contract } from "./contract";
import { DataProviderService } from "./service";

/**
 * Data Provider Plugin Template
 *
 * This template demonstrates the multi-route + middleware architecture for data provider plugins.
 * Key architectural patterns:
 *
 * 1. **Two-Format Architecture**: Plugin works with both provider-specific format and NEAR Intents format
 *    - Provider Format: Matches external API (ProviderAssetType, ProviderRouteType in contract.ts)
 *    - NEAR Intents Format: Standardized client interface (AssetType, RouteType from shared-contract)
 *
 * 2. **Layer Separation**:
 *    - Service Layer: Business logic in provider format, calls external APIs
 *    - Router Layer: Transformation between formats, middleware for route handling
 *
 * 3. **Middleware Pattern**: oRPC middleware automatically transforms routes for certain endpoints
 *    - getRates, getLiquidity, getSnapshot: Use middleware (accept NEAR Intents, transform to provider)
 *    - getVolumes, getListedAssets: No middleware (work with standardized inputs)
 *
 * 4. **Transformation Functions**:
 *    - transformRoute: NEAR Intents Route → Provider Route (for middleware)
 *    - transformAsset: Provider Asset → NEAR Intents Asset (for responses)
 *
 * Workflow:
 * Client Request (NEAR Intents) → Middleware (transformRoute) → Service (Provider format)
 * Service Response (Provider format) → Router (transformAsset) → Client Response (NEAR Intents)
 */
export default createPlugin({
  variables: z.object({
    baseUrl: z.string().url().default("https://api.example.com"),
    timeout: z.number().min(1000).max(60000).default(10000),
  }),

  secrets: z.object({
    apiKey: z.string().min(1, "API key is required"),
  }),

  contract,

  initialize: (config) =>
    Effect.gen(function* () {
      // Create HTTP client for API communication
      const client = new ProviderApiClient(
        config.variables.baseUrl,
        config.secrets.apiKey,
        config.variables.timeout
      );

      // Create service instance with client
      const service = new DataProviderService(client);

      // NEAR Intents → Provider (for middleware/requests)
      const transformAssetToProvider = async (asset: AssetType): Promise<ProviderAssetType> => {
        const chainId = await getChainId(asset.blockchain);
        if (!chainId) {
          throw new Error(`Unsupported blockchain: ${asset.blockchain}`);
        }
        return {
          chainId: chainId.toString(),
          address: asset.contractAddress,
          symbol: asset.symbol,
          decimals: asset.decimals
        };
      };

      // Provider → NEAR Intents (for responses)
      const transformAssetFromProvider = async (asset: ProviderAssetType): Promise<AssetType> => {
        let blockchain = await getBlockchainFromChainId(asset.chainId);

        if (!blockchain) {
          // Handle provider specific mappings
          switch (asset.chainId) {
            
            default: {
              throw new Error(`Unknown chainId: ${asset.chainId} for asset ${asset.symbol} (${asset.address})`);
            }
          }
        }

        const assetId = asset.address ? `nep141:${blockchain}-${asset.address.toLowerCase()}.omft.near` : `nep141:${asset.symbol}`;

        return {
          blockchain,
          assetId,
          symbol: asset.symbol,
          decimals: asset.decimals,
          contractAddress: asset.address!
        };
      };

      return { service, transformAssetToProvider, transformAssetFromProvider };
    }),

  shutdown: () => Effect.void,

  createRouter: (context, builder) => {
    const { service, transformAssetToProvider, transformAssetFromProvider } = context;

    // Create typed middleware from builder
    const transformRoutesMiddleware = createTransformRoutesMiddleware<
      AssetType,
      ProviderAssetType
    >(transformAssetToProvider);

    return {
      // Individual routes - expect service format
      getVolumes: builder.getVolumes.handler(async ({ input }) => {
        const volumes = await service.getVolumes(input.includeWindows || ["24h"]);
        return { volumes };
      }),

      getListedAssets: builder.getListedAssets.handler(async () => {
        const providerAssets = await service.getListedAssets();

        const assets = await Promise.all(
          providerAssets.map(asset => transformAssetFromProvider(asset))
        );

        return {
          assets,
          measuredAt: new Date().toISOString()
        };
      }),

      getRates: builder.getRates.use(transformRoutesMiddleware).handler(async ({ input, context }) => {
        const providerRates = await service.getRates(context.routes, input.notionals);
        const rates = await Promise.all(
          providerRates.map(r => transformRate(r, transformAssetFromProvider))
        );
        return { rates };
      }),

      getLiquidity: builder.getLiquidity.use(transformRoutesMiddleware).handler(async ({ input, context }) => {
        const providerLiquidity = await service.getLiquidityDepth(context.routes);
        const liquidity = await Promise.all(
          providerLiquidity.map(l => transformLiquidity(l, transformAssetFromProvider))
        );
        return { liquidity };
      }),

      // Composite route - with middleware, accepts and returns NEAR Intents format
      getSnapshot: builder.getSnapshot
        .use(transformRoutesMiddleware)
        .handler(async ({ input, context }) => {
          const providerSnapshot = await service.getSnapshot({
            routes: context.routes,
            notionals: input.notionals,
            includeWindows: input.includeWindows
          });

          // Transform all nested provider types to NEAR Intents format
          const [rates, liquidity, assets] = await Promise.all([
            providerSnapshot.rates
              ? Promise.all(providerSnapshot.rates.map(r => transformRate(r, transformAssetFromProvider)))
              : undefined,
            providerSnapshot.liquidity
              ? Promise.all(providerSnapshot.liquidity.map(l => transformLiquidity(l, transformAssetFromProvider)))
              : undefined,
            Promise.all(providerSnapshot.listedAssets.assets.map(transformAssetFromProvider))
          ]);

          return {
            volumes: providerSnapshot.volumes,
            listedAssets: { assets, measuredAt: providerSnapshot.listedAssets.measuredAt },
            ...(rates && { rates }),
            ...(liquidity && { liquidity })
          };
        }),

      ping: builder.ping.handler(async () => {
        return {
          status: "ok" as const,
          timestamp: new Date().toISOString(),
        };
      }),
    };
  }
});
