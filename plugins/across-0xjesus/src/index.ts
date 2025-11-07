import { createPlugin } from "every-plugin";
import { Effect } from "every-plugin/effect";
import { z } from "every-plugin/zod";

import { contract } from "./contract";
import { DataProviderService } from "./service";

/**
 * Across Protocol Data Provider Plugin
 *
 * Collects real-time data from Across Protocol including:
 * - Bridge volumes (24h, 7d, 30d) from DefiLlama
 * - Rate quotes with accurate fees from Across API
 * - Liquidity depth based on deposit limits
 * - Supported assets across all chains
 *
 * No API key required - Across API is public.
 */
export default createPlugin({
  id: "@across/data-provider",

  variables: z.object({
    baseUrl: z.string().url().default("https://app.across.to/api"),
    coingeckoBaseUrl: z.string().url().default("https://api.coingecko.com/api/v3"),
    defillamaBaseUrl: z.string().url().default("https://bridges.llama.fi"),
    timeout: z.number().min(1000).max(60000).default(30000),
    maxRequestsPerSecond: z.number().min(1).max(100).default(10),
  }),

  secrets: z.object({
    apiKey: z.string().default(""), // Optional integratorId for tracking
  }),

  contract,

  initialize: (config) =>
    Effect.gen(function* () {
      // Create service instance with config
      const service = new DataProviderService(
        config.variables.baseUrl,
        config.variables.coingeckoBaseUrl,
        config.variables.defillamaBaseUrl,
        config.secrets.apiKey,
        config.variables.timeout,
        config.variables.maxRequestsPerSecond
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
