import Decimal from "decimal.js";
import { HttpUtils } from "./http";

/**
 * Liquidity probing utility for finding maximum amounts at slippage thresholds
 * Uses bounded binary search to find max input amount for given slippage
 */
export class LiquidityProber {
  /**
   * Find maximum liquidity (input amount) at a given slippage threshold
   * Uses binary search to probe the API for the maximum amount that stays below slippage
   * 
   * @param baseUrl Provider API base URL
   * @param route Route with source and destination
   * @param slippageBps Slippage threshold in basis points (e.g., 50 = 0.5%)
   * @param maxIterations Maximum binary search iterations (default: 3 for speed)
   * @returns Maximum input amount as string
   */
  static async findMaxLiquidity(
    baseUrl: string,
    route: { source: any; destination: any },
    slippageBps: number,
    maxIterations: number = 3
  ): Promise<string> {
    const slippageTarget = slippageBps / 10000; // Convert bps to decimal (e.g., 50 bps = 0.005)

    // Start with reasonable bounds
    let minAmount = new Decimal("1000"); // Min: 0.001 of smallest unit
    let maxAmount = new Decimal("100000000000"); // Max: 100B (covers most tokens)
    let bestAmount = minAmount;

    try {
      for (let i = 0; i < maxIterations; i++) {
        // Binary search: test midpoint
        const testAmount = minAmount.plus(maxAmount).div(2);

        try {
          // Try to get a quote at this amount
          const quote = await LiquidityProber.getQuoteForProbing(
            baseUrl,
            route,
            testAmount.toString()
          );

          if (quote) {
            // Calculate slippage from quote
            const slippage = LiquidityProber.calculateSlippage(quote);

            if (slippage !== null && slippage <= slippageTarget) {
              // This amount works! Try going higher
              bestAmount = testAmount;
              minAmount = testAmount;
            } else {
              // Slippage too high, try lower
              maxAmount = testAmount;
            }
          } else {
            // Quote failed, try lower
            maxAmount = testAmount;
          }
        } catch (error) {
          // Quote failed, try lower
          maxAmount = testAmount;
        }

        // Stop if range too narrow
        if (maxAmount.minus(minAmount).lessThan("1")) {
          break;
        }
      }

      return bestAmount.toString();
    } catch (error) {
      console.warn(
        `Liquidity probing failed: ${error instanceof Error ? error.message : String(error)}`
      );
      // Fallback to notional amount
      return "1000";
    }
  }

  /**
   * Get a quote for probing (typically for route test)
   * This is meant to be overridden per provider
   * 
   * @param baseUrl Provider API base URL
   * @param route Route details
   * @param amount Input amount to quote
   * @returns Quote object or null if failed
   */
  private static async getQuoteForProbing(
    baseUrl: string,
    route: any,
    amount: string
  ): Promise<any | null> {
    try {
      // This is a generic implementation - override per provider
      // For Axelar, this would call their quote endpoint
      const url = new URL(`${baseUrl}/quote`);
      url.searchParams.set("sourceChain", route.source.chainId);
      url.searchParams.set("destinationChain", route.destination.chainId);
      url.searchParams.set("sourceAsset", route.source.assetId);
      url.searchParams.set("destinationAsset", route.destination.assetId);
      url.searchParams.set("amount", amount);

      const response = await HttpUtils.fetch(url.toString());
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Calculate slippage from a quote response
   * Returns null if cannot determine
   */
  private static calculateSlippage(quote: any): number | null {
    try {
      // Try different quote formats from various providers
      if (quote.slippagePercentage !== undefined) {
        return quote.slippagePercentage;
      }

      if (quote.estimate?.slippagePercentage !== undefined) {
        return quote.estimate.slippagePercentage;
      }

      if (
        quote.fromAmount !== undefined &&
        quote.toAmount !== undefined &&
        quote.expectedToAmount !== undefined
      ) {
        const actual = new Decimal(quote.toAmount);
        const expected = new Decimal(quote.expectedToAmount);
        if (expected.greaterThan(0)) {
          const slippage = new Decimal(1).minus(actual.div(expected));
          return parseFloat(slippage.toFixed(6));
        }
      }

      return null;
    } catch {
      return null;
    }
  }
}
