import { createPlugin } from "every-plugin";
import { Effect } from "every-plugin/effect";
import { z } from "every-plugin/zod";

import { contract } from "./contract";
import { CCTPService } from "./cctp-service";

/**
 * CCTP Data Provider Plugin - Circle's Cross-Chain Transfer Protocol
 * 
 * Collects bridge metrics from Circle's CCTP including:
 * - Volume data from Celer cBridge API
 * - Rate quotes and fees from CCTP API
 * - Liquidity depth from fast burn allowance
 * - Supported USDC assets across all chains
 * 
 * Note: CCTP public APIs require NO authentication
 */
export default createPlugin({
  id: "@nearbuilders/cctp",

  variables: z.object({
    baseUrl: z.string().url().default("https://iris-api.circle.com"),
    timeout: z.number().min(1000).max(60000).default(10000),
    maxRetries: z.number().min(1).max(10).default(3),
    initialBackoffMs: z.number().min(100).max(5000).default(1000),
  }),

  secrets: z.object({
    // CCTP APIs are public - no API key needed
    // This is kept for contract compatibility but can be empty
    apiKey: z.string().optional().default(""),
  }),

  contract,

  initialize: (config) =>
    Effect.gen(function* () {
      console.log("[CCTP Plugin] Initializing with baseUrl:", config.variables.baseUrl);
      
      // Create CCTP service instance with config
      const service = new CCTPService(
        config.variables.baseUrl,
        config.variables.timeout,
        config.variables.maxRetries,
        config.variables.initialBackoffMs
      );

      // Test the connection during initialization
      yield* service.ping();
      console.log("[CCTP Plugin] Initialized successfully");

      return { service };
    }),

  shutdown: () => Effect.void,

  createRouter: (context, builder) => {
    const { service } = context;

    return {
      getSnapshot: builder.getSnapshot.handler(async ({ input }) => {
        console.log("[CCTP Plugin] getSnapshot called with", {
          routesCount: input.routes.length,
          notionalsCount: input.notionals.length,
          windows: input.includeWindows
        });
        
        const snapshot = await Effect.runPromise(
          service.getSnapshot(input)
        );
        
        console.log("[CCTP Plugin] getSnapshot completed", {
          volumes: snapshot.volumes.length,
          rates: snapshot.rates.length,
          liquidity: snapshot.liquidity.length,
          assets: snapshot.listedAssets.assets.length
        });
        
        return snapshot;
      }),

      ping: builder.ping.handler(async () => {
        return await Effect.runPromise(service.ping());
      }),
    };
  }
});
