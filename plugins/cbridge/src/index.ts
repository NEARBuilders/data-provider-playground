import { createPlugin } from "every-plugin";
import { Effect } from "every-plugin/effect";
import { z } from "every-plugin/zod";

import { contract } from "./contract";
import { DataProviderService } from "./service";

/**
 * cBridge Data Provider Plugin - Collects cross-chain bridge metrics from cBridge.
 *
 * This plugin implements the data provider contract for cBridge (Celer Network).
 * API Documentation: https://cbridge-docs.celer.network/developer/api-reference
 *
 */
export default createPlugin({
  variables: z.object({
    baseUrl: z.string().url().default("https://cbridge-prod2.celer.app"),
    timeout: z.number().min(1000).max(60000).default(30000),
  }),

  secrets: z.object({
    apiKey: z.string().optional().default(""),
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
