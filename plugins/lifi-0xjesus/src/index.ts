import { createPlugin } from "every-plugin";
import { Effect } from "every-plugin/effect";
import { z } from "every-plugin/zod";

import { contract } from "./contract";
import { DataProviderService } from "./service";

/**
 * Li.Fi Bridge Data Provider Plugin
 *
 * Collects and normalizes cross-chain bridge metrics from Li.Fi aggregator.
 * Li.Fi aggregates multiple bridges (Hop, Connext, Across, etc.) and DEXes.
 */
export default createPlugin({
  id: "@every-plugin/template",

  variables: z.object({
    baseUrl: z.string().url().default("https://li.quest/v1"),
    defillamaBaseUrl: z.string().url().default("https://bridges.llama.fi"),
    timeout: z.number().min(1000).max(60000).default(15000),
    maxRequestsPerSecond: z.number().min(1).max(100).default(10),
  }),

  secrets: z.object({
    apiKey: z.string().default("not-required"),
  }),

  contract,

  initialize: (config) =>
    Effect.gen(function* () {
      // Create service instance with config
      const service = new DataProviderService(
        config.variables.baseUrl,
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
        try {
          const snapshot = await Effect.runPromise(
            service.getSnapshot(input)
          );
          return snapshot;
        } catch (error) {
          // Log only the error message to avoid Next.js error formatting crash
          const errorMsg = error instanceof Error ? error.message : String(error);
          console.error('[Plugin] getSnapshot error:', errorMsg);
          throw error instanceof Error ? error : new Error(String(error));
        }
      }),

      ping: builder.ping.handler(async () => {
        return await Effect.runPromise(service.ping());
      }),
    };
  }
});
