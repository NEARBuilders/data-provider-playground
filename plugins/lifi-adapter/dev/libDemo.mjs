import Decimal from 'decimal.js';

export const DEFAULT_BASE = process.env.LIFI_BASE_URL || 'https://li.quest/v1';
export const DEFAULT_TIMEOUT = Number(process.env.LIFI_TIMEOUT || 10000);

function timeoutPromise(ms) {
  return new Promise((_, rej) => setTimeout(() => rej(new Error('Request timeout')), ms));
}

async function fetchJson(url, timeout) {
  if (typeof url !== 'string' || !url.startsWith('https://li.quest/')) {
    throw new Error('Invalid URL - only Li.Fi API allowed');
  }
  
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  
  const headers = {
    'Content-Type': 'application/json'
  };
  
  try {
    const res = await Promise.race([
      fetch(url, { 
        signal: controller.signal,
        headers
      }), 
      timeoutPromise(timeout)
    ]);
    clearTimeout(timer);
    
    // Handle rate limit errors with reduced retry
    if (res.status === 429) {
      const retryAfter = res.headers.get('Retry-After') || '6'; 
      const waitTime = Math.min(parseInt(retryAfter) * 1000, 6000); // Max 6s wait (reduced from 30s)
      console.log(`Rate limited, waiting ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      
      // Single retry after rate limit - no further retries
      const retryRes = await fetch(url, { headers });
      if (!retryRes.ok) throw new Error(`Retry failed: ${retryRes.status} ${retryRes.statusText}`);
      return await retryRes.json();
    }
    
    if (!res.ok) throw new Error(`Request failed: ${res.status} ${res.statusText}`);
    return await res.json();
  } catch (err) {
    clearTimeout(timer);
    throw new Error(`Fetch operation failed: ${err.message}`);
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

async function getVolumes(base, timeout, mock) {
  if (mock) {
    // Mock volume data: 10 transfers per day at $100k each
    const now = Math.floor(Date.now() / 1000);
    const volumes = [];
    const windows = [
      { name: '24h', duration: 24 * 60 * 60, transfersPerDay: 10 },
      { name: '7d', duration: 7 * 24 * 60 * 60, transfersPerDay: 10 },
      { name: '30d', duration: 30 * 24 * 60 * 60, transfersPerDay: 10 }
    ];

    for (const window of windows) {
      const daysInWindow = window.duration / (24 * 60 * 60);
      const numTransfers = daysInWindow * window.transfersPerDay;
      const volumeUsd = numTransfers * 100000; // $100k per transfer
      
      volumes.push({
        window: window.name,
        volumeUsd: volumeUsd,
        measuredAt: new Date().toISOString()
      });
    }
    return volumes;
  }

  // Live mode: query real analytics endpoint
  try {
    const now = Math.floor(Date.now() / 1000);
    const volumes = [];
    
    for (const windowName of ['24h', '7d', '30d']) {
      const duration = windowName === '24h' ? 24 * 60 * 60 : 
                      windowName === '7d' ? 7 * 24 * 60 * 60 : 
                      30 * 24 * 60 * 60;
      
      const fromTimestamp = now - duration;
      
      try {
        console.log(`[${windowName}] Fetching with chunked strategy...`);
        
        let totalVolume = 0;
        let totalTransfers = 0;
        
        // chunk configuration 
        const chunkConfig = {
          '24h': { limit: 1000, maxChunks: 10 },   // Reduced from 12 to 8
          '7d': { limit: 1000, maxChunks: 10 },   // Reduced from 10 to 6
          '30d': { limit: 1000, maxChunks: 10 }   // Reduced from 10 to 4
        };
        
        const config = chunkConfig[windowName] || chunkConfig['30d'];
        
        //Time-based chunking for better coverage
        const chunkDuration = Math.floor(duration / config.maxChunks);
        
        for (let chunk = 0; chunk < config.maxChunks; chunk++) {
          const chunkStart = fromTimestamp + (chunk * chunkDuration);
          const chunkEnd = chunk === config.maxChunks - 1 ? now : chunkStart + chunkDuration;
          
          try {
            let response;
            let endpoint;
            
            // Try v2 first, fallback to v1
            try {
              const v2Base = base.replace('/v1', '/v2');
              const v2Url = new URL(`${v2Base}/analytics/transfers`);
              v2Url.searchParams.set('status', 'DONE');
              v2Url.searchParams.set('fromTimestamp', String(chunkStart));
              v2Url.searchParams.set('toTimestamp', String(chunkEnd));
              v2Url.searchParams.set('limit', String(config.limit));
              
              response = await fetchJson(v2Url.toString(), timeout);
              endpoint = 'v2';
            } catch (v2Error) {
              const v1Url = new URL(`${base}/analytics/transfers`);
              v1Url.searchParams.set('status', 'DONE');
              v1Url.searchParams.set('fromTimestamp', String(chunkStart));
              v1Url.searchParams.set('toTimestamp', String(chunkEnd));
              v1Url.searchParams.set('limit', String(config.limit));
              
              response = await fetchJson(v1Url.toString(), timeout);
              endpoint = 'v1';
            }
            
            // Process chunk response
            const transfersList = response?.data || response?.transfers || [];
            if (Array.isArray(transfersList)) {
              const chunkVolume = transfersList.reduce((sum, t) => {
                const amount = parseFloat(t.receiving?.amountUSD || '0');
                return sum + (isNaN(amount) ? 0 : amount);
              }, 0);
              
              totalVolume += chunkVolume;
              totalTransfers += transfersList.length;
              
              console.log(`  [${windowName}] Chunk ${chunk + 1}/${config.maxChunks} (${endpoint}): ${transfersList.length} transfers, $${chunkVolume.toFixed(2)}`);
            }
            
            // Rate limiting between chunks - minimal delay
            if (chunk < config.maxChunks - 1) {
              await new Promise(resolve => setTimeout(resolve, 200)); // Reduced from 300ms to 200ms
            }
            
          } catch (chunkError) {
            console.warn(`  [${windowName}] Chunk ${chunk + 1} failed:`, chunkError.message);
          
          }
        }
        
        console.log(`✓ [${windowName}] Total: ${totalTransfers} transfers, $${totalVolume.toFixed(2)}`);
        
        // Extrapolation if we hit limits consistently
        let estimatedVolume = totalVolume;
        const avgTransfersPerChunk = totalTransfers / config.maxChunks;
        
        if (avgTransfersPerChunk >= config.limit * 0.9) {
          const extrapolationFactor = windowName === '24h' ? 1.2 : windowName === '7d' ? 1.5 : 2.0;
          estimatedVolume = totalVolume * extrapolationFactor;
          console.log(`  [${windowName}] Extrapolated volume: $${estimatedVolume.toFixed(2)} (factor: ${extrapolationFactor})`);
        }
        
        volumes.push({
          window: windowName,
          volumeUsd: estimatedVolume,
          measuredAt: new Date().toISOString()
        });
      } catch (err) {
        console.warn(`Failed to fetch volume for ${windowName}:`, err.message);
        volumes.push({
          window: windowName,
          volumeUsd: 0,
          measuredAt: new Date().toISOString()
        });
      }
    }
    return volumes;
  } catch (err) {
    console.warn('Failed to fetch volumes:', err.message);
    return [];
  }
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
    quote = { estimate: { fromAmount: notional, toAmount: notional, feeCosts: [{ amount: '0', amountUSD: '0' }] } };
  }

  // Fetch volumes
  let volumes;
  try {
    volumes = await getVolumes(base, timeout, mock);
  } catch (err) {
    console.warn('Failed to fetch volumes:', err.message);
    volumes = [];
  }

  const effectiveRate = calculateEffectiveRate(quote.estimate.fromAmount, quote.estimate.toAmount, srcToken.decimals, dstToken.decimals);

  const snapshot = {
    volumes,
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
