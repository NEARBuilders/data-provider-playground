import { z } from "every-plugin/zod";
import type { RateLimiter } from "../utils/rateLimit";
import { withRetry } from "../utils/retry";

/**
 * LayerZero Scan API Types
 * Based on https://scan.layerzero-api.com/v1 documentation
 */

export const LzMessageSchema = z.object({
  pathway: z.object({
    srcEid: z.number(),
    dstEid: z.number(),
    id: z.string(),
  }),
  source: z.object({
    tx: z.object({
      value: z.string().optional(),
      blockTimestamp: z.number(),
    }),
  }),
  created: z.string(),
  updated: z.string(),
});

export type LzMessage = z.infer<typeof LzMessageSchema>;

export const LzMessagesResponseSchema = z.object({
  data: z.array(LzMessageSchema),
  nextToken: z.string().optional(),
});

export type LzMessagesResponse = z.infer<typeof LzMessagesResponseSchema>;

/**
 * LayerZero Scan API Client
 */
export class LzScanClient {
  constructor(
    private readonly baseUrl: string,
    private readonly rateLimiter: RateLimiter,
    private readonly timeoutMs: number,
    private readonly maxRetries: number
  ) {}

  /**
   * Fetch messages from LayerZero Scan with pagination support
   */
  async fetchMessages(params: {
    start?: string; // ISO datetime
    end?: string; // ISO datetime
    limit?: number;
    nextToken?: string;
  }): Promise<LzMessagesResponse> {
    await this.rateLimiter.acquire();

    return withRetry(
      async () => {
        const url = new URL(`${this.baseUrl}/messages/latest`);
        
        if (params.start) url.searchParams.set("start", params.start);
        if (params.end) url.searchParams.set("end", params.end);
        if (params.limit) url.searchParams.set("limit", params.limit.toString());
        if (params.nextToken) url.searchParams.set("nextToken", params.nextToken);

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
              message: `LayerZero Scan API error: ${response.statusText}`,
            };
          }

          const data = await response.json();
          return LzMessagesResponseSchema.parse(data);
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
   * Fetch all messages for a time window with automatic pagination
   */
  async fetchAllMessages(params: {
    start: string;
    end: string;
    limit?: number;
  }): Promise<LzMessage[]> {
    const allMessages: LzMessage[] = [];
    let nextToken: string | undefined;

    do {
      const response = await this.fetchMessages({
        ...params,
        nextToken,
      });

      allMessages.push(...response.data);
      nextToken = response.nextToken;
    } while (nextToken);

    return allMessages;
  }
}
