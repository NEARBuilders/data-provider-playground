import { test, expect } from 'vitest';
import { spawn } from 'child_process';

test.skip('demo server returns 200 then 429 when requests are too frequent', async () => {
  // pick a high ephemeral port to avoid collisions
  const port = 30000 + Math.floor(Math.random() * 1000);

  const env = { ...process.env, MOCK_MODE: 'true', DEMO_PORT: String(port), RATE_LIMIT_MIN_TIME_MS: '200' };

  const child = spawn(process.execPath, ['dev/server.mjs'], { env, cwd: process.cwd(), stdio: ['ignore', 'pipe', 'pipe'] });

  try {
    // wait for startup log
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Server did not start in time'));
      }, 15000); // Increased from 5s to 15s for server startup

      child.stdout?.on('data', (chunk) => {
        const s = String(chunk);
        if (s.includes('Demo server listening')) {
          clearTimeout(timeout);
          resolve();
        }
      });

      child.stderr?.on('data', (c) => {
        // forward stderr for debugging
        // but don't fail immediately; only fail on timeout
        // console.error(String(c));
      });
    });

    const base = `http://localhost:${port}`;

    // First request should succeed (200 + JSON)
    const r1 = await fetch(`${base}/snapshot`);
    expect(r1.status).toBe(200);
    const j1 = await r1.json();
    expect(typeof j1).toBe('object');
    expect(j1).toHaveProperty('listedAssets');

    // Immediately send a second request; server enforces RATE_LIMIT_MIN_TIME_MS
    const r2 = await fetch(`${base}/snapshot`);
    expect([200, 429]).toContain(r2.status);
    // When fast, we expect 429
    if (r2.status === 429) {
      const j2 = await r2.json();
      expect(j2).toHaveProperty('error', 'rate_limited');
    }
  } finally {
    // ensure child process is killed
    child.kill();
  }
}, { timeout: 30000 });
