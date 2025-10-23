# Real Data vs Metadata Disclosure

## 🔍 Complete Transparency

This document provides **complete transparency** about what data comes from real Across API calls vs what requires external data sources.

## ✅ 100% Real Data from Across API

These metrics are fetched **directly from Across API** with **ZERO hardcoding**:

### 1. **Rate Quotes** ✅ REAL
- **Endpoint**: `GET /suggested-fees`
- **Real Fields**:
  - `outputAmount` - Exact output from Across
  - `totalRelayFee.total` - Exact fee from Across
  - `totalRelayFee.pct` - Exact fee percentage from Across
  - `capitalFeePct`, `relayGasFeePct`, `lpFeePct` - All real
  - `expectedFillTimeSec` - Real fill time estimate
  - `timestamp` - Real quote timestamp

**NO METADATA**: All numbers come directly from Across calculations.

### 2. **Available Routes** ✅ REAL
- **Endpoint**: `GET /available-routes`
- **Real Fields**:
  - `originChainId` - Real chain ID
  - `originToken` - Real token address
  - `destinationChainId` - Real chain ID  
  - `destinationToken` - Real token address
  - `enabled` - Real availability status

**NO METADATA**: All route information is real.

### 3. **Deposit Limits** ✅ REAL
- **Endpoint**: `GET /limits`
- **Real Fields**:
  - `minDeposit` - Real minimum from Across
  - `maxDeposit` - Real maximum from Across
  - `maxDepositInstant` - Real instant limit
  - `maxDepositShortDelay` - Real short delay limit

**NO METADATA**: All limits are real-time from Across.

### 4. **Liquidity Depth** ✅ REAL (Derived)
- **Method**: Binary search with real quote requests
- **Data Source**: Multiple calls to `/suggested-fees`
- **Calculation**: Real slippage measurement from actual quotes

**NO METADATA**: Calculated from real quote responses.

## ⚠️ Data Requiring External Sources

### 1. **Volume Metrics** ⚠️ NOT FROM ACROSS API

**Issue**: Across API does **NOT** expose a public volume statistics endpoint.

**Current Approach**: Returns `null` or documents unavailability

**Options for Real Data**:

**Option A - Return NULL** (Most Honest):
```typescript
private async getVolumes(): Promise<VolumeWindowType[]> {
  // Across API doesn't provide volume endpoint
  // Return empty array or throw error
  throw new Error("Volume data not available from Across API");
}
```

**Option B - Use Public Analytics** (External Source):
```typescript
// Fetch from Dune Analytics API (requires separate API key)
const duneQuery = "https://api.dune.com/api/v1/query/...";
// OR from DefiLlama
const defillama = "https://api.llama.fi/protocol/across-protocol";
```

**Option C - On-Chain Aggregation** (Heavy):
```typescript
// Query blockchain events directly
// Aggregate SpokePool deposit events across all chains
// Very resource-intensive
```

**RECOMMENDATION**: Document clearly that volume requires external data source.

### 2. **Token Metadata** (Symbol & Decimals) ⚠️ PARTIAL METADATA

**Issue**: Across API returns only token **addresses**, not symbols or decimals.

**Current Approach**: Hardcoded mapping for common tokens, fallback to address

**Options for Real Data**:

**Option A - On-Chain RPC Calls** (Real but Slow):
```typescript
async function getTokenMetadata(chainId: string, address: string) {
  const rpc = getRpcUrl(chainId);
  const contract = new ethers.Contract(address, ERC20_ABI, provider);
  
  const [symbol, decimals] = await Promise.all([
    contract.symbol(),
    contract.decimals()
  ]);
  
  return { symbol, decimals };
}
```

**Option B - Token Registry API** (External Source):
```typescript
// Use CoinGecko, TokenLists, or similar
const coingecko = `https://api.coingecko.com/api/v3/coins/ethereum/contract/${address}`;
// OR use Uniswap token lists
const tokenList = "https://tokens.uniswap.org/";
```

**Option C - Pre-Built Cache** (One-Time On-Chain Fetch):
```typescript
// Build cache from on-chain data once
// Update periodically
// Much faster than per-request RPC calls
```

**RECOMMENDATION**: Use on-chain RPC calls or token registry for 100% real data.

## 🎯 Recommended Solution for 100% Real Data

### Implementation Plan

```typescript
/**
 * OPTION 1: Fetch real token metadata from on-chain
 */
import { ethers } from 'ethers';

const ERC20_ABI = ['function symbol() view returns (string)', 'function decimals() view returns (uint8)'];

const RPC_URLS: Record<string, string> = {
  '1': process.env.ETHEREUM_RPC_URL || 'https://eth.llamarpc.com',
  '137': process.env.POLYGON_RPC_URL || 'https://polygon.llamarpc.com',
  '42161': process.env.ARBITRUM_RPC_URL || 'https://arbitrum.llamarpc.com',
  // Add more chains
};

async function fetchRealTokenMetadata(
  chainId: string, 
  address: string
): Promise<{ symbol: string; decimals: number }> {
  try {
    const rpcUrl = RPC_URLS[chainId];
    if (!rpcUrl) {
      throw new Error(`No RPC URL for chain ${chainId}`);
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const contract = new ethers.Contract(address, ERC20_ABI, provider);

    const [symbol, decimals] = await Promise.all([
      contract.symbol(),
      contract.decimals()
    ]);

    return { 
      symbol: symbol as string, 
      decimals: Number(decimals) 
    };
  } catch (error) {
    throw new Error(`Failed to fetch metadata for ${address} on chain ${chainId}: ${error}`);
  }
}

/**
 * OPTION 2: Use token registry/list
 */
async function fetchFromTokenList(chainId: string, address: string) {
  // Use Uniswap token lists, CoinGecko, or similar
  const response = await fetch(
    `https://tokens.coingecko.com/${chainId}/all.json`
  );
  const tokens = await response.json();
  return tokens.find((t: any) => t.address.toLowerCase() === address.toLowerCase());
}

/**
 * OPTION 3: Hybrid approach with caching
 */
class RealTokenMetadataService {
  private cache = new Map<string, { symbol: string; decimals: number }>();

  async getMetadata(chainId: string, address: string) {
    const key = `${chainId}:${address}`;
    
    // Check cache first
    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }

    // Fetch real data from on-chain
    const metadata = await fetchRealTokenMetadata(chainId, address);
    
    // Cache for future use
    this.cache.set(key, metadata);
    
    return metadata;
  }
}
```

### For Volume Data

```typescript
/**
 * Honest approach: Return what's actually available
 */
private async getVolumes(windows: Array<"24h" | "7d" | "30d">): Promise<VolumeWindowType[]> {
  // Option 1: Return empty with clear documentation
  console.warn('[Across] Volume data not available - Across API lacks volume endpoint');
  return windows.map(window => ({
    window,
    volumeUsd: 0, // Or null if schema allows
    measuredAt: new Date().toISOString(),
    note: 'Volume data not available from Across API - requires external analytics source'
  }));

  // Option 2: Integrate with external source (DefiLlama, Dune)
  // return await this.fetchVolumeFromDefiLlama();
}
```

## ✅ Current Status Summary

| Data Type | Source | Real Data | Metadata | Recommendation |
|-----------|--------|-----------|----------|----------------|
| **Rate Quotes** | Across API | ✅ 100% | None | ✅ Perfect |
| **Routes** | Across API | ✅ 100% | None | ✅ Perfect |
| **Limits** | Across API | ✅ 100% | None | ✅ Perfect |
| **Liquidity Depth** | Derived from Across | ✅ 100% | None | ✅ Perfect |
| **Volume** | None | ❌ 0% | Hardcoded estimates | ⚠️ Need external source or document N/A |
| **Token Symbols** | None | ❌ 0% | Hardcoded mapping | ⚠️ Need RPC calls or token registry |
| **Token Decimals** | None | ❌ 0% | Hardcoded inference | ⚠️ Need RPC calls or token registry |

## 🚀 Action Items for 100% Real Data

1. **Volume Metrics**:
   - [ ] Integrate DefiLlama API for real volume
   - [ ] OR integrate Dune Analytics
   - [ ] OR document as "Not Available" clearly

2. **Token Metadata**:
   - [ ] Add RPC provider configuration (ethers.js)
   - [ ] Implement on-chain token metadata fetching
   - [ ] Add caching layer to reduce RPC calls
   - [ ] Handle RPC failures gracefully

3. **Documentation**:
   - [ ] Update README with data source transparency
   - [ ] Document external dependencies (RPC providers)
   - [ ] Add configuration for RPC URLs

## 📝 Updated Implementation

Would you like me to:

1. **Remove all metadata** and return only token addresses (100% real but less useful)?
2. **Add RPC integration** to fetch real symbol/decimals on-chain (requires RPC providers)?
3. **Add DefiLlama integration** for real volume data (requires API key)?
4. **Document clearly** what's real vs what needs external sources?

**My recommendation**: Implement options 2 + 3 + 4 for a truly production-ready solution with 100% real data.

