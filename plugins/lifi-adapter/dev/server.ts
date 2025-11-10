#!/usr/bin/env tsx
import http from 'node:http';
import { DataProviderService } from '../src/service';
import { Effect } from 'every-plugin/effect';

const PORT = Number(process.env.DEMO_PORT || 3001);
const MIN_INTERVAL_MS = Number(process.env.RATE_LIMIT_MIN_TIME_MS || 200);
const BASE_URL = process.env.LIFI_BASE_URL || 'https://li.quest/v1';
const TIMEOUT = Number(process.env.LIFI_TIMEOUT || 10000);
const NOTIONAL = process.env.NOTIONAL || '1000000';

let lastRequestAt = 0;

// Mock route for demo
const mockRoute = {
  source: {
    chainId: "1",
    assetId: "0xA0b86a33E6442e082877a094f204b01BF645Fe0",
    symbol: "USDC",
    decimals: 6,
  },
  destination: {
    chainId: "137",
    assetId: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa8417", 
    symbol: "USDC",
    decimals: 6,
  }
};

let service: DataProviderService;
try {
  service = new DataProviderService(BASE_URL);
} catch (err) {
  console.error('Failed to initialize DataProviderService:', err);
  process.exit(1);
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'GET' && req.url === '/snapshot') {
      const now = Date.now();
      if (now - lastRequestAt < MIN_INTERVAL_MS) {
        res.writeHead(429, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          error: 'rate_limited', 
          retry_after_ms: MIN_INTERVAL_MS - (now - lastRequestAt) 
        }));
        return;
      }

      lastRequestAt = now;

      try {
        const snapshot = service.getSnapshot({
          routes: [mockRoute],
          notionals: [NOTIONAL],
          includeWindows: ['24h']
        });

        const result = await Effect.runPromise(snapshot);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result, null, 2));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: String(err) }));
      }

      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'not_found' }));
  } catch (err) {
    console.error('Request handler error:', { error: err instanceof Error ? err.message : 'Unknown error' });
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'internal_server_error' }));
    }
  }
});

server.listen(PORT, () => {
  console.log(`TypeScript demo server listening at http://localhost:${PORT}`);
  console.log('GET /snapshot to get a live snapshot (respect RATE_LIMIT_MIN_TIME_MS)');
}).on('error', (err) => {
  console.error('Server failed to start:', { error: err instanceof Error ? err.message : 'Unknown error' });
  process.exit(1);
});