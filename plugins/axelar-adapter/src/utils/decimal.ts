import Decimal from "decimal.js";

/**
 * Utility functions for precise decimal arithmetic
 * Prevents floating-point errors when calculating rates and fees
 */
export class DecimalUtils {
  /**
   * Calculate effective rate with precise decimal arithmetic
   * 
   * @param fromAmount Raw amount in smallest units (string)
   * @param toAmount Raw amount in smallest units (string)
   * @param fromDecimals Token decimals for source
   * @param toDecimals Token decimals for destination
   * @returns Effective exchange rate (normalized, > 0)
   */
  static calculateEffectiveRate(
    fromAmount: string,
    toAmount: string,
    fromDecimals: number,
    toDecimals: number
  ): number {
    try {
      // Normalize: convert raw amounts to decimal representation
      const fromDecimal = new Decimal(fromAmount).div(
        new Decimal(10).pow(fromDecimals)
      );
      const toDecimal = new Decimal(toAmount).div(
        new Decimal(10).pow(toDecimals)
      );

      // Avoid division by zero
      if (fromDecimal.isZero()) {
        return 0;
      }

      // Rate = output / input (normalized)
      const rate = toDecimal.div(fromDecimal);
      return parseFloat(rate.toFixed(18));
    } catch (error) {
      console.warn(
        `Failed to calculate effective rate: ${error instanceof Error ? error.message : String(error)}`
      );
      return 0;
    }
  }

  /**
   * Sum fee amounts with precision
   * 
   * @param fees Array of fee objects with optional amountUSD
   * @returns Sum of all fees in USD
   */
  static sumFees(fees: Array<{ amountUSD?: string }>): number {
    try {
      let total = new Decimal(0);
      for (const fee of fees) {
        if (fee.amountUSD) {
          total = total.plus(new Decimal(fee.amountUSD));
        }
      }
      return parseFloat(total.toString());
    } catch (error) {
      console.warn(
        `Failed to sum fees: ${error instanceof Error ? error.message : String(error)}`
      );
      return 0;
    }
  }

  /**
   * Compare two decimal amounts
   * 
   * @param a Amount A (string)
   * @param b Amount B (string)
   * @param decimals Decimals for normalization
   * @returns true if a > b (after normalization)
   */
  static isGreaterThan(a: string, b: string, decimals: number = 0): boolean {
    try {
      const aDec = new Decimal(a).div(new Decimal(10).pow(decimals));
      const bDec = new Decimal(b).div(new Decimal(10).pow(decimals));
      return aDec.greaterThan(bDec);
    } catch {
      return false;
    }
  }

  /**
   * Divide with precision
   * 
   * @param dividend Numerator (string)
   * @param divisor Denominator (string)
   * @returns Result as string
   */
  static divide(dividend: string, divisor: string): string {
    try {
      const result = new Decimal(dividend).div(new Decimal(divisor));
      return result.toString();
    } catch {
      return "0";
    }
  }

  /**
   * Multiply with precision
   * 
   * @param a First number (string)
   * @param b Second number (string)
   * @returns Result as string
   */
  static multiply(a: string, b: string): string {
    try {
      const result = new Decimal(a).mul(new Decimal(b));
      return result.toString();
    } catch {
      return "0";
    }
  }
}
