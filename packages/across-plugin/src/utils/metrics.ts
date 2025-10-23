/**
 * Metrics collection for monitoring and observability
 */

export interface RequestMetrics {
  endpoint: string;
  method: string;
  statusCode?: number;
  durationMs: number;
  success: boolean;
  cached: boolean;
  retryCount: number;
  timestamp: string;
}

export class MetricsCollector {
  private requests: RequestMetrics[] = [];
  private readonly maxHistory: number;

  constructor(maxHistory: number = 1000) {
    this.maxHistory = maxHistory;
  }

  /**
   * Record a request
   */
  recordRequest(metrics: RequestMetrics): void {
    this.requests.push(metrics);

    // Keep only recent history
    if (this.requests.length > this.maxHistory) {
      this.requests.shift();
    }
  }

  /**
   * Get summary statistics
   */
  getSummary() {
    if (this.requests.length === 0) {
      return {
        totalRequests: 0,
        successRate: 0,
        cacheHitRate: 0,
        avgDurationMs: 0,
        p50DurationMs: 0,
        p95DurationMs: 0,
        p99DurationMs: 0,
        errorRate: 0,
        endpointStats: {},
      };
    }

    const successful = this.requests.filter(r => r.success).length;
    const cached = this.requests.filter(r => r.cached).length;
    const durations = this.requests.map(r => r.durationMs).sort((a, b) => a - b);

    // Calculate percentiles
    const p50 = durations[Math.floor(durations.length * 0.5)];
    const p95 = durations[Math.floor(durations.length * 0.95)];
    const p99 = durations[Math.floor(durations.length * 0.99)];

    // Per-endpoint stats
    const endpointStats: Record<string, { count: number; successRate: number; avgDurationMs: number }> = {};
    const endpointGroups = this.groupBy(this.requests, 'endpoint');

    for (const [endpoint, reqs] of Object.entries(endpointGroups)) {
      const endpointSuccessful = reqs.filter(r => r.success).length;
      const avgDuration = reqs.reduce((sum, r) => sum + r.durationMs, 0) / reqs.length;

      endpointStats[endpoint] = {
        count: reqs.length,
        successRate: endpointSuccessful / reqs.length,
        avgDurationMs: Math.round(avgDuration),
      };
    }

    return {
      totalRequests: this.requests.length,
      successRate: successful / this.requests.length,
      cacheHitRate: cached / this.requests.length,
      avgDurationMs: Math.round(durations.reduce((a, b) => a + b, 0) / durations.length),
      p50DurationMs: Math.round(p50),
      p95DurationMs: Math.round(p95),
      p99DurationMs: Math.round(p99),
      errorRate: 1 - (successful / this.requests.length),
      endpointStats,
    };
  }

  /**
   * Get recent errors
   */
  getRecentErrors(limit: number = 10): RequestMetrics[] {
    return this.requests
      .filter(r => !r.success)
      .slice(-limit);
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.requests = [];
  }

  /**
   * Group array by key
   */
  private groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
    return array.reduce((groups, item) => {
      const groupKey = String(item[key]);
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
      return groups;
    }, {} as Record<string, T[]>);
  }
}

