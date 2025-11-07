import Bottleneck from 'bottleneck';

export class RateLimiter {
  private limiter: Bottleneck;
  
  constructor(requestsPerSecond: number) {
    this.limiter = new Bottleneck({
      maxConcurrent: 5,
      minTime: 1000 / requestsPerSecond,
    });
  }
  
  async schedule<T>(fn: () => Promise<T>): Promise<T> {
    return this.limiter.schedule(fn);
  }
}