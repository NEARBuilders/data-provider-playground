# ⚡ Quick Start Guide

> **For Judges**: Verify this submission in under 5 minutes

## Prerequisites

- Node.js 18+ installed
- Terminal access

## 1️⃣ Install (30 seconds)

```bash
cd packages/_plugin_template
npm install
```

## 2️⃣ Verify Tests Pass (1 minute)

```bash
npm test
```

**Expected Output:**
```
✓ src/__tests__/integration/plugin.test.ts (8 tests)
✓ src/__tests__/unit/service.test.ts (7 tests)

Test Files  2 passed (2)
     Tests  15 passed (15)
```

## 3️⃣ Verify Contract Compliance (30 seconds)

Check that all required metrics are implemented:

```bash
# View contract specification
cat src/contract.ts

# Expected exports:
# - Asset ✓
# - Rate ✓ (includes effectiveRate and totalFeesUsd)
# - LiquidityDepth ✓ (with 50bps and 100bps thresholds)
# - VolumeWindow ✓
# - ListedAssets ✓
# - ProviderSnapshot ✓
```

## 4️⃣ Verify Resilience (30 seconds)

Check rate limiting and retry logic:

```bash
# View service implementation
grep -A 5 "class RateLimiter" src/service.ts
grep -A 3 "RETRY_DELAYS" src/service.ts

# Expected:
# - Rate limiter with token bucket ✓
# - Exponential backoff [1000, 2000, 4000]ms ✓
# - Configurable via MAX_REQUESTS_PER_SECOND ✓
```

## 5️⃣ Verify ENV Configuration (30 seconds)

```bash
cat .env.example

# Expected settings:
# - BASE_URL (Li.Fi API) ✓
# - DEFILLAMA_BASE_URL (Volume data) ✓
# - TIMEOUT ✓
# - MAX_REQUESTS_PER_SECOND ✓
# - API_KEY (optional) ✓
```

## 6️⃣ Run Development Server (Optional)

```bash
npm run dev

# Plugin served at: http://localhost:3000/remoteEntry.js
# Press Ctrl+C to stop
```

---

## ✅ Verification Checklist

- [ ] All 15 tests pass
- [ ] Contract exports all required types
- [ ] Rate limiter implemented
- [ ] Exponential backoff implemented
- [ ] ENV configuration present
- [ ] README documentation complete
- [ ] Single provider (Li.Fi only)

---

## 📊 What Gets Tested

### Unit Tests (7)
1. Complete snapshot with all metrics
2. Volume data for 24h/7d/30d windows
3. Rates with fees for multiple routes/notionals
4. Liquidity at 50bps and 100bps
5. Asset listing
6. Multiple routes handling
7. Health check endpoint

### Integration Tests (8)
1. Plugin initialization
2. Full snapshot via oRPC client
3. Volume structure validation
4. Rate structure validation
5. Liquidity structure validation
6. Asset structure validation
7. Multiple routes via client
8. Input validation (empty routes/notionals rejected)

---

## 🔍 Code Quality Check

### Type Safety
```bash
npm run type-check

# Expected: No errors
```

### Test Coverage
```bash
npm run coverage

# Expected: >80% coverage on src/service.ts
```

---

## 📝 Key Files to Review

| File | Purpose | Lines of Code |
|------|---------|---------------|
| `src/service.ts` | Core implementation | ~425 |
| `src/contract.ts` | Type definitions | ~84 |
| `src/index.ts` | Plugin entry point | ~66 |
| `src/__tests__/unit/service.test.ts` | Unit tests | ~183 |
| `src/__tests__/integration/plugin.test.ts` | Integration tests | ~238 |
| `src/__tests__/mocks/handlers.ts` | HTTP mocks | ~169 |

**Total Implementation**: ~1,165 lines (excluding node_modules)

---

## 🚨 Common Issues

### Tests Fail with "fetch failed"
**Cause**: MSW mocks not loaded
**Fix**: Check `vitest.config.ts` has `setupFiles: ["./src/__tests__/setup.ts"]`

### Plugin ID Mismatch
**Cause**: ID changed from template
**Fix**: Ensure `src/index.ts` has `id: "@every-plugin/template"`

### Timeout Errors
**Cause**: Network issues or rate limiting
**Fix**: Tests use mocks (no real network calls), shouldn't timeout

---

## 📖 Full Documentation

- **README.md** - Complete setup and usage guide
- **IMPLEMENTATION.md** - Technical deep dive
- **.env.example** - Configuration reference

---

## 🎯 Bounty Requirements Met

| Requirement | Status | Evidence |
|-------------|--------|----------|
| Single Provider | ✅ | Li.Fi only (see README) |
| Volume Metrics | ✅ | `getVolumes()` in service.ts:200 |
| Rate/Fee Metrics | ✅ | `getRates()` in service.ts:227 |
| Liquidity Depth | ✅ | `getLiquidity()` in service.ts:280 |
| Available Assets | ✅ | `getListedAssets()` in service.ts:308 |
| ENV Config | ✅ | .env.example + index.ts:17-26 |
| Rate Limiting | ✅ | RateLimiter class in service.ts:117 |
| Exponential Backoff | ✅ | fetchWithRetry in service.ts:326 |
| Contract Compliance | ✅ | contract.ts matches spec exactly |
| Tests Pass | ✅ | 15/15 tests passing |
| Documentation | ✅ | README + IMPLEMENTATION + this file |

---

**Total Time to Verify**: ~5 minutes ⏱️

**Questions?** See README.md or IMPLEMENTATION.md for detailed explanations.
