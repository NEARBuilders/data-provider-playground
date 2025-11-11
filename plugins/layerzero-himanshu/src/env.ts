import { z } from "every-plugin/zod";

/**
 * Environment configuration schema for LayerZero/Stargate plugin
 */
export const EnvSchema = z.object({
  LZ_SCAN_BASE_URL: z.string().url().default("https://scan.layerzero-api.com/v1"),
  STARGATE_BASE_URL: z.string().url().default("https://stargate.finance/api/v1"),
  HTTP_TIMEOUT_MS: z.coerce.number().min(1000).max(60000).default(12000),
  MAX_RETRIES: z.coerce.number().min(1).max(10).default(4),
  RATE_LIMIT_RPS_LZ: z.coerce.number().min(1).max(100).default(3),
  RATE_LIMIT_RPS_STG: z.coerce.number().min(1).max(100).default(3),
});

export type EnvConfig = z.infer<typeof EnvSchema>;
