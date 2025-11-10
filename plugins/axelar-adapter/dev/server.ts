#!/usr/bin/env tsx
/**
 * HTTP Demo Server for Axelar adapter
 * Serves GET /snapshot endpoint for testing metrics collection
 * Usage: bun run dev/server.ts
 */

import http from "node:http";
import { DataProviderService } from "../src/service";
import { Effect } from "every-plugin/effect";

const PORT = Number(process.env.DEMO_PORT || 3001);
const MIN_INTERVAL_MS = Number(process.env.RATE_LIMIT_MIN_TIME_MS || 200);
const BASE_URL = process.env.AXELAR_BASE_URL || "https://axelarscan.io";
const TIMEOUT = Number(process.env.AXELAR_TIMEOUT || 10000);
const NOTIONAL = process.env.NOTIONAL || "1000000";

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
    chainId: "42161", // Arbitrum
    assetId: "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8",
    symbol: "USDC",
    decimals: 6,
  },
};

let service: DataProviderService;
try {
  service = new DataProviderService(BASE_URL, "demo-key", TIMEOUT);
} catch (err) {
  console.error("❌ Failed to initialize DataProviderService:", err);
  process.exit(1);
}

const server = http.createServer(async (req, res) => {
  try {
    // Handle snapshot endpoint
    if (req.method === "GET" && req.url === "/snapshot") {
      const now = Date.now();
      if (now - lastRequestAt < MIN_INTERVAL_MS) {
        res.writeHead(429, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            error: "rate_limited",
            retry_after_ms:
              MIN_INTERVAL_MS - (now - lastRequestAt),
          })
        );
        return;
      }

      lastRequestAt = now;

      try {
        const snapshot = await Effect.runPromise(
          service.getSnapshot({
            routes: [mockRoute],
            notionals: [NOTIONAL],
            includeWindows: ["24h", "7d", "30d"],
          })
        );

        res.writeHead(200, {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        });
        res.end(JSON.stringify(snapshot, null, 2));
        return;
      } catch (err) {
        console.error("Snapshot error:", err);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            error: "snapshot_failed",
            message: err instanceof Error ? err.message : String(err),
          })
        );
        return;
      }
    }

    // Health check
    if (req.method === "GET" && req.url === "/health") {
      const health = await Effect.runPromise(service.ping());
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(health));
      return;
    }

    // Root endpoint with instructions
    if (req.method === "GET" && req.url === "/") {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(`
<!DOCTYPE html>
<html>
<head>
  <title>Axelar Adapter Demo Server</title>
  <style>
    body { font-family: monospace; margin: 2rem; }
    .endpoint { background: #f0f0f0; padding: 1rem; margin: 1rem 0; border-radius: 4px; }
    .method { color: #0066cc; font-weight: bold; }
  </style>
</head>
<body>
  <h1>🚀 Axelar Data Provider Adapter - Demo Server</h1>
  <p>Running on <code>http://localhost:${PORT}</code></p>
  
  <h2>Endpoints</h2>
  
  <div class="endpoint">
    <p><span class="method">GET</span> <code>/snapshot</code></p>
    <p>Collect complete metrics snapshot (Volume, Rates, Liquidity, Assets)</p>
    <p>Example: <code>curl http://localhost:${PORT}/snapshot</code></p>
  </div>
  
  <div class="endpoint">
    <p><span class="method">GET</span> <code>/health</code></p>
    <p>Health check endpoint</p>
    <p>Example: <code>curl http://localhost:${PORT}/health</code></p>
  </div>
  
  <h2>Environment Variables</h2>
  <ul>
    <li><code>AXELAR_BASE_URL</code>: ${BASE_URL}</li>
    <li><code>AXELAR_TIMEOUT</code>: ${TIMEOUT}ms</li>
    <li><code>NOTIONAL</code>: ${NOTIONAL}</li>
    <li><code>RATE_LIMIT_MIN_TIME_MS</code>: ${MIN_INTERVAL_MS}ms</li>
    <li><code>DEMO_PORT</code>: ${PORT}</li>
  </ul>
  
  <h2>Try it</h2>
  <p>Get snapshot: <a href="/snapshot">/snapshot</a></p>
  <p>Health check: <a href="/health">/health</a></p>
</body>
</html>
      `);
      return;
    }

    // 404
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "not_found", path: req.url }));
  } catch (err) {
    console.error("Server error:", err);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        error: "server_error",
        message: err instanceof Error ? err.message : String(err),
      })
    );
  }
});

server.listen(PORT, () => {
  console.log(`✅ Demo server running on http://localhost:${PORT}`);
  console.log(`   GET /snapshot - Collect metrics`);
  console.log(`   GET /health   - Health check`);
  console.log(`   GET /         - This page`);
  console.log(`\nPress Ctrl+C to stop`);
});

server.on("error", (err) => {
  console.error("Server error:", err);
  process.exit(1);
});
