import axios, { AxiosInstance } from 'axios';
import axiosRetry from 'axios-retry';

export class AcrossAPIClient {
  private client: AxiosInstance;
  
  constructor(
    private baseURL: string,
    private apiKey?: string,
    private timeout: number = 30000
  ) {
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {}
    });
    
    // Add retry logic with exponential backoff
    axiosRetry(this.client, {
      retries: 3,
      retryDelay: axiosRetry.exponentialDelay,
      retryCondition: (error) => {
        return axiosRetry.isNetworkOrIdempotentRequestError(error) ||
               error.response?.status === 429;
      }
    });
  }
  
  async getAvailableRoutes() {
    const response = await this.client.get('/available-routes');
    return response.data;
  }
  
  async getSuggestedFees(params: {
    originChainId: number;
    destinationChainId: number;
    token: string;
    amount: string;
  }) {
    const response = await this.client.get('/suggested-fees', { params });
    return response.data;
  }
}