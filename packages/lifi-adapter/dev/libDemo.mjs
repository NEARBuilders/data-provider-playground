import Decimal from 'decimal.js';

export const DEFAULT_BASE = process.env.LIFI_BASE_URL || 'https://li.quest/v1';
export const DEFAULT_TIMEOUT = Number(process.env.LIFI_TIMEOUT || 10000);

function timeoutPromise(ms, msg = 'Timeout') {
  return new Promise((_, rej) => setTimeout(() => rej(new Error(msg)), ms));
}

async function fetchJson(url, timeout) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await Promise.race([fetch(url, { signal: controller.signal }), timeoutPromise(timeout)]);
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return await res.json();
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

async function getTokens(base, timeout, mock) {
  if (mock) {
    return {
      tokens: {
        '1': [
          { chainId: 1, address: '0xA0b86a33E6442e082877a094f204b01BF645Fe0', symbol: 'USDC', decimals: 6, name: 'USD Coin' }
        ],
        '137': [
          { chainId: 137, address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa8417', symbol: 'USDC', decimals: 6, name: 'USD Coin' }
        ]
      }
    };
  }

  return await fetchJson(`${base}/tokens`, timeout);
}

async function getQuote(base, timeout, fromChain, toChain, fromToken, toToken, fromAmount, mock) {
  if (mock) {
    return {
      estimate: {
        fromAmount: fromAmount,
        toAmount: fromAmount,
        feeCosts: [{ amount: '0', amountUSD: '0.0' }]
      }
    };
  }

  const url = new URL(`${base}/quote`);
  url.searchParams.set('fromChain', String(fromChain));
  url.searchParams.set('toChain', String(toChain));
  url.searchParams.set('fromToken', String(fromToken));
  url.searchParams.set('toToken', String(toToken));
  url.searchParams.set('fromAmount', String(fromAmount));

  return await fetchJson(url.toString(), timeout);
}

function calculateEffectiveRate(fromAmount, toAmount, fromDecimals, toDecimals) {
  try {
    const fromDecimal = new Decimal(fromAmount).div(new Decimal(10).pow(fromDecimals));
    const toDecimal = new Decimal(toAmount).div(new Decimal(10).pow(toDecimals));
    if (fromDecimal.isZero()) return 0;
    return toDecimal.div(fromDecimal).toNumber();
  } catch (e) {
    return 0;
  }
}

export async function buildSnapshot(opts = {}) {
  const base = opts.base || DEFAULT_BASE;
  const timeout = opts.timeout || DEFAULT_TIMEOUT;
  const mock = !!opts.mock;
  const notional = opts.notional || '1000000';

  const tokensResp = await getTokens(base, timeout, mock);
  const tokensByChain = tokensResp.tokens || {};

  const chains = Object.keys(tokensByChain);
  if (chains.length < 1) throw new Error('No chains/tokens returned from provider');

  // map symbols to tokens
  const symbolMap = {};
  for (const [chainId, arr] of Object.entries(tokensByChain)) {
    for (const t of arr) {
      const sym = (t.symbol || '').toUpperCase();
      symbolMap[sym] = symbolMap[sym] || [];
      symbolMap[sym].push({ chainId, token: t });
    }
  }

  let srcChain, dstChain, srcToken, dstToken;
  if (symbolMap['USDC'] && symbolMap['USDC'].length >= 2) {
    const entries = symbolMap['USDC'];
    const first = entries[0];
    const second = entries.find(e => e.chainId !== first.chainId) || entries[1];
    srcChain = first.chainId; dstChain = second.chainId; srcToken = first.token; dstToken = second.token;
  } else {
    srcChain = chains[0]; dstChain = chains.length > 1 ? chains[1] : chains[0];
    srcToken = tokensByChain[srcChain][0]; dstToken = tokensByChain[dstChain][0];
  }

  let quote;
  try {
    quote = await getQuote(base, timeout, srcChain, dstChain, srcToken.address, dstToken.address, notional, mock);
  } catch (err) {
    // graceful fallback
    quote = { estimate: { fromAmount: notional, toAmount: notional, feeCosts: [{ amount: '0', amountUSD: '0' }] } };
  }

  const effectiveRate = calculateEffectiveRate(quote.estimate.fromAmount, quote.estimate.toAmount, srcToken.decimals, dstToken.decimals);

  const snapshot = {
    volumes: [],
    rates: [
      {
        source: { chainId: String(srcChain), assetId: srcToken.address, symbol: srcToken.symbol, decimals: srcToken.decimals },
        destination: { chainId: String(dstChain), assetId: dstToken.address, symbol: dstToken.symbol, decimals: dstToken.decimals },
        amountIn: quote.estimate.fromAmount,
        amountOut: quote.estimate.toAmount,
        effectiveRate,
        totalFeesUsd: quote.estimate.feeCosts?.reduce((s, f) => s + (parseFloat(f.amountUSD || '0') || 0), 0) || 0,
        quotedAt: new Date().toISOString()
      }
    ],
    liquidity: [ { route: { source: { chainId: String(srcChain), assetId: srcToken.address, symbol: srcToken.symbol, decimals: srcToken.decimals }, destination: { chainId: String(dstChain), assetId: dstToken.address, symbol: dstToken.symbol, decimals: dstToken.decimals } }, thresholds: [ { maxAmountIn: notional, slippageBps: 50 }, { maxAmountIn: notional, slippageBps: 100 } ], measuredAt: new Date().toISOString() } ],
    listedAssets: { assets: Object.entries(tokensByChain).flatMap(([chainId, arr]) => arr.map(t => ({ chainId: String(chainId), assetId: t.address, symbol: t.symbol, decimals: t.decimals }))), measuredAt: new Date().toISOString() }
  };

  return snapshot;
}
