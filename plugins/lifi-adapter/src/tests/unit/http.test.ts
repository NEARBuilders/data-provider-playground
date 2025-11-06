import { describe, it, expect } from 'vitest';
import { HttpUtils } from '../../utils/http';

describe('HttpUtils', () => {
  it('applies limiter configuration and exposes it', () => {
    // Apply a custom configuration
    HttpUtils.configure({ maxConcurrent: 2, minTime: 50 });

    const cfg = HttpUtils.getLimiterConfig();
    expect(cfg).toBeTruthy();
    expect(cfg?.maxConcurrent).toBe(2);
    expect(cfg?.minTime).toBe(50);
  });
});
