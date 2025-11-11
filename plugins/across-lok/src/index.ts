import { createPlugin } from "every-plugin";
import { Effect } from "every-plugin/effect";
import { z } from "every-plugin/zod";

import { contract } from "./contract";
import { DataProviderService } from "./service";

/**
 * Across Protocol Data Provider Plugin
 *
 * Collects and normalizes bridge data from Across Protocol including:
 * - Available assets and routes
 * - Rate quotes and fees
 * - Liquidity depth at multiple slippage thresholds
 * - Volume statistics (estimated - official API endpoint TBD)
 *
 * API Documentation: https://docs.across.to/reference/api-reference
 * 
 * Provider: Across (https://across.to/)
 */
export default createPlugin({
  variables: z.object({
    baseUrl: z.string().url().default("https://app.across.to/api"),
    timeout: z.number().min(1000).max(60000).default(15000),
  }),

  secrets: z.object({
    // Across API doesn't require authentication for public endpoints
    // but we keep this for future compatibility if they add API keys
    apiKey: z.string().optional().default(""),
  }),

  contract,

  initialize: (config) =>
    Effect.gen(function* () {
      console.log('[Across Plugin] Initializing with base URL:', config.variables.baseUrl);

      // Create service instance with config
      const service = new DataProviderService(
        config.variables.baseUrl,
        config.secrets.apiKey || "",
        config.variables.timeout
      );

      // Test the connection during initialization
      console.log('[Across Plugin] Testing API connection...');
      yield* service.ping();
      console.log('[Across Plugin] API connection successful');

      return { service };
    }),

  shutdown: () => Effect.void,

  createRouter: (context, builder) => {
    const { service } = context;

    return {
      getSnapshot: builder.getSnapshot.handler(async ({ input }) => {
        console.log(`[Across Plugin] getSnapshot called with ${input.routes.length} routes, ${input.notionals.length} notionals`);
        
        const snapshot = await Effect.runPromise(
          service.getSnapshot(input)
        );
        
        console.log(`[Across Plugin] Snapshot complete: ${snapshot.rates.length} rates, ${snapshot.liquidity.length} liquidity points, ${snapshot.listedAssets.assets.length} assets`);
        
        return snapshot;
      }),

      ping: builder.ping.handler(async () => {
        return await Effect.runPromise(service.ping());
      }),
    };
  }
});
