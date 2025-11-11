import { createPlugin } from "every-plugin";
import { Effect } from "every-plugin/effect";
import { z } from "every-plugin/zod";

import { contract } from "./contract";
import { DataProviderService } from "./service";

/**
 * CCTP Data Provider Plugin
 *
 * Collects cross-chain bridge metrics from Circle's CCTP protocol.
 * Provides volume, rates, liquidity depth, and asset information for USDC transfers.
 *
 * Provider: Circle CCTP (Cross-Chain Transfer Protocol)
 * API: Circle Iris API (https://iris-api.circle.com)
 * Volume Source: DefiLlama Bridge API
 * Supported Asset: USDC only
 * Supported Chains: Ethereum, Avalanche, Optimism, Arbitrum, Base, Polygon PoS
 *
 * Built for NEAR Intents Data Collection Bounty
 * Author: 0xJesus
 */
export default createPlugin({
  id: "@0xJesus/cctp-data-provider",

  variables: z.object({
    baseUrl: z.string().url().default("https://iris-api.circle.com"),
    timeout: z.number().min(1000).max(60000).default(15000),
  }),

  secrets: z.object({
    apiKey: z.string().min(1, "API key is required (use 'not-required' for public CCTP API)"),
  }),

  contract,

  initialize: (config) =>
    Effect.gen(function* () {
      console.log("[CCTP Plugin] Initializing with config:", {
        baseUrl: config.variables.baseUrl,
        timeout: config.variables.timeout,
      });

      // Create service instance with config
      const service = new DataProviderService(
        config.variables.baseUrl,
        config.secrets.apiKey,
        config.variables.timeout
      );

      // Test the connection during initialization
      yield* service.ping();

      console.log("[CCTP Plugin] Initialization successful");

      return { service };
    }),

  shutdown: () => Effect.void,

  createRouter: (context, builder) => {
    const { service } = context;

    return {
      getSnapshot: builder.getSnapshot.handler(async ({ input }) => {
        console.log("[CCTP Plugin] Handling getSnapshot request:", {
          routesCount: input.routes.length,
          notionalsCount: input.notionals.length,
          windows: input.includeWindows,
        });

        const snapshot = await service.getSnapshot(input);

        console.log("[CCTP Plugin] Snapshot generated successfully:", {
          volumesCount: snapshot.volumes.length,
          ratesCount: snapshot.rates.length,
          liquidityCount: snapshot.liquidity.length,
          assetsCount: snapshot.listedAssets.assets.length,
        });

        return snapshot;
      }),

      ping: builder.ping.handler(async () => {
        console.log("[CCTP Plugin] Handling ping request");
        const result = await Effect.runPromise(service.ping());
        console.log("[CCTP Plugin] Ping successful:", result);
        return result;
      }),
    };
  }
});
