#!/usr/bin/env node
import http from 'node:http';
import { buildSnapshot } from './libDemo.mjs';

const PORT = Number(process.env.DEMO_PORT || 3001);
const MIN_INTERVAL_MS = Number(process.env.RATE_LIMIT_MIN_TIME_MS || 200);

let lastRequestAt = 0;

const server = http.createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/snapshot') {
    const now = Date.now();
    if (now - lastRequestAt < MIN_INTERVAL_MS) {
      res.writeHead(429, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'rate_limited', retry_after_ms: MIN_INTERVAL_MS - (now - lastRequestAt) }));
      return;
    }

    lastRequestAt = now;

    try {
      const opts = {
        mock: process.env.MOCK_MODE === 'true',
        notional: process.env.NOTIONAL || '1000000',
        base: process.env.LIFI_BASE_URL,
        timeout: Number(process.env.LIFI_TIMEOUT || 10000)
      };
      const snapshot = await buildSnapshot(opts);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(snapshot));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: String(err) }));
    }

    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'not_found' }));
});

server.listen(PORT, () => {
  console.log(`Demo server listening at http://localhost:${PORT}`);
  console.log('GET /snapshot to get a live snapshot (respect RATE_LIMIT_MIN_TIME_MS)');
});
