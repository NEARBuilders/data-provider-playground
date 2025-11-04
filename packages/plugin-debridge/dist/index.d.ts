import { z } from "every-plugin/zod";
import { DataProviderService } from "./service";
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
declare const _default: import("every-plugin").LoadedPluginWithBinding<{
    getSnapshot: import("every-plugin/orpc").ContractProcedure<z.ZodObject<{
        routes: z.ZodArray<z.ZodObject<{
            source: z.ZodObject<{
                chainId: z.ZodString;
                assetId: z.ZodString;
                symbol: z.ZodString;
                decimals: z.ZodNumber;
            }, z.core.$strip>;
            destination: z.ZodObject<{
                chainId: z.ZodString;
                assetId: z.ZodString;
                symbol: z.ZodString;
                decimals: z.ZodNumber;
            }, z.core.$strip>;
        }, z.core.$strip>>;
        notionals: z.ZodArray<z.ZodString>;
        includeWindows: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodEnum<{
            "24h": "24h";
            "7d": "7d";
            "30d": "30d";
        }>>>>;
    }, z.core.$strip>, z.ZodObject<{
        volumes: z.ZodArray<z.ZodObject<{
            window: z.ZodEnum<{
                "24h": "24h";
                "7d": "7d";
                "30d": "30d";
            }>;
            volumeUsd: z.ZodNumber;
            measuredAt: z.ZodISODateTime;
        }, z.core.$strip>>;
        rates: z.ZodArray<z.ZodObject<{
            source: z.ZodObject<{
                chainId: z.ZodString;
                assetId: z.ZodString;
                symbol: z.ZodString;
                decimals: z.ZodNumber;
            }, z.core.$strip>;
            destination: z.ZodObject<{
                chainId: z.ZodString;
                assetId: z.ZodString;
                symbol: z.ZodString;
                decimals: z.ZodNumber;
            }, z.core.$strip>;
            amountIn: z.ZodString;
            amountOut: z.ZodString;
            effectiveRate: z.ZodNumber;
            totalFeesUsd: z.ZodNullable<z.ZodNumber>;
            quotedAt: z.ZodISODateTime;
        }, z.core.$strip>>;
        liquidity: z.ZodArray<z.ZodObject<{
            route: z.ZodObject<{
                source: z.ZodObject<{
                    chainId: z.ZodString;
                    assetId: z.ZodString;
                    symbol: z.ZodString;
                    decimals: z.ZodNumber;
                }, z.core.$strip>;
                destination: z.ZodObject<{
                    chainId: z.ZodString;
                    assetId: z.ZodString;
                    symbol: z.ZodString;
                    decimals: z.ZodNumber;
                }, z.core.$strip>;
            }, z.core.$strip>;
            thresholds: z.ZodArray<z.ZodObject<{
                maxAmountIn: z.ZodString;
                slippageBps: z.ZodNumber;
            }, z.core.$strip>>;
            measuredAt: z.ZodISODateTime;
        }, z.core.$strip>>;
        listedAssets: z.ZodObject<{
            assets: z.ZodArray<z.ZodObject<{
                chainId: z.ZodString;
                assetId: z.ZodString;
                symbol: z.ZodString;
                decimals: z.ZodNumber;
            }, z.core.$strip>>;
            measuredAt: z.ZodISODateTime;
        }, z.core.$strip>;
    }, z.core.$strip>, import("every-plugin/orpc").MergedErrorMap<Record<never, never>, import("every-plugin/orpc").MergedErrorMap<Record<never, never>, {
        readonly UNAUTHORIZED: {
            readonly data: z.ZodObject<{
                apiKeyProvided: z.ZodBoolean;
                provider: z.ZodOptional<z.ZodString>;
                authType: z.ZodOptional<z.ZodEnum<{
                    apiKey: "apiKey";
                    oauth: "oauth";
                    token: "token";
                }>>;
            }, z.core.$strip>;
        };
        readonly RATE_LIMITED: {
            readonly data: z.ZodObject<{
                retryAfter: z.ZodNumber;
                remainingRequests: z.ZodOptional<z.ZodNumber>;
                resetTime: z.ZodOptional<z.ZodString>;
                limitType: z.ZodOptional<z.ZodEnum<{
                    requests: "requests";
                    tokens: "tokens";
                    bandwidth: "bandwidth";
                }>>;
            }, z.core.$strip>;
        };
        readonly SERVICE_UNAVAILABLE: {
            readonly data: z.ZodObject<{
                retryAfter: z.ZodOptional<z.ZodNumber>;
                maintenanceWindow: z.ZodDefault<z.ZodBoolean>;
                estimatedUptime: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>;
        };
        readonly BAD_REQUEST: {
            readonly data: z.ZodObject<{
                invalidFields: z.ZodOptional<z.ZodArray<z.ZodString>>;
                validationErrors: z.ZodOptional<z.ZodArray<z.ZodObject<{
                    field: z.ZodString;
                    message: z.ZodString;
                    code: z.ZodOptional<z.ZodString>;
                }, z.core.$strip>>>;
            }, z.core.$strip>;
        };
        readonly NOT_FOUND: {
            readonly data: z.ZodObject<{
                resource: z.ZodOptional<z.ZodString>;
                resourceId: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>;
        };
        readonly FORBIDDEN: {
            readonly data: z.ZodObject<{
                requiredPermissions: z.ZodOptional<z.ZodArray<z.ZodString>>;
                action: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>;
        };
    }>>, Record<never, never>>;
    ping: import("every-plugin/orpc").ContractProcedure<import("every-plugin/orpc").Schema<unknown, unknown>, z.ZodObject<{
        status: z.ZodLiteral<"ok">;
        timestamp: z.ZodString;
    }, z.core.$strip>, import("every-plugin/orpc").MergedErrorMap<Record<never, never>, import("every-plugin/orpc").MergedErrorMap<Record<never, never>, {
        readonly UNAUTHORIZED: {
            readonly data: z.ZodObject<{
                apiKeyProvided: z.ZodBoolean;
                provider: z.ZodOptional<z.ZodString>;
                authType: z.ZodOptional<z.ZodEnum<{
                    apiKey: "apiKey";
                    oauth: "oauth";
                    token: "token";
                }>>;
            }, z.core.$strip>;
        };
        readonly RATE_LIMITED: {
            readonly data: z.ZodObject<{
                retryAfter: z.ZodNumber;
                remainingRequests: z.ZodOptional<z.ZodNumber>;
                resetTime: z.ZodOptional<z.ZodString>;
                limitType: z.ZodOptional<z.ZodEnum<{
                    requests: "requests";
                    tokens: "tokens";
                    bandwidth: "bandwidth";
                }>>;
            }, z.core.$strip>;
        };
        readonly SERVICE_UNAVAILABLE: {
            readonly data: z.ZodObject<{
                retryAfter: z.ZodOptional<z.ZodNumber>;
                maintenanceWindow: z.ZodDefault<z.ZodBoolean>;
                estimatedUptime: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>;
        };
        readonly BAD_REQUEST: {
            readonly data: z.ZodObject<{
                invalidFields: z.ZodOptional<z.ZodArray<z.ZodString>>;
                validationErrors: z.ZodOptional<z.ZodArray<z.ZodObject<{
                    field: z.ZodString;
                    message: z.ZodString;
                    code: z.ZodOptional<z.ZodString>;
                }, z.core.$strip>>>;
            }, z.core.$strip>;
        };
        readonly NOT_FOUND: {
            readonly data: z.ZodObject<{
                resource: z.ZodOptional<z.ZodString>;
                resourceId: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>;
        };
        readonly FORBIDDEN: {
            readonly data: z.ZodObject<{
                requiredPermissions: z.ZodOptional<z.ZodArray<z.ZodString>>;
                action: z.ZodOptional<z.ZodString>;
            }, z.core.$strip>;
        };
    }>>, Record<never, never>>;
}, z.ZodObject<{
    baseUrl: z.ZodDefault<z.ZodString>;
    timeout: z.ZodDefault<z.ZodNumber>;
    rateLimitConcurrency: z.ZodDefault<z.ZodNumber>;
    rateLimitMinTimeMs: z.ZodDefault<z.ZodNumber>;
}, z.core.$strip>, z.ZodOptional<z.ZodObject<{
    apiKey: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>, {
    service: DataProviderService;
}>;
export default _default;
