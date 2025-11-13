import { z } from "every-plugin/zod";

/**
 * Provider-Specific Schemas for Data Provider Plugins
 *
 * Data provider plugins work with two distinct data formats:
 *
 * 1. **Provider Format** (defined here): The native format used by external APIs
 *    - Uses provider-specific field names (e.g., chainId, chainName, domainId)
 *    - Matches the actual API responses from the data provider
 *    - Service layer methods work exclusively in this format
 *
 * 2. **NEAR Intents Format** (from shared-contract): The standardized format
 *    - Uses consistent field names (blockchain, assetId, chainId)
 *    - Router layer transforms provider format → NEAR Intents format
 *    - What clients consume via the plugin API
 *
 * When implementing a new provider, customize these schemas to match
 * the provider's actual API format, then implement transformAsset() and
 * transformRoute() functions in index.ts to convert between formats.
 */

// Provider-specific asset schema - customize based on provider's API
export const ProviderAsset = z.object({
  chainId: z.string(), // Default: standard chain ID. Override for providers using chainName/domainId
  address: z.string().optional(), // Contract address, undefined for native tokens
  symbol: z.string(), // Token symbol (e.g., "ETH", "USDC")
  decimals: z.number() // Token decimals for amount calculations
});

// Provider-specific route schema - pair of provider assets
export const ProviderRoute = z.object({
  source: ProviderAsset, // Source asset in provider format
  destination: ProviderAsset // Destination asset in provider format
});

// Export inferred types for use in service layer
export type ProviderAssetType = z.infer<typeof ProviderAsset>;
export type ProviderRouteType = z.infer<typeof ProviderRoute>;

// Re-export shared contract types for convenience
export * from '@data-provider/shared-contract';
