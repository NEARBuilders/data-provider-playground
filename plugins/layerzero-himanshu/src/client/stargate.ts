import { z } from "every-plugin/zod";
import type { RateLimiter } from "../utils/rateLimit";
import { withRetry } from "../utils/retry";

/**
 * Stargate API Types
 * Based on https://stargate.finance/api/v1 documentation
 */

export const QuoteSchema = z.object({
  srcAmount: z.string(),
  dstAmount: z.string(),
  dstAmountMin: z.string(),
  duration: z.object({
    estimated: z.number(),
  }).optional(),
  fees: z.array(
    z.object({
      name: z.string().optional(),
      amount: z.string(),
      token: z.string().optional(),
    })
  ).optional().default([]),
});

export type Quote = z.infer<typeof QuoteSchema>;

export const QuotesResponseSchema = z.object({
  quotes: z.array(QuoteSchema),
});

export const TokenSchema = z.object({
  chainKey: z.string(),
  address: z.string(),
  symbol: z.string(),
  decimals: z.number(),
  name: z.string().optional(),
});

export type Token = z.infer<typeof TokenSchema>;

export const TokensResponseSchema = z.object({
  tokens: z.array(TokenSchema),
});

export const ChainSchema = z.object({
  chainKey: z.string(),
  chainId: z.number(),
  name: z.string(),
});

export type Chain = z.infer<typeof ChainSchema>;

export const ChainsResponseSchema = z.object({
  chains: z.array(ChainSchema),
});

/**
 * Stargate API Client
 */
export class StargateClient {
  constructor(
    private readonly baseUrl: string,
    private readonly rateLimiter: RateLimiter,
    private readonly timeoutMs: number,
    private readonly maxRetries: number
  ) {}

  /**
   * Get a quote for a cross-chain transfer
   */
  async getQuote(params: {
    srcToken: string;
    dstToken: string;
    srcChainKey: string;
    dstChainKey: string;
    srcAddress: string;
    dstAddress: string;
    srcAmount: string;
    dstAmountMin: string;
  }): Promise<Quote> {
    await this.rateLimiter.acquire();

    return withRetry(
      async () => {
        const url = new URL(`${this.baseUrl}/quotes`);
        
        Object.entries(params).forEach(([key, value]) => {
          url.searchParams.set(key, value);
        });

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

        try {
          const response = await fetch(url.toString(), {
            signal: controller.signal,
            headers: {
              "Accept": "application/json",
            },
          });

          if (!response.ok) {
            throw {
              status: response.status,
              message: `Stargate API error: ${response.statusText}`,
            };
          }

          const data = await response.json();
          const parsed = QuotesResponseSchema.parse(data);

          if (!parsed.quotes || parsed.quotes.length === 0) {
            throw new Error("No quotes available for this route");
          }

          return parsed.quotes[0];
        } finally {
          clearTimeout(timeoutId);
        }
      },
      {
        maxRetries: this.maxRetries,
        shouldRetry: (error) => {
          if (error && typeof error === "object" && "status" in error) {
            const status = (error as { status: number }).status;
            return status === 429 || status >= 500;
          }
          return false;
        },
      }
    );
  }

  /**
   * Fetch all available tokens
   */
  async getTokens(): Promise<Token[]> {
    await this.rateLimiter.acquire();

    return withRetry(
      async () => {
        const url = `${this.baseUrl}/tokens`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

        try {
          const response = await fetch(url, {
            signal: controller.signal,
            headers: {
              "Accept": "application/json",
            },
          });

          if (!response.ok) {
            throw {
              status: response.status,
              message: `Stargate API error: ${response.statusText}`,
            };
          }

          const data = await response.json();
          const parsed = TokensResponseSchema.parse(data);
          return parsed.tokens;
        } finally {
          clearTimeout(timeoutId);
        }
      },
      {
        maxRetries: this.maxRetries,
      }
    );
  }

  /**
   * Fetch all available chains
   */
  async getChains(): Promise<Chain[]> {
    await this.rateLimiter.acquire();

    return withRetry(
      async () => {
        const url = `${this.baseUrl}/chains`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

        try {
          const response = await fetch(url, {
            signal: controller.signal,
            headers: {
              "Accept": "application/json",
            },
          });

          if (!response.ok) {
            throw {
              status: response.status,
              message: `Stargate API error: ${response.statusText}`,
            };
          }

          const data = await response.json();
          const parsed = ChainsResponseSchema.parse(data);
          return parsed.chains;
        } finally {
          clearTimeout(timeoutId);
        }
      },
      {
        maxRetries: this.maxRetries,
      }
    );
  }
}
