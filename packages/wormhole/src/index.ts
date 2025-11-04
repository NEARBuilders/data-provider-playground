import { createPlugin } from "every-plugin";
import { Effect } from "every-plugin/effect";
import { z } from "every-plugin/zod";

import { contract } from "./contract";
import { DataProviderService } from "./service";

/**
 * Wormhole Data Provider Plugin - Collects bridge metrics from Wormhole via Wormholescan API.
 *
 * This plugin provides volume, rates, liquidity depth, and asset data from the Wormhole bridge.
 * No API key required - Wormholescan API is public.
 * 
 */
export default createPlugin({
  id: "@every-plugin/wormhole",

  variables: z.object({
    baseUrl: z.string().url().default("https://api.wormholescan.io"),
    timeout: z.number().min(1000).max(60000).default(30000),
  }),

  secrets: z.object({
    apiKey: z.string().default(""),
  }),

  contract,

  initialize: (config) =>
    Effect.gen(function* () {
      // Create service instance with config
      const service = new DataProviderService(
        config.variables.baseUrl,
        config.secrets.apiKey,
        config.variables.timeout
      );

      // Test the connection during initialization
      yield* service.ping();

      return { service };
    }),

  shutdown: () => Effect.void,

  createRouter: (context, builder) => {
    const { service } = context;

    return {
      getSnapshot: builder.getSnapshot.handler(async ({ input }) => {
        const snapshot = await Effect.runPromise(
          service.getSnapshot(input)
        );
        return snapshot;
      }),

      ping: builder.ping.handler(async () => {
        return await Effect.runPromise(service.ping());
      }),
    };
  }
});
