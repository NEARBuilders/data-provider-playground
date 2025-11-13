# Multi-Route + Middleware Migration Guide

## Overview

This guide documents the migration from the monolithic `getSnapshot` approach to the new multi-route + middleware architecture for data provider plugins.

## Architecture Changes

### Before: Monolithic getSnapshot
- Single `getSnapshot` endpoint that handled asset transformation internally
- Direct NEAR Intents → Provider format conversion in service methods
- Tight coupling between data fetching and asset transformation

### After: Multi-Route + Middleware + Transform Helpers
- Split into 5 endpoints: `getVolumes`, `getListedAssets`, `getRates`, `getLiquidity`, `getSnapshot`
- Asset transformation handled by router layer using `transformAssetToProvider` and `transformAssetFromProvider` functions
- Route transformation handled by oRPC middleware that builds routes from transformed assets
- Provider-specific schemas defined per plugin with optional `address` field
- Generic transform helpers (`transformRate`, `transformLiquidity`) for response transformation
- Clean separation of concerns: Service (provider format) → Router (NEAR Intents format)

## Migration Steps

### Phase 1: Core Infrastructure

#### 1. Update Shared Contract
```typescript
// packages/shared-contract/contract.ts - Add provider schemas
export const ProviderAsset = z.object({
  chainId: z.string(),
  address: z.string().optional(),
  symbol: z.string(),
  decimals: z.number()
});

export const ProviderRoute = z.object({
  source: ProviderAsset,
  destination: ProviderAsset
});

// Add multi-route endpoints
getVolumes: oc.route({ method: 'POST', path: '/volumes' })...
getListedAssets: oc.route({ method: 'GET', path: '/assets' })...
getRates: oc.route({ method: 'POST', path: '/rates' })...
getLiquidity: oc.route({ method: 'POST', path: '/liquidity' })...
getSnapshot: oc.route({ method: "POST", path: "/snapshot" })... // Composite
```

#### 2. Use oRPC Middleware
The oRPC middleware handles route transformation automatically. Plugins provide a `transformRoute` function that converts NEAR Intents format to provider-specific format.

### Phase 2: Plugin Template Updates

#### 1. Define Provider Schemas
```typescript
// plugins/_plugin_template/src/contract.ts
export const ProviderAsset = z.object({
  chainId: z.string(),
  address: z.string().optional(),
  symbol: z.string(),
  decimals: z.number()
});

export const ProviderRoute = z.object({
  source: ProviderAsset,
  destination: ProviderAsset
});

export type ProviderAssetType = z.infer<typeof ProviderAsset>;
export type ProviderRouteType = z.infer<typeof ProviderRoute>;
```

#### 2. Update Service Class
```typescript
// plugins/_plugin_template/src/service.ts
import { DataProviderService as BaseDataProviderService } from "@data-provider/plugin-utils";
import { ProviderApiClient } from "./client";
import type {
  LiquidityDepthType,
  ProviderAssetType,
  RateType,
  RouteType,
  SnapshotType,
  TimeWindow,
  VolumeWindowType
} from "./contract";

export class DataProviderService extends BaseDataProviderService<ProviderAssetType> {
  constructor(private readonly client: ProviderApiClient) {
    super();
  }

  async getVolumes(windows: TimeWindow[]): Promise<VolumeWindowType[]> {
    const response = await this.client.fetchVolumes(windows);
    return response.volumes.map(volume => ({
      window: volume.window as TimeWindow,
      volumeUsd: volume.volumeUsd,
      measuredAt: volume.measuredAt
    }));
  }

  // Service returns raw provider format - transformation happens in router
  async getListedAssets(): Promise<ProviderAssetType[]> {
    const response = await this.client.fetchAssets();
    return response.assets.map(asset => ({
      chainId: asset.chainId,
      address: asset.address,
      symbol: asset.symbol,
      decimals: asset.decimals
    }));
  }

  // TODO: Implement provider's quote API endpoint
  async getRates(routes: RouteType<ProviderAssetType>[], notionals: string[]): Promise<RateType<ProviderAssetType>[]> {
    return []; // Placeholder - implement based on provider's API
  }

  // TODO: Implement provider's liquidity API or simulate with quotes
  async getLiquidityDepth(routes: RouteType<ProviderAssetType>[]): Promise<LiquidityDepthType<ProviderAssetType>[]> {
    return []; // Placeholder - implement based on provider's API
  }

  async getSnapshot(params: {
    routes: RouteType<ProviderAssetType>[];
    notionals?: string[];
    includeWindows?: TimeWindow[];
  }): Promise<SnapshotType<ProviderAssetType>> {
    const [volumes, listedAssets, rates, liquidity] = await Promise.all([
      this.getVolumes(params.includeWindows || ["24h"]),
      this.getListedAssets(),
      params.notionals ? this.getRates(params.routes, params.notionals) : Promise.resolve([]),
      this.getLiquidityDepth(params.routes)
    ]);

    return {
      volumes,
      listedAssets: {
        assets: listedAssets,
        measuredAt: new Date().toISOString()
      },
      ...(rates.length > 0 && { rates }),
      ...(liquidity.length > 0 && { liquidity }),
    };
  }
}
```

#### 3. Update Plugin Index
```typescript
// plugins/_plugin_template/src/index.ts
import { transformRate, transformLiquidity } from "@data-provider/plugin-utils";

initialize: (config) =>
  Effect.gen(function* () {
    const service = new DataProviderService(/*...*/);

    // NEAR Intents → Provider (for middleware/requests)
    const transformAssetToProvider = async (asset: AssetType): Promise<ProviderAssetType> => {
      const chainId = await getChainId(asset.blockchain);
      return {
        chainId: chainId?.toString() || asset.chainId!,
        address: asset.contractAddress,
        symbol: asset.symbol,
        decimals: asset.decimals
      };
    };

    // Provider → NEAR Intents (for responses)
    const transformAssetFromProvider = async (asset: ProviderAssetType): Promise<AssetType> => {
      let blockchain = await getBlockchainFromChainId(asset.chainId);

      if (!blockchain) {
        // Handle provider specific mappings
        switch (asset.chainId) {
          case "34268394551451": { // Solana example
            blockchain = "sol";
            break;
          }
          default: {
            throw new Error(`Unknown chainId: ${asset.chainId}`);
          }
        }
      }

      const assetId = asset.address ? `nep141:${blockchain}-${asset.address.toLowerCase()}.omft.near` : `nep141:${asset.symbol}`;

      return {
        blockchain,
        assetId,
        symbol: asset.symbol,
        decimals: asset.decimals,
        contractAddress: asset.address
        // Note: No chainId in response - it's optional
      };
    };

    return { service, transformAssetToProvider, transformAssetFromProvider };
  }),

createRouter: (context, builder) => {
  const { service, transformAssetToProvider, transformAssetFromProvider } = context;

  // Create typed middleware from builder - builds routes from transformed assets
  const transformRoutesMiddleware = createTransformRoutesMiddleware<
    AssetType,
    ProviderAssetType
  >(transformAssetToProvider);

  return {
    getVolumes: builder.getVolumes.handler(async ({ input }) => {
      const volumes = await service.getVolumes(input.includeWindows || ["24h"]);
      return { volumes };
    }),

    getListedAssets: builder.getListedAssets.handler(async () => {
      const providerAssets = await service.getListedAssets();

      const assets = await Promise.all(
        providerAssets.map(asset => transformAssetFromProvider(asset))
      );

      return {
        assets,
        measuredAt: new Date().toISOString()
      };
    }),

    getRates: builder.getRates.use(transformRoutesMiddleware).handler(async ({ input, context }) => {
      const providerRates = await service.getRates(context.routes, input.notionals);
      const rates = await Promise.all(
        providerRates.map(r => transformRate(r, transformAssetFromProvider))
      );
      return { rates };
    }),

    getLiquidity: builder.getLiquidity.use(transformRoutesMiddleware).handler(async ({ input, context }) => {
      const providerLiquidity = await service.getLiquidityDepth(context.routes);
      const liquidity = await Promise.all(
        providerLiquidity.map(l => transformLiquidity(l, transformAssetFromProvider))
      );
      return { liquidity };
    }),

    getSnapshot: builder.getSnapshot
      .use(transformRoutesMiddleware)
      .handler(async ({ input, context }) => {
        const providerSnapshot = await service.getSnapshot({
          routes: context.routes,
          notionals: input.notionals,
          includeWindows: input.includeWindows
        });

        // Transform all nested provider types to NEAR Intents format
        const [rates, liquidity, assets] = await Promise.all([
          providerSnapshot.rates
            ? Promise.all(providerSnapshot.rates.map(r => transformRate(r, transformAssetFromProvider)))
            : undefined,
          providerSnapshot.liquidity
            ? Promise.all(providerSnapshot.liquidity.map(l => transformLiquidity(l, transformAssetFromProvider)))
            : undefined,
          Promise.all(providerSnapshot.listedAssets.assets.map(transformAssetFromProvider))
        ]);

        return {
          volumes: providerSnapshot.volumes,
          listedAssets: { assets, measuredAt: providerSnapshot.listedAssets.measuredAt },
          ...(rates && { rates }),
          ...(liquidity && { liquidity })
        };
      }),

    ping: builder.ping.handler(async () => ({
      status: "ok" as const,
      timestamp: new Date().toISOString(),
    })),
  };
}
```

### Phase 3: Provider-Specific Customizations

#### Default Providers (ChainId Format)
For Across, cBridge, deBridge, Li.Fi - use the template as-is.

**Across Example:**
```typescript
// plugins/across/src/contract.ts
export const AcrossAsset = z.object({
  chainId: z.string(),      // Numeric chainId as string
  address: z.string().optional(),
  symbol: z.string(),
  decimals: z.number()
});

export const AcrossRoute = z.object({
  source: AcrossAsset,
  destination: AcrossAsset
});

export type AcrossAssetType = z.infer<typeof AcrossAsset>;
export type AcrossRouteType = z.infer<typeof AcrossRoute>;
```

**Service Method Signatures:**
```typescript
// ❌ BEFORE - Wrong: accepts NEAR Intents format, private methods
private async getRates(
  routes: Array<{ source: AssetType; destination: AssetType }>,
  notionals: string[]
): Promise<RateType[]>

private async getListedAssets(): Promise<ListedAssetsType>

// ✅ AFTER - Correct: accepts provider format, public methods
async getRates(
  routes: AcrossRouteType[],
  notionals: string[]
): Promise<RateType[]>

async getListedAssets(): Promise<AcrossAssetType[]>
```

#### Custom Providers (Different Formats)

**Axelar (chainName instead of chainId):**
```typescript
// plugins/axelar/src/contract.ts
export const ProviderAsset = z.object({
  chainName: z.string(), // ← Different from template
  address: z.string().optional(),
  symbol: z.string(),
  decimals: z.number()
});

// plugins/axelar/src/index.ts
const transformRoute = async (route: { source: AssetType; destination: AssetType }) => {
  const sourceChainId = await getChainId(route.source.blockchain);
  const destChainId = await getChainId(route.destination.blockchain);

  if (!sourceChainId || !destChainId) return null;

  // Fetch chain names from Axelarscan API
  const sourceChainName = await getChainNameFromId(sourceChainId);
  const destChainName = await getChainNameFromId(destChainId);

  return {
    source: {
      chainName: sourceChainName, // ← Use chainName
      address: route.source.contractAddress,
      symbol: route.source.symbol,
      decimals: route.source.decimals
    },
    destination: { /* same */ }
  };
};
```

**CCTP (domainId instead of chainId):**
```typescript
// plugins/cctp/src/contract.ts
export const ProviderAsset = z.object({
  domainId: z.string(), // ← Circle's domain ID
  address: z.string().optional(),
  symbol: z.string(),
  decimals: z.number()
});

// plugins/cctp/src/index.ts
const transformRoute = async (route: { source: AssetType; destination: AssetType }) => {
  const sourceChainId = await getChainId(route.source.blockchain);
  const destChainId = await getChainId(route.destination.blockchain);

  if (!sourceChainId || !destChainId) return null;

  // Map chainId to Circle domainId
  const sourceDomainId = await getDomainIdFromChainId(sourceChainId);
  const destDomainId = await getDomainIdFromChainId(destChainId);

  return {
    source: {
      domainId: sourceDomainId, // ← Use domainId
      address: route.source.contractAddress,
      symbol: route.source.symbol,
      decimals: route.source.decimals
    },
    destination: { /* same */ }
  };
};
```

## Testing Migration

### Unit Tests
```typescript
// plugins/_plugin_template/tests/unit/service.test.ts
describe('DataProviderService', () => {
  it('getVolumes returns empty array', async () => {
    const service = new DataProviderService('http://test', 'key', 1000);
    const result = await service.getVolumes(['24h']);
    expect(result).toEqual([]);
  });

  it('getSnapshot coordinates all methods', async () => {
    const service = new DataProviderService('http://test', 'key', 1000);
    const result = await service.getSnapshot({
      routes: [],
      notionals: ['1000000'],
      includeWindows: ['24h']
    });

    expect(result).toEqual({
      volumes: [],
      listedAssets: [], // Service returns ProviderAssetType[]
      rates: [],
      liquidity: []
    });
  });
});
```

### Integration Tests
```typescript
// plugins/_plugin_template/tests/integration/plugin.test.ts
describe('Plugin Integration', () => {
  it('getSnapshot transforms routes and returns data', async () => {
    const { client } = await runtime.usePlugin('@data-provider/template', {
      variables: { baseUrl: 'http://test' },
      secrets: { apiKey: 'test-key' }
    });

    const result = await client.getSnapshot({
      routes: testRoutes,
      notionals: testNotionals,
      includeWindows: ['24h']
    });

    expect(result.volumes).toBeDefined();
    expect(result.listedAssets).toBeDefined();
    expect(result.rates).toBeDefined();
    expect(result.liquidity).toBeDefined();
  });
});
```

## Common Pitfalls

### 1. Wrong Parameter Names
❌ `service.getSnapshot({ providerRoutes: routes })`
✅ `service.getSnapshot({ routes })`

### 2. Missing Generic Types
❌ `withAssetTransform(({ routes }) => ...)`
✅ `withAssetTransform<typeof input, ProviderRouteType, never, Error, ProviderSnapshotType>(({ routes }) => ...)`

### 3. Incorrect Context Access
❌ `context.routes` (middleware adds to context)
✅ `routeContext.routes` (destructured parameter)

### 4. Schema Mismatches
❌ Using `chainId` for Axelar
✅ Define custom `ProviderAsset` schema with `chainName`

### 5. Missing TransformRoute Context
❌ `return { service };` in initialize
✅ `return { service, transformRoute };` in initialize

### 6. Missing TransformAsset Context
❌ `return { service, transformRoute };` in initialize
✅ `return { service, transformRoute, transformAsset };` in initialize

### 7. Wrong Middleware Factory Usage
❌ `createTransformRoutesMiddleware<T>()` (missing parameters)
✅ `createTransformRoutesMiddleware<TInput, TOutput>(transformRoute)` (with parameters)

## Architecture Decisions

### Why Multi-Route Instead of Monolithic?

**Before**: Single `getSnapshot` endpoint handled everything internally
**After**: 5 separate endpoints with middleware-based transformation

**Rationale**:
- **Testability**: Individual endpoints can be tested in isolation
- **Flexibility**: Clients can fetch only the data they need
- **Performance**: Parallel API calls instead of sequential
- **Maintainability**: Clear separation of concerns between data types
- **Evolution**: Easy to add new endpoints without breaking existing ones

### Why Middleware for Route Transformation?

**Before**: Manual transformation in service methods
**After**: oRPC middleware handles transformation automatically

**Rationale**:
- **Consistency**: All route-handling endpoints use the same pattern
- **Reusability**: Middleware can be shared across plugins
- **Separation**: Transformation logic isolated from business logic
- **Type Safety**: Middleware provides typed context to handlers
- **Maintainability**: Changes to transformation logic centralized

### Why Two-Format Architecture?

**Provider Format** vs **NEAR Intents Format**

**Rationale**:
- **API Fidelity**: Service layer matches provider APIs exactly
- **Client Compatibility**: Router layer ensures consistent client interface
- **Evolution**: Provider APIs change independently of client expectations
- **Testing**: Can test transformation logic separately from business logic
- **Customization**: Each provider can define their own schemas

### Asset Transformation Patterns

#### AssetId Format
Assets must follow the NEAR Intents format:
```typescript
// ✅ Correct format
assetId: `nep141:${blockchain}-${address.toLowerCase()}.omft.near`

// ❌ Wrong formats
assetId: `nep141:${address}`  // Missing blockchain and .omft.near
assetId: `nep141:${blockchain}-${address}`  // Missing .omft.near
```

#### ChainId Handling
- **NEAR Intents Format**: Does NOT include `chainId` in asset responses (optional field)
- **Provider Format**: Uses `chainId` as string (matches provider API)
- **Custom Mappings**: Handle provider-specific chainIds in `transformAssetFromProvider`

```typescript
// Example: Solana chainId mapping
const transformAssetFromProvider = async (asset: ProviderAssetType): Promise<AssetType> => {
  let blockchain = await getBlockchainFromChainId(asset.chainId);

  if (!blockchain) {
    switch (asset.chainId) {
      case "34268394551451": { // Solana
        blockchain = "sol";
        break;
      }
      default: {
        throw new Error(`Unknown chainId: ${asset.chainId}`);
      }
    }
  }

  return {
    blockchain,
    assetId: `nep141:${blockchain}-${asset.address.toLowerCase()}.omft.near`,
    symbol: asset.symbol,
    decimals: asset.decimals,
    contractAddress: asset.address
    // Note: No chainId in response - it's optional
  };
};
```

#### Price Caching Pattern
For providers that include price data in asset listings:

```typescript
// 1. Update provider asset schema
export const ProviderAsset = z.object({
  chainId: z.string(),
  address: z.string().optional(),
  symbol: z.string(),
  decimals: z.number(),
  priceUsd: z.string().optional()  // Add price field
});

// 2. Cache prices during asset fetching
private async fetchTokens(): Promise<ProviderAssetType[]> {
  const tokens = await this.client.fetchTokens();

  const assets: ProviderAssetType[] = tokens.map(token => {
    if (token.priceUsd) {
      const cacheKey = `${token.chainId}:${token.address.toLowerCase()}`;
      this.priceCache.set(cacheKey, {
        priceUsd: parseFloat(token.priceUsd),
        symbol: token.symbol,
        fetchedAt: Date.now(),
      });
    }

    return {
      chainId: token.chainId,
      address: token.address,
      symbol: token.symbol,
      decimals: token.decimals,
      priceUsd: token.priceUsd,
    };
  });

  return assets;
}

// 3. Use cached prices for fee calculations
private async getTokenPrice(chainId: number, tokenAddress: string): Promise<number | null> {
  const cacheKey = `${chainId}:${tokenAddress.toLowerCase()}`;
  const cached = this.priceCache.get(cacheKey);

  if (cached && (Date.now() - cached.fetchedAt) < this.PRICE_CACHE_TTL) {
    return cached.priceUsd;
  }

  return null;
}
```

## Testing Strategy

### Migration Verification

After migration, verify these aspects:

1. **Contract Compliance**: All endpoints return expected data structures
2. **Transformation Accuracy**: Routes and assets convert correctly between formats
3. **Middleware Integration**: Routes passed through middleware are properly transformed
4. **Performance**: Parallel API calls work correctly
5. **Error Handling**: Errors propagate through the full stack

### Integration Test Examples

```typescript
describe('Migration Verification', () => {
  it('getSnapshot returns all data types', async () => {
    const { client } = await runtime.usePlugin('@data-provider/template', config);

    const result = await client.getSnapshot({
      routes: testRoutes,
      notionals: ['1000000'],
      includeWindows: ['24h']
    });

    // Verify all data types present
    expect(result.volumes).toBeDefined();
    expect(result.listedAssets.assets).toBeDefined();
    expect(result.rates).toBeDefined();
    expect(result.liquidity).toBeDefined();

    // Verify asset transformation
    expect(result.listedAssets.assets[0].assetId).toMatch(/^nep141:/);
  });

  it('individual routes work independently', async () => {
    const { client } = await runtime.usePlugin('@data-provider/template', config);

    // Test each endpoint separately
    const volumes = await client.getVolumes({ includeWindows: ['24h'] });
    const assets = await client.getListedAssets();
    const rates = await client.getRates({ routes: testRoutes, notionals: ['1000000'] });
    const liquidity = await client.getLiquidity({ routes: testRoutes });

    expect(volumes.volumes).toBeDefined();
    expect(assets.assets).toBeDefined();
    expect(rates.rates).toBeDefined();
    expect(liquidity.liquidity).toBeDefined();
  });
});
```

## Troubleshooting

### Common Migration Issues

#### 1. Middleware Context Not Available
**Error**: `context.routes is undefined` in handlers

**Cause**: Handler expects `context.routes` but middleware didn't run
**Solution**: Ensure `.use(transformRoutesMiddleware)` is applied to route builder

```typescript
// ❌ Wrong
getRates: builder.getRates.handler(async ({ input }) => {
  // context.routes undefined
});

// ✅ Correct
getRates: builder.getRates.use(transformRoutesMiddleware).handler(async ({ input, context }) => {
  // context.routes available
});
```

#### 2. Asset Transformation Fails
**Error**: Assets not transforming from provider to NEAR Intents format

**Cause**: `transformAsset` function missing or incorrect
**Solution**: Verify `transformAsset` returns proper `AssetType` structure

```typescript
const transformAsset = async (asset: ProviderAssetType): Promise<AssetType> => {
  return {
    blockchain: await getBlockchainFromChainId(asset.chainId),
    assetId: asset.address ? `nep141:${asset.address}` : `nep141:${asset.symbol}`,
    symbol: asset.symbol,
    decimals: asset.decimals,
    chainId: asset.chainId,
    contractAddress: asset.address
  };
};
```

#### 3. Route Transformation Returns Null
**Error**: Routes not transforming, handlers receive empty arrays

**Cause**: `transformRoute` returns `null` for unsupported blockchains
**Solution**: Check `getChainId` calls and handle unsupported chains

```typescript
const transformRoute = async (route: RouteType) => {
  const sourceChainId = await getChainId(route.source.blockchain);
  const destChainId = await getChainId(route.destination.blockchain);

  if (!sourceChainId || !destChainId) {
    console.warn(`Unsupported blockchain: ${route.source.blockchain}`);
    return null; // Skip this route
  }

  return { /* transformed route */ };
};
```

#### 4. Schema Validation Errors
**Error**: Zod validation fails on provider schemas

**Cause**: Provider API response doesn't match `ProviderAsset`/`ProviderRoute` schemas
**Solution**: Customize schemas to match actual provider API format

```typescript
// For Axelar (uses chainName instead of chainId)
export const ProviderAsset = z.object({
  chainName: z.string(), // Customize based on provider
  address: z.string().optional(),
  symbol: z.string(),
  decimals: z.number()
});
```

#### 5. Parallel API Calls Fail
**Error**: `Promise.all` in `getSnapshot` fails with network errors

**Cause**: Provider API rate limits or temporary failures
**Solution**: Add error handling and fallback logic

```typescript
const [volumes, listedAssets, rates, liquidity] = await Promise.allSettled([
  this.getVolumes(params.includeWindows || ["24h"]),
  this.getListedAssets(),
  params.notionals ? this.getRates(params.routes, params.notionals) : Promise.resolve([]),
  this.getLiquidityDepth(params.routes)
]);

// Handle partial failures gracefully
return {
  volumes: volumes.status === 'fulfilled' ? volumes.value : [],
  listedAssets: listedAssets.status === 'fulfilled' ? listedAssets.value : [],
  rates: rates.status === 'fulfilled' ? rates.value : [],
  liquidity: liquidity.status === 'fulfilled' ? liquidity.value : []
};
```

### Performance Considerations

#### Parallel Processing
- `getSnapshot` uses `Promise.all` for concurrent API calls
- Reduces total response time compared to sequential calls
- Consider provider rate limits when adding parallelism

#### Memory Usage
- Large datasets may require streaming or pagination
- Asset transformation creates new objects - consider memory implications
- Use bounded queues for background processing

#### Rate Limiting
- HTTP client includes rate limiting (10 req/sec default)
- Adjust based on provider API limits
- Implement exponential backoff for retries

### Rollback Plan

If migration issues arise:

1. **Keep Old Contract**: Maintain monolithic `getSnapshot` alongside new routes
2. **Feature Flags**: Use configuration to switch between architectures
3. **Gradual Migration**: Migrate one provider at a time
4. **Fallback Logic**: Implement fallback to old behavior on errors

## Benefits

- **Type Safety**: Provider-specific schemas prevent runtime errors
- **Reusability**: Middleware can be reused across plugins
- **Testability**: Individual routes can be tested separately
- **Maintainability**: Clear separation between transformation and business logic
- **Extensibility**: Easy to add new providers with custom schemas

## Rollback Plan

If issues arise, rollback involves:
1. Revert contract to single `getSnapshot` endpoint
2. Remove middleware usage
3. Restore monolithic service methods
4. Keep provider schemas for future migration
