import { createHttpClient, createRateLimiter, type HttpClient } from '@data-provider/plugin-utils';

/**
 * HTTP Client Layer for Data Provider APIs
 *
 * This layer handles all external HTTP communication with data provider APIs.
 * Key responsibilities:
 * - Rate limiting to respect provider API limits
 * - Automatic retries for transient failures
 * - Timeout handling for slow responses
 * - Consistent error handling and logging
 *
 * The client works with provider-specific request/response formats.
 * Transformation to/from NEAR Intents format happens in the router layer.
 */

/**
 * API response types for the provider's endpoints.
 * These should be customized based on the actual provider's API responses.
 * The service layer (service.ts) maps these to standardized internal types.
 */
export interface VolumeResponse {
  volumes: Array<{
    window: string;
    volumeUsd: number;
    measuredAt: string;
  }>;
}

export interface AssetsResponse {
  assets: Array<{
    symbol: string;
    decimals: number;
    address?: string;
    chainId: string;
  }>;
  measuredAt: string;
}

export interface QuoteRequest {
  routes: Array<{
    source: {
      chainId: string;
      address?: string;
      symbol: string;
      decimals: number;
    };
    destination: {
      chainId: string;
      address?: string;
      symbol: string;
      decimals: number;
    };
  }>;
  amounts: string[];
}

export interface QuoteResponse {
  quotes: Array<{
    route: {
      source: {
        chainId: string;
        address?: string;
        symbol: string;
        decimals: number;
      };
      destination: {
        chainId: string;
        address?: string;
        symbol: string;
        decimals: number;
      };
    };
    amount: string;
    price: string;
    timestamp: string;
  }>;
}

export interface LiquidityRequest {
  routes: Array<{
    source: {
      chainId: string;
      address?: string;
      symbol: string;
      decimals: number;
    };
    destination: {
      chainId: string;
      address?: string;
      symbol: string;
      decimals: number;
    };
  }>;
}

export interface LiquidityResponse {
  liquidity: Array<{
    route: {
      source: {
        chainId: string;
        address?: string;
        symbol: string;
        decimals: number;
      };
      destination: {
        chainId: string;
        address?: string;
        symbol: string;
        decimals: number;
      };
    };
    depth50bps: string;
    depth100bps: string;
    timestamp: string;
  }>;
}

/**
 * HTTP client for the data provider's API.
 * Handles all HTTP communication with retry logic, rate limiting, and error handling.
 */
export class ProviderApiClient {
  private readonly http: HttpClient;

  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string,
    private readonly timeout: number = 30000
  ) {
    this.http = createHttpClient({
      baseUrl,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      rateLimiter: createRateLimiter(10), // 10 requests per second
      timeout,
      retries: 3
    });
  }

  /**
   * Fetch volume data for specified time windows.
   */
  async fetchVolumes(windows: string[]): Promise<VolumeResponse> {
    return this.http.get<VolumeResponse>('/volumes', {
      params: { windows: windows.join(',') }
    });
  }

  /**
   * Fetch list of supported assets.
   */
  async fetchAssets(): Promise<AssetsResponse> {
    return this.http.get<AssetsResponse>('/assets');
  }

  /**
   * Fetch rate quotes for route/notional combinations.
   */
  async fetchQuotes(request: QuoteRequest): Promise<QuoteResponse> {
    return this.http.post<QuoteResponse>('/quotes', request);
  }

  /**
   * Fetch liquidity depth data for routes.
   */
  async fetchLiquidity(request: LiquidityRequest): Promise<LiquidityResponse> {
    return this.http.post<LiquidityResponse>('/liquidity', request);
  }

  /**
   * Health check endpoint.
   */
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.http.get<{ status: string; timestamp: string }>('/health');
  }
}
