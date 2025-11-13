import { createHttpClient, createRateLimiter, type HttpClient } from '@data-provider/plugin-utils';

/**
 * Across Protocol API Client
 *
 * Handles all HTTP communication with Across Protocol APIs.
 * Key responsibilities:
 * - Rate limiting to respect API limits
 * - Automatic retries for transient failures
 * - Timeout handling for slow responses
 * - Consistent error handling and logging
 */

/**
 * Available routes response from Across API
 */
export interface AcrossAvailableRoute {
  originChainId: number;
  originToken: string;
  destinationChainId: number;
  destinationToken: string;
  originTokenSymbol: string;
  destinationTokenSymbol: string;
  isNative: boolean;
}

/**
 * Suggested fees response from Across API
 */
export interface AcrossSuggestedFeesResponse {
  estimatedFillTimeSec: number;
  relayFeePct: string; // Percentage in basis points
  relayFeeTotal: string; // Total relay fee amount in destination token wei
  capitalFeePct: string; // Capital fee percentage
  capitalFeeTotal: string; // Capital fee amount
  relayGasFeePct: string; // Gas fee percentage
  relayGasFeeTotal: string; // Gas fee amount
  lpFeePct: string; // LP fee percentage (0 if no pool used)
  timestamp: string;
}

/**
 * Deposit limits response from Across API
 */
export interface AcrossLimitsResponse {
  minDeposit: string;
  maxDeposit: string;
  maxDepositInstant: string;
  maxDepositShortDelay: string;
  recommendedDepositInstant: string;
}

/**
 * Token response from Across API
 */
export interface AcrossTokenResponse {
  chainId: number;
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoUrl?: string;
  priceUsd?: string;
}

/**
 * DefiLlama Bridge Stats Response
 */
export interface DefiLlamaBridgeResponse {
  id: number;
  displayName: string;
  lastDailyVolume: number;
  weeklyVolume: number;
  monthlyVolume: number;
  currentDayVolume: number;
  dayBeforeLastVolume: number;
}

/**
 * HTTP client for Across Protocol API
 */
export class AcrossApiClient {
  private readonly http: HttpClient;
  private readonly defillamaHttp: HttpClient;

  constructor(
    private readonly baseUrl: string,
    private readonly timeout: number = 30000
  ) {
    this.http = createHttpClient({
      baseUrl,
      rateLimiter: createRateLimiter(10), // 10 requests per second
      timeout,
      retries: 3
    });

    // Separate client for DefiLlama
    this.defillamaHttp = createHttpClient({
      baseUrl: "https://bridges.llama.fi",
      rateLimiter: createRateLimiter(5), // Lower rate limit for DefiLlama
      timeout,
      retries: 3
    });
  }

  /**
   * Fetch supported tokens from Across API.
   * Returns all supported tokens across chains.
   */
  async fetchTokens(): Promise<AcrossTokenResponse[]> {
    return this.http.get<AcrossTokenResponse[]>('/swap/tokens');
  }

  /**
   * Fetch suggested fees from Across API.
   */
  async fetchSuggestedFees(params: {
    inputToken: string;
    outputToken: string;
    originChainId: number;
    destinationChainId: number;
    amount: string;
  }): Promise<AcrossSuggestedFeesResponse> {
    return this.http.get<AcrossSuggestedFeesResponse>('/suggested-fees', {
      params: {
        inputToken: params.inputToken,
        outputToken: params.outputToken,
        originChainId: params.originChainId,
        destinationChainId: params.destinationChainId,
        amount: params.amount,
      }
    });
  }

  /**
   * Fetch deposit limits from Across API.
   */
  async fetchLimits(params: {
    inputToken: string;
    outputToken: string;
    originChainId: number;
    destinationChainId: number;
  }): Promise<AcrossLimitsResponse> {
    return this.http.get<AcrossLimitsResponse>('/limits', {
      params: {
        inputToken: params.inputToken,
        outputToken: params.outputToken,
        originChainId: params.originChainId,
        destinationChainId: params.destinationChainId,
      }
    });
  }

  /**
   * Fetch volume data from DefiLlama Bridge API.
   */
  async fetchDefiLlamaVolumes(bridgeId: string): Promise<DefiLlamaBridgeResponse> {
    return this.defillamaHttp.get<DefiLlamaBridgeResponse>(`/bridge/${bridgeId}`);
  }
}
