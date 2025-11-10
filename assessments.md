# Data Provider Plugin Assessments

## Assessment Criteria

**Priority Order:**

1. **Official API Usage** - Use provider's official APIs whenever possible
2. **Working Functionality** - Implementation must work without critical bugs
3. **No Fallbacks** - No fake data - return empty arrays rather than false data
4. **Data Accuracy** - Real data from APIs/blockchain vs hardcoded values
5. **Third-Party Sources** - Acceptable only when official API doesn't provide the data

**Data Types Assessed:**

- Volumes (24h/7d/30d USD)
- Rates (with fees)
- Liquidity (50bps/100bps thresholds)
- Assets (with decimals)

**Scoring:**

- ✅ Good (official API, works)
- ⚠️ Acceptable (third-party when needed)
- ❌ Bad (hardcoded/fake data, broken)

---

## Across Protocol

**Summary:** 3 implementations, no clear winner. across-0xjesus and across-aniekan are best but both need fixes.

**UPDATE**: 0xjesus has updated to deduplicate assets and fixed test configurations. All issues resolved.

- **across-0xjesus** ✅ **WINNER**: Official Across APIs (`/limits`, `/suggested-fees`, `/swap/tokens`), DefiLlama volumes ($22.3M/24h), 1,278 unique assets. All tests pass, proper native USDC support post-CCTP migration.
- **across-aniekan** ⚠️ **SECOND BEST**: Official APIs for rates/assets, works in integration tests. **Issue:** Hardcoded decimals, missing `/limits`
- **across-lok** ❌ **BROKEN**: Returns 0 assets, multiple API failures, binary search isn't necessary because of `/limits`.

---

## Axelar Protocol

**Summary:** 2 implementations - axelar-usman is clear winner ✅, uses official Axelarscan APIs exclusively with no fallbacks

**UPDATE**: usman implementation uses official Axelarscan APIs for all data sources, proper SDK integration with denom conversion, and no fallback data. 0xjesus implementation has critical parsing failures and is not production-ready.

- **axelar-usman** ✅ **WINNER**: Official Axelarscan APIs (`/getChains`, `/getAssets`, `/token/transfersTotalVolume`, `/getTVL`), AxelarJS SDK with proper denom conversion, real volumes ($3,942/24h), 1,910 assets, all tests pass, no fallback data
- **axelar-0xjesus** ❌ **BROKEN**: Critical asset/chain parsing failures (0 assets extracted), SDK fee calculations fail, extensive hardcoded fallbacks violate "no fake data" rule

**Verdict:** axelar-usman is production-ready. Good implementation of official Axelar APIs with proper SDK integration.

---

## CCTP Protocol

**Summary:** 3 implementations - cctp-0xjesus is clear winner ✅

**UPDATE**: 0xjesus has added a cBridge plugin

- **cctp-0xjesus** ✅ **WINNER**: Official Circle APIs, real volumes ($5.9M/24h), all tests pass, proper rate limiting
- **cctp-kyler** ❌ **NOT VIABLE**: Graph is clever solution, but Circle APIs are good enough, returns 0 volumes
- **cctp-usman** ❌ **WRONG PROTOCOL**: Uses cBridge API instead of CCTP (will offer a bounty for this tho)

**Verdict:** cctp-0xjesus is production-ready. Good implementation of official Circle CCTP APIs.

---

## LayerZero Protocol

**Summary:** 2 implementations - layerzero-0xjesus is now production-ready with real volume data.

**UPDATE**: Fixed volume estimation bug - now uses DefiLlama Bridges API for real Stargate transaction volumes ($22.9M/24h, $234M/7d, $842M/30d).

- **layerzero-0xjesus** ✅ **WINNER**: Official Stargate APIs (`/chains`, `/tokens`, `/quotes`), DefiLlama Bridges API volumes, binary search liquidity, proper rate limiting. All tests pass, no fake data.
- **layerzero-himanshu** ❌ **BROKEN**: All tests fail, poor error handling, wrong volume calculations

**Verdict:** layerzero-0xjesus is production-ready. Excellent implementation with real data sources.

---

## LiFi Protocol

**Summary:** 3 implementations - lifi-posma is best option but needs fixes. All implementations are pretty slow.

**UPDATE**: 0xjesus has updated to have a moving window for volume. Posma also did an update which may fix the issues.

- **lifi-posma** ✅ **BEST OPTION**: Official Li.Fi v2 API with pagination, real volumes ($13.3M/24h), 11,210 assets. **Issues:** 7d/30d timeouts, rate limiting
- **lifi-misbah** ⚠️ **INCOMPLETE**: Official API but only 1000 transfers (10% of volume), test timeouts
- **lifi-0xjesus** ❌ **WRONG API**: Uses DefiLlama instead of official Li.Fi API, all tests fail

**Verdict:** lifi-posma is closest to production-ready, needs minor pagination/rate limit tuning. Need to look into performance improvements.

---

## deBridge Protocol

**Summary:** 2 implementations, both are correct, but debridge-wali is 2.3x faster.

- **debridge-wali** ✅ **WINNER**: Official DLN APIs, real volumes ($13.6M/24h), 7,863 assets, correct rates (0.9978 avg), **2.3x faster tests (6.2s vs 14.6s)**, features (TTLCache, RequestDeduplicator, CircuitBreaker, Logger, Decimal.js precision).
- **debridge-0xjesus** ⚠️ **SECOND BEST**: Official DLN APIs, real volumes ($13.6M/24h), 7,863 assets, correct rates (0.9978 avg), simple/reliable but slower (14.6s tests).

**Verdict:** debridge-wali is production-ready. Has performance gains while maintaining data accuracy.

---

## cBridge Protocol (Celer Network)

**Summary:** 1 implementation - cbridge-0xjesus is solid but volume data unavailable due to unmaintained official API.

**UPDATE**: Implementation uses official cBridge APIs correctly, but volume statistics API is stale since 2021. Protocol functionality works perfectly.

- **cbridge-0xjesus** ⚠️ **ACCEPTABLE**: Official cBridge APIs (`v2/getTransferConfigsForAll`, `v2/estimateAmt`), 855 assets, working rate quotes (0.9999 avg rate), liquidity measurement. **Critical Issue:** Volume API (`cbridge-stat.s3`) frozen since Dec 2021 - returns $0 for all periods. Protocol is active but statistics unmaintained.

**Verdict:** Good, maybe use DefiLlama for volume

---

## Wormhole Protocol

**Summary:** 2 implementations - wormhole-0xjesus is winner ✅, but needs to fix a small parsing bug and would prefer to not use to hardcoded asset config.

- **wormhole-0xjesus** ✅ **WINNER**: Official Wormholescan APIs, real volumes ($99M/24h), 150 verified assets. **Issues:** Governor API parsing bug, hardcoded asset config
- **wormhole-fati** ❌ **BROKEN**: Returns $0 volumes, only 6 assets, volume test fails

**Verdict:** wormhole-0xjesus is best, needs minor API parsing fix and to be stricter on asset list.
