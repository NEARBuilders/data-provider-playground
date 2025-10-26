import { createPlugin } from "every-plugin";
import { Effect } from "every-plugin/effect";
import { z } from "every-plugin/zod";

import { contract } from "./contract";
import { DataProviderService } from "./service";

/**
 * Data Provider Plugin Template - Template for building single-provider bridge data adapters.
 *
 * This template demonstrates how to implement the data provider contract for one provider.
 * Choose ONE provider (LayerZero, Wormhole, CCTP, Across, deBridge, Axelar, Li.Fi) and
 * replace the mock implementation with actual API calls.
 * 
 */
export default createPlugin({
  id: "@lifi/adapter",

  variables: z.object({
    baseUrl: z.string().url().default("https://li.quest/v1"),
    timeout: z.number().min(1000).max(60000).default(10000),
  }),

  // Li.Fi public endpoints do not require an API key. Keep it optional for
  // users who may have an API key for higher rate limits or private access.
  secrets: z.object({
    apiKey: z.string().optional(),
  }).optional(),

  contract,

  initialize: (config: any) =>
    Effect.gen(function* () {
      // Create service instance with config
      const service = new DataProviderService(
        config.variables.baseUrl,
        // pass optional apiKey (may be undefined)
        config.secrets?.apiKey,
        config.variables.timeout
      );

      // Test the connection during initialization
      yield* service.ping();

      return { service };
    }),

  shutdown: () => Effect.void,

  createRouter: (context: any, builder: any) => {
    const { service } = context as { service: any };

    return {
      getSnapshot: builder.getSnapshot.handler(async ({ input }: any) => {
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
