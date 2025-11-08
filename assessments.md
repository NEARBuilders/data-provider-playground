# Data Provider Plugin Assessments

## Assessment Criteria

### Priority Order

1. **Official API Usage**: Use provider's official APIs whenever possible
2. **Working Functionality**: Implementation must work without critical bugs
3. **No Fallbacks**: No fake data - return empty arrays rather than false data
4. **Data Accuracy**: Real data from APIs/blockchain vs hardcoded values
5. **Third-Party Sources**: Acceptable only when official API doesn't provide the data

### Data Types Assessed

- **Volumes**: 24h/7d/30d transaction volumes (USD)
- **Rates**: Exchange rates with fees for specific routes/notionals
- **Liquidity**: Available liquidity at 50bps/100bps slippage thresholds
- **Assets**: Supported tokens with correct decimals/symbols

### Scoring

- ✅ **Good**: Uses official API, works correctly
- ⚠️ **Acceptable**: Third-party source when official unavailable
- ❌ **Bad**: Hardcoded data, broken implementation, fake data

---

## Across Protocol

### Assessment Summary

All three implementations have issues. No clear winner. Here's what each does wrong and the proper solution.

### across-0xjesus

**Issues:**

- ❌ Duplicate assets (same token appears twice)
- ⚠️ Uses DefiLlama for volumes (acceptable since Across API doesn't provide this)

**What Works:**

- ✅ Uses `/limits` for liquidity
- ✅ Uses `/suggested-fees` for rates
- ✅ Uses `/swap/tokens` for assets (1289 tokens)

**Recommendation:** Fix duplicate asset bug, keep DefiLlama volumes.

### across-aniekan

**Issues:**

- ❌ Hardcoded decimals (not from API)
- ❌ Doesn't use `/limits` for liquidity
- ❌ Returns 0 for volumes, rates, liquidity in unit tests

**What Works:**

- ✅ Uses `/available-routes` for assets (107 tokens, no duplicates)
- ✅ Uses `/suggested-fees` for rates (works in integration tests)

**Recommendation:** Add `/limits` integration, get decimals from API.

### across-lok

**Issues:**

- ❌ Returns 0 assets (broken implementation)
- ❌ Binary search unnecessary (Across provides `/limits`)
- ❌ Multiple API failures in tests

**What Works:**

- ✅ Returns 0 for volumes (correct approach)

**Recommendation:** Not viable, too many issues.

### Proper Solution

**Use `/swap/tokens` for assets** (better than `/available-routes` because includes decimals)
**Use `/limits` for liquidity** (no binary search needed)
**Use `/suggested-fees` for rates**
**Use DefiLlama for volumes** (acceptable third-party since official API doesn't provide)

---

## Axelar Protocol

### Assessment Summary

Only one submission (axelar-0xjesus). Tests pass but implementation heavily relies on hardcoded fallbacks, violating "no fake data" principle.

### Issues

- ❌ **Broken Asset Parsing**: Fetches from `/getAssets` but extracts 0 real assets, falls back to 3 hardcoded tokens
- ❌ **Broken Chain Mapping**: Cannot parse `/getChains` response, uses hardcoded fallback chains
- ❌ **SDK Fee Calculation Fails**: AxelarJS SDK calls fail with "Asset usdc not found", uses 0.1% estimate
- ❌ **Liquidity Uses Estimates**: TVL API fails, uses hardcoded percentages of estimated TVL
- ❌ **Extensive Hardcoded Fallbacks**: FALLBACK_CHAINS, FALLBACK_VOLUMES_USD, FALLBACK_LISTED_ASSETS violate "no fake data" rule

### What Works

- ✅ **Volumes**: Real data from Axelarscan `/token/transfersTotalVolume` API ($27K/24h, $1.1M/7d, $6.9M/30d)
- ✅ **Architecture**: Proper AxelarJS SDK integration, rate limiting, retry logic
- ✅ **All Tests Pass**: 4/4 unit tests, 2/2 integration tests

### Recommendation

**NOT PRODUCTION READY** - needs significant fixes:

1. **Fix asset parsing**: Debug why 0 assets extracted from API response
2. **Fix chain parsing**: Properly parse `/getChains` response structure
3. **Fix SDK integration**: Correct asset denom format for fee queries
4. **Remove fallbacks**: Return empty arrays instead of fake data
5. **Fix TVL lookups**: Use correct asset denom format for `/getTVL`

**Verdict**: Good foundation, broken implementation. Fix parsing before production use.

---

## CCTP Protocol

### Assessment Summary

Three submissions: cctp-0xjesus (winner), cctp-kyler (not viable), cctp-usman (wrong protocol).

### cctp-0xjesus ✅ **WINNER**

**What Works:**

- ✅ **Official Circle CCTP API**: Uses `iris-api.circle.com` endpoints
- ✅ **Domain Config**: Loads official Circle domain mappings from bundled JSON
- ✅ **Real Volumes**: DefiLlama integration ($5.9M/24h, $1.7B/7d, $5B/30d)
- ✅ **Rates**: Uses `/v2/burn/USDC/fees/{sourceDomain}/{destDomain}` API
- ✅ **Liquidity**: Uses `/v2/fastBurn/USDC/allowance` API ($9.7M allowance)
- ✅ **Assets**: 7 USDC tokens across supported chains (includes Solana)
- ✅ **Rate Limiting**: 35 req/sec (per CCTP docs)
- ✅ **All Tests Pass**: 4/4 unit, 2/2 integration

**Architecture:**

- Proper error handling and retry logic
- Comprehensive logging
- Official domain mapping validation

### cctp-kyler ❌ **NOT VIABLE**

**Issues:**

- ❌ **No Volume Data**: Returns 0 for all windows
- ❌ **Requires Graph API Key**: Uses The Graph Protocol subgraphs (not free/public)
- ❌ **Hardcoded Gas Estimates**: Uses estimated gas fees instead of Circle API

**What Works:**

- ✅ Uses hardcoded CCTP chain configs (correct addresses)
- ✅ 7 USDC assets listed
- ✅ Returns 1:1 rates (correct for CCTP)

**Recommendation:** Archive - requires paid API key, returns no volume data.

### cctp-usman ❌ **WRONG PROTOCOL**

**Critical Issue:**

```typescript
// Uses cBridge API instead of CCTP:
const url = `https://cbridge-prod2.celer.app/v1/transferHistory...`
```

**Issues:**

- ❌ **cBridge, not CCTP**: cBridge = Celer Network, CCTP = Circle
- ❌ **Hardcoded 6 bps Fee**: Uses estimate instead of Circle API
- ⚠️ Only 6 USDC assets (missing Solana)

**What Works:**

- ✅ Uses Circle API for liquidity (`/v2/fastBurn/USDC/allowance`)

**Recommendation:** Archive BUT create separate **cBridge plugin** using this code as base.

### Proper CCTP Solution

**Winner: cctp-0xjesus** - already implements correctly:

- **Volumes**: DefiLlama (acceptable - CCTP doesn't provide volume API)
- **Rates**: Circle `/v2/burn/USDC/fees` API
- **Liquidity**: Circle `/v2/fastBurn/USDC/allowance` API
- **Assets**: Hardcoded Circle USDC addresses (official, stable)
- **Domain Mapping**: Official Circle configuration

---

## LayerZero Protocol

### Assessment Summary

Two submissions: layerzero-0xjesus (good foundation, easily fixable), layerzero-himanshu (broken).

### layerzero-0xjesus ⚠️ **GOOD FOUNDATION - EASILY FIXABLE**

**What Works:**

- ✅ **Official Stargate API**: Uses `/quotes`, `/chains`, `/tokens` endpoints correctly
- ✅ **Architecture**: Proper rate limiting, retry logic, binary search for liquidity
- ✅ **One Quote Success**: Works with large amounts in integration test
- ✅ **No Fake Data**: Returns empty arrays when unavailable (correct approach)
- ✅ **Complete Implementation**: Full code exists for volumes, liquidity, assets

**Issues:**

- ❌ **"Module Federation Bug"**: Actually just early `return []` statements that make implementation unreachable
- ❌ **HTTP 422 on Small Amounts**: Stargate API rejects small test amounts
- ❌ **Returns Empty Data**: Due to early returns, not actual bugs

**Code Quality:**

- Excellent error handling and documentation
- Proper DefiLlama integration for volumes
- Comprehensive binary search for liquidity
- Just needs early returns removed to work

### layerzero-himanshu ❌ **COMPLETELY BROKEN**

**Issues:**

- ❌ **All Tests Fail**: Generic "[object Object]" error
- ❌ **Poor Error Handling**: Errors not properly serialized/logged
- ❌ **Volume Calculation Wrong**: Uses gas fees instead of transfer amounts
- ❌ **Modular but Broken**: Separated into client classes but nothing works

**Recommendation:** Archive - fundamentally broken, poor error handling.

### Recommendation

**No Winner** - but layerzero-0xjesus is easily fixable:

**Fixes Needed:**

1. Remove early `return []` statements in `getVolumes()`, `getLiquidityDepth()`, `getListedAssets()`
2. Add DefiLlama API call in `getVolumes()` (code exists but unreachable)
3. Debug HTTP 422 errors (may need minimum amount thresholds)

**Proper LayerZero Solution:**

- **Volumes**: DefiLlama (acceptable - Stargate API doesn't provide)
- **Rates**: Stargate `/quotes` API
- **Liquidity**: Binary search with Stargate quotes + `srcAmountMax`
- **Assets**: Stargate `/tokens` and `/chains` APIs

**Verdict**: layerzero-0xjesus has excellent foundation, just needs simple fixes.

---

## LiFi Protocol

### Assessment Summary

Three submissions: lifi-posma (**WINNER** - needs fixes), lifi-misbah (incomplete data), lifi-0xjesus (wrong API).

### lifi-posma ✅ **WINNER - NEEDS FIXES**

**What Works:**

- ✅ **Official Li.Fi API**: Uses `/v2/analytics/transfers` with proper pagination (8 pages × 1000 transfers)
- ✅ **Real Volume Data**: $13.3M/24h from actual transfer records (receiving.amountUSD)
- ✅ **Complete Assets**: 11,210 tokens from `/tokens` API
- ✅ **Working Rates**: Quote API integration with proper fee calculations
- ✅ **Working Liquidity**: Binary search implementation with 50bps/100bps thresholds
- ✅ **Tests Pass**: 2/4 unit tests, 2/2 integration tests
- ✅ **No Fake Data**: Returns empty arrays on errors (correct approach)

**Issues:**

- ❌ **7d/30d Volume Timeouts**: Longer time windows require more API calls, causing aborts
- ❌ **Rate Limiting**: Some HTTP 429 errors despite retry logic
- ❌ **Pagination Delays**: Needs longer delays between paginated requests

**Architecture:**

- Proper retry logic with exponential backoff
- Comprehensive error handling
- Real-time quote fetching for rates/liquidity

### lifi-misbah ⚠️ **INCOMPLETE DATA**

**Issues:**

- ❌ **Limited Volume Data**: Only fetches 1000 transfers total (no pagination) = ~10% of actual volume
- ❌ **Low Volume Numbers**: $1.4M across all windows (suspiciously low due to incomplete data)
- ❌ **Test Timeouts**: 78s runtime indicates inefficient API usage

**What Works:**

- ✅ **Official Li.Fi API**: Uses `/v1/analytics/transfers` (but incomplete usage)
- ✅ **Rate Limiting**: Good RateLimiter class (3 concurrent, 500ms delay)
- ✅ **Assets Load**: 11,210 tokens from API
- ✅ **Error Handling**: Graceful degradation on failures

**Architecture:**

- Custom RateLimiter and retryWithBackoff utilities
- Proper exponential backoff on 429 errors

### lifi-0xjesus ❌ **WRONG API CHOICE**

**Critical Issues:**

- ❌ **Third-Party API**: Uses DefiLlama `/bridge/lifi` instead of official Li.Fi API
- ❌ **All Tests Fail**: 4/4 timeout after 30s, severe HTTP 429 rate limiting
- ❌ **Returns $0**: No volume data due to API failures
- ❌ **Over-Engineered**: Complex token bucket rate limiter causes too many API calls

**What Works:**

- ✅ **Architecture**: Sophisticated rate limiting and retry logic
- ✅ **No Fake Data**: Returns empty arrays on failures

**Recommendation:** Archive - violates "official API first" rule.

### Proper LiFi Solution

**Winner: lifi-posma** - implements correctly but needs fixes:

**Fixes Required:**

1. **Pagination Optimization**: Add longer delays between `/v2/analytics/transfers` calls (currently 500ms)
2. **7d/30d Handling**: Implement chunked requests or accept partial data for longer windows
3. **Rate Limit Tuning**: Reduce concurrent requests during pagination

**Implementation Details:**

- **Volumes**: Li.Fi `/v2/analytics/transfers` API with pagination (aggregates receiving.amountUSD)
- **Rates**: Li.Fi `/quote` API with fee calculations
- **Liquidity**: Binary search using quote API (50bps/100bps thresholds)
- **Assets**: Li.Fi `/tokens` API (11,210 tokens)

**Verdict**: lifi-posma is production-ready with minor fixes. Excellent use of official APIs.

---

## deBridge Protocol

### Assessment Summary

Two submissions: debridge-0xjesus (**WINNER** - needs minor fix), debridge-wali (uses fake data).

### debridge-0xjesus ✅ **WINNER - NEEDS MINOR FIX**

**What Works:**

- ✅ **Official deBridge DLN API**: Uses `/dln/order/create-tx` for quotes, `/token-list` for assets
- ✅ **Real Volume Data**: DefiLlama integration ($316K/24h, $441M/7d, $1.2B/30d)
- ✅ **Complete Assets**: 7,862 tokens from `/token-list` API
- ✅ **Working Rates**: Quote API with proper fee calculations and USD estimates
- ✅ **Working Liquidity**: Binary search with 50bps/100bps thresholds
- ✅ **Tests Pass**: 4/4 unit tests, 1/2 integration tests
- ✅ **No Fake Data**: Returns empty arrays on errors (correct approach)
- ✅ **Performance**: 25s execution time

**Issues:**

- ❌ **Integration Test Failure**: Uses $10M amounts exceeding deBridge's $5.5M USD limit
- ❌ **API Rejection**: `HTTP 400: "USD equivalent of this trade is bigger than 5.5M"`

**Architecture:**

- Token bucket rate limiter (10 req/sec)
- Exponential backoff retry logic
- Volume caching (10min TTL)
- Comprehensive error handling

### debridge-wali ❌ **USES FAKE DATA**

**Critical Issues:**

- ❌ **Hardcoded Volume Fallbacks**: When stats API fails, uses fake estimates ($3M/24h, $21M/7d, $90M/30d)
- ❌ **Limited Assets**: Only returns 9 hardcoded tokens instead of querying API
- ❌ **Volume API Fails**: `Request failed after 4 attempts: HTTP 400: Bad Request`
- ❌ **Poor Performance**: 68s execution (2.7x slower than winner)

**What Works:**

- ✅ **Official deBridge DLN API**: Uses `/dln/order/create-tx` for quotes
- ✅ **Working Rates**: Quote API integration with fee calculations
- ✅ **Tests Pass**: 4/4 unit tests, 2/2 integration tests
- ✅ **Advanced Architecture**: TTL caching, request deduplication, circuit breakers

**Architecture:**

- Enterprise-grade features (TTL caching, deduplication, circuit breakers)
- Structured logging with Logger class
- Request deduplication prevents duplicate API calls

### Proper deBridge Solution

**Winner: debridge-0xjesus** - implements correctly with minor fix:

**Fix Required:**

1. **Integration Test Amounts**: Change test amounts from $10M to <$5M to avoid deBridge API limits
2. **API Limit Handling**: Add proper error handling for USD amount limits

**Implementation Details:**

- **Volumes**: DefiLlama (acceptable - deBridge doesn't provide volume API)
- **Rates**: deBridge DLN `/dln/order/create-tx` API with fee breakdown
- **Liquidity**: Binary search using quote API (50bps/100bps thresholds)
- **Assets**: deBridge `/token-list` API (7,862 tokens)

**Verdict**: debridge-0xjesus is production-ready with a simple test fix. Excellent use of official APIs and real data.

---

## Wormhole Protocol

### Assessment Summary

Two submissions: wormhole-0xjesus (**WINNER** - needs fixes), wormhole-fati (returns $0 volumes).

### wormhole-0xjesus ✅ **WINNER - NEEDS FIXES**

**What Works:**

- ✅ **Official Wormholescan API**: Uses `/api/v1/scorecards` for real volume data ($99M/24h, $936M/7d, $3.05B/30d)
- ✅ **Comprehensive Assets**: 150 verified tokens from `token-decimals.json` (all addresses/decimals verified)
- ✅ **Real Governor Limits**: Attempts `/api/v1/governor/notional/limit` API for liquidity
- ✅ **Realistic Fee Model**: 0.01% protocol fee + chain-specific relayer fees ($3-15)
- ✅ **Tests Pass**: 4/4 unit tests, 2/2 integration tests
- ✅ **No Fake Data**: Returns empty arrays on errors (correct approach)
- ✅ **Rate Limiting**: Token bucket implementation (configurable via ENV)

**Issues:**

- ❌ **Governor API Parsing Bug**: `TypeError: governorLimits is not iterable` - assumes array but gets object/single item
- ❌ **Asset List Fallback**: Uses hardcoded config instead of API (but config is comprehensive and verified)

**Architecture:**

- Token bucket rate limiter with exponential backoff
- Comprehensive error handling and logging
- Verified token-decimals.json configuration

### wormhole-fati ❌ **RETURNS $0 VOLUMES**

**Critical Issues:**

- ❌ **Volume Test Fails**: Returns $0 for 24h volume (`expected 0 to be greater than 0`)
- ❌ **Limited Assets**: Only 6 hardcoded tokens vs 150 comprehensive list
- ❌ **No Governor API**: Uses conservative hardcoded liquidity estimates
- ❌ **Simplified Fees**: Generic 10 bps fee vs realistic chain-specific model

**What Works:**

- ✅ **Official Wormholescan API**: Uses `/api/v1/scorecards` and `/api/v1/top-assets-by-volume`
- ✅ **Tests Pass**: 3/4 unit tests, 2/2 integration tests
- ✅ **Rate Limiting**: Simple delay-based implementation

**Architecture:**

- Basic retry logic with exponential backoff
- Axios-based HTTP client

### Proper Wormhole Solution

**Winner: wormhole-0xjesus** - implements correctly but needs fixes:

**Fixes Required:**

1. **Governor API Parsing**: Debug response structure - likely returns object, not array
2. **Asset List**: Consider API integration but keep verified config as reliable fallback

**Implementation Details:**

- **Volumes**: Wormholescan `/api/v1/scorecards` API (real data)
- **Rates**: Calculated fees based on official Wormhole documentation
- **Liquidity**: Governor `/api/v1/governor/notional/limit` API (real limits)
- **Assets**: Verified `token-decimals.json` config (150 tokens, all verified)

**Verdict**: wormhole-0xjesus is production-ready with minor API parsing fix. Excellent use of official APIs and comprehensive asset coverage.
