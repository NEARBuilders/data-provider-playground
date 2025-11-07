import { createPlugin } from "every-plugin";
import { Effect } from "every-plugin/effect";
import { z } from "every-plugin/zod";

import { contract } from "./contract";
import { CCTPService } from "./service";

export default createPlugin({
  variables: z.object({
    timeout: z.number().min(1000).max(60000).default(10000),
    maxRetries: z.number().min(0).max(10).default(3),
    requestsPerSecond: z.number().min(1).max(100).default(5),
    subgraphBaseUrl: z.string().url().default("https://gateway.thegraph.com/api"),
  }),

  secrets: z.object({
    subgraphApiKey: z.string().optional(),
  }),

  contract,

  initialize: (config) =>
    Effect.gen(function* () {
      const service = new CCTPService(
        config.variables.timeout,
        config.variables.maxRetries,
        config.variables.requestsPerSecond,
        config.secrets.subgraphApiKey || null,
        config.variables.subgraphBaseUrl
      );

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
