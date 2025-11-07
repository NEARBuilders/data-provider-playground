/**
 * Standalone HTTP Server for Li.Fi Plugin
 * This wraps the plugin service and exposes REST API endpoints
 */

import { createServer } from 'http';
import { DataProviderService } from './src/service.js';
import { Effect } from 'every-plugin/effect';

const PORT = 3015;

// Initialize the service
let service: DataProviderService | null = null;

async function initializeService() {
  console.log('[Standalone Server] Initializing Li.Fi service...');

  const baseUrl = process.env.BASE_URL || 'https://li.quest/v1';
  const apiKey = process.env.API_KEY || 'not-required';
  const timeout = parseInt(process.env.TIMEOUT || '15000');
  const maxRequestsPerSecond = parseInt(process.env.MAX_REQUESTS_PER_SECOND || '10');

  try {
    service = new DataProviderService(baseUrl, apiKey, timeout, maxRequestsPerSecond);

    // Test ping
    await Effect.runPromise(service.ping());

    console.log('[Standalone Server] Service initialized successfully');
    return true;
  } catch (error) {
    console.error('[Standalone Server] Failed to initialize service:', error);
    return false;
  }
}

// Create HTTP server
const server = createServer(async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const url = new URL(req.url || '/', `http://localhost:${PORT}`);

  try {
    // GET /ping
    if (req.method === 'GET' && url.pathname === '/ping') {
      const result = await Effect.runPromise(service!.ping());
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
      return;
    }

    // POST /snapshot
    if (req.method === 'POST' && url.pathname === '/snapshot') {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });

      req.on('end', async () => {
        try {
          const input = JSON.parse(body);
          console.log('[Standalone Server] Received snapshot request:', {
            routes: input.routes?.length,
            notionals: input.notionals?.length,
          });

          const result = await Effect.runPromise(service!.getSnapshot(input));

          console.log('[Standalone Server] Snapshot generated successfully');
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
        } catch (error: any) {
          console.error('[Standalone Server] Error processing snapshot:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            error: error.message || 'Internal server error',
          }));
        }
      });
      return;
    }

    // 404
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  } catch (error: any) {
    console.error('[Standalone Server] Request error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: error.message }));
  }
});

// Start server
initializeService().then((success) => {
  if (success) {
    server.listen(PORT, () => {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`🚀 Li.Fi Plugin HTTP Server`);
      console.log(`${'='.repeat(60)}`);
      console.log(`✅ Server running at: http://localhost:${PORT}`);
      console.log(`✅ Endpoints:`);
      console.log(`   GET  /ping      - Health check`);
      console.log(`   POST /snapshot  - Get bridge data snapshot`);
      console.log(`${'='.repeat(60)}\n`);
    });
  } else {
    console.error('Failed to start server - service initialization failed');
    process.exit(1);
  }
});

// Handle shutdown
process.on('SIGTERM', () => {
  console.log('\n[Standalone Server] Shutting down...');
  server.close(() => {
    console.log('[Standalone Server] Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n[Standalone Server] Shutting down...');
  server.close(() => {
    console.log('[Standalone Server] Server closed');
    process.exit(0);
  });
});
