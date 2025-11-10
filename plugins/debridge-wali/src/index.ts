import { createPlugin } from "every-plugin";
import { Effect } from "every-plugin/effect";
import { z } from "every-plugin/zod";

import { contract } from "./contract";
import { DataProviderService } from "./service";
import { HttpUtils } from "./utils/http";

/**
 * deBridge DLN Data Provider Plugin
 *
 * Collects cross-chain bridge metrics from deBridge Liquidity Network.
 * deBridge enables fast, single-transaction cross-chain swaps without locking assets.
 * 
 * Features:
 * - Production-grade rate limiting (Bottleneck)
 * - Precise decimal arithmetic (decimal.js)
 * - Exponential backoff with jitter
 * - Comprehensive error handling
 */
export default createPlugin({
  variables: z.object({
    baseUrl: z.string().url().default("https://dln.debridge.finance/v1.0"),
    timeout: z.number().min(1000).max(60000).default(30000),
    // Rate limiter settings (make per-provider limits configurable via ENV)
    rateLimitConcurrency: z.number().int().min(1).default(5),
    rateLimitMinTimeMs: z.number().int().min(0).default(200),
  }),

  // deBridge public endpoints may not require an API key
  // Keep it optional for users who may have an API key for higher rate limits
  secrets: z.object({
    apiKey: z.string().optional(),
  }).optional(),

  contract,

  initialize: (config: any) =>
    Effect.gen(function* () {
      // Configure HTTP rate limiter from variables before creating the service
      HttpUtils.configure({
        maxConcurrent: config.variables.rateLimitConcurrency,
        minTime: config.variables.rateLimitMinTimeMs,
      });

      // Create service instance with config
      const service = new DataProviderService(
        config.variables.baseUrl,
        config.secrets?.apiKey,
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
