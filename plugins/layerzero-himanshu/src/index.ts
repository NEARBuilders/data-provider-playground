import { createPlugin } from "every-plugin";
import { Effect } from "every-plugin/effect";
import { z } from "every-plugin/zod";

import { contract } from "./contract";
import { DataProviderService } from "./service";
import { EnvSchema } from "./env";

/**
 * LayerZero/Stargate Data Provider Plugin
 *
 * Implements bridge data collection using:
 * - LayerZero Scan API for volume metrics
 * - Stargate API for rates, liquidity depth, and asset listings
 * 
 * Provider: LayerZero + Stargate
 * Data Sources: Official APIs (no on-chain simulation)
 */
export default createPlugin({
  id: "@every-plugin/layerzero",

  variables: z.object({
    LZ_SCAN_BASE_URL: z.string().url().default("https://scan.layerzero-api.com/v1"),
    STARGATE_BASE_URL: z.string().url().default("https://stargate.finance/api/v1"),
    HTTP_TIMEOUT_MS: z.coerce.number().min(1000).max(60000).default(12000),
    MAX_RETRIES: z.coerce.number().min(1).max(10).default(4),
    RATE_LIMIT_RPS_LZ: z.coerce.number().min(1).max(100).default(3),
    RATE_LIMIT_RPS_STG: z.coerce.number().min(1).max(100).default(3),
  }),

  secrets: z.object({
    // No API keys required for public endpoints
  }),

  contract,

  initialize: (config) =>
    Effect.gen(function* () {
      // Validate and parse environment config
      const envConfig = EnvSchema.parse(config.variables);

      // Create service instance with validated config
      const service = new DataProviderService(envConfig);

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
