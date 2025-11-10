interface SubgraphMessageSent {
  id: string;
  amount: string;
  blockTimestamp: string;
  sourceDomain: string;
  recipient: string;
  nonce: string;
  sender: string;
  transactionHash: string;
}

interface SubgraphResponse<T> {
  data: T;
  errors?: Array<{ message: string }>;
}

interface MessageSentsQueryResponse {
  messageSents: SubgraphMessageSent[];
}

interface SubgraphConfig {
  apiKey: string;
  baseUrl: string;
  requestsPerSecond: number;
  timeout: number;
}

export class SubgraphClient {
  private lastRequestTime: number = 0;
  private readonly rateLimitDelay: number;

  constructor(private readonly config: SubgraphConfig) {
    this.rateLimitDelay = 1000 / config.requestsPerSecond;
  }

  private async rateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.rateLimitDelay) {
      await this.sleep(this.rateLimitDelay - timeSinceLastRequest);
    }

    this.lastRequestTime = Date.now();
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async query<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
    await this.rateLimit();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (this.config.apiKey) {
        headers["Authorization"] = `Bearer ${this.config.apiKey}`;
      }

      const response = await fetch(this.config.baseUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({ query, variables }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get("Retry-After") || "60", 10);
        await this.sleep(retryAfter * 1000);
        return this.query<T>(query, variables);
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result: SubgraphResponse<T> = await response.json();

      if (result.errors && result.errors.length > 0) {
        throw new Error(`GraphQL errors: ${result.errors.map(e => e.message).join(", ")}`);
      }

      return result.data;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(`Request timeout after ${this.config.timeout}ms`);
      }
      throw error;
    }
  }

  async getMessageSents(
    chainSubgraphUrl: string,
    startTimestamp: number,
    endTimestamp: number,
    first: number = 1000
  ): Promise<SubgraphMessageSent[]> {
    const query = `
      query GetMessageSents($startTimestamp: BigInt!, $endTimestamp: BigInt!, $first: Int!) {
        messageSents(
          where: { blockTimestamp_gte: $startTimestamp, blockTimestamp_lte: $endTimestamp }
          orderBy: blockTimestamp
          orderDirection: desc
          first: $first
        ) {
          id
          amount
          blockTimestamp
          sourceDomain
          recipient
          nonce
          sender
          transactionHash
        }
      }
    `;

    const client = new SubgraphClient({
      ...this.config,
      baseUrl: chainSubgraphUrl,
    });

    const result = await client.query<MessageSentsQueryResponse>(query, {
      startTimestamp: startTimestamp.toString(),
      endTimestamp: endTimestamp.toString(),
      first,
    });

    return result.messageSents || [];
  }
}
