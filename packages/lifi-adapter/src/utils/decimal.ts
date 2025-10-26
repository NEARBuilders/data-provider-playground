import Decimal from 'decimal.js';

export class DecimalUtils {
  /**
   * Calculate effective rate with precise decimal arithmetic
   * Preserves raw strings, computes normalized rate
   */
  static calculateEffectiveRate(
    fromAmount: string,
    toAmount: string,
    fromDecimals: number,
    toDecimals: number
  ): number {
    try {
      const fromDecimal = new Decimal(fromAmount).div(new Decimal(10).pow(fromDecimals));
      const toDecimal = new Decimal(toAmount).div(new Decimal(10).pow(toDecimals));
      
      if (fromDecimal.isZero()) return 0;
      
      return toDecimal.div(fromDecimal).toNumber();
    } catch (error) {
      console.warn('Decimal calculation failed:', error);
      return 0;
    }
  }

  /**
   * Sum fee amounts with precision
   */
  static sumFees(fees: Array<{ amountUSD?: string }>): number {
    try {
      return fees.reduce((sum, fee) => {
        if (!fee.amountUSD) return sum;
        return sum.plus(new Decimal(fee.amountUSD));
      }, new Decimal(0)).toNumber();
    } catch (error) {
      console.warn('Fee calculation failed:', error);
      return 0;
    }
  }
}