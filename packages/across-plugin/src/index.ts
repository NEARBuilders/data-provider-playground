import { createPlugin } from "every-plugin";
import { Effect } from "every-plugin/effect";
import { z } from "every-plugin/zod";

import { contract } from "./contract";
import { DataProviderService } from "./service"; // Changed from AcrossDataProviderService

/**
 * Across Protocol Data Provider Plugin
 *
 * Collects and normalizes market data from Across Protocol for comparison with NEAR Intents.
 * Provides volume, rates, liquidity depth, and available assets data.
 */
export default createPlugin({
  id: "@near-intents/across-plugin",

  variables: z.object({
    baseUrl: z.string().url().default("https://across.to/api"),
    timeout: z.number().min(1000).max(60000).default(30000),
    rateLimitPerSecond: z.number().min(1).max(100).default(10),
  }),

  secrets: z.object({
    apiKey: z.string().optional().default(""), // Across API key is optional for public endpoints
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

      console.log("Across plugin initialized successfully");

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