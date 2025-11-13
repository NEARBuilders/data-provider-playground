import Decimal from 'decimal.js';

export function calculateEffectiveRate(
  amountIn: string,
  amountOut: string,
  decimalsIn: number,
  decimalsOut: number
): number {
  if (!amountIn || !amountOut || typeof decimalsIn !== 'number' || typeof decimalsOut !== 'number') {
    throw new Error('Invalid input parameters for rate calculation');
  }

  if (decimalsIn < 0 || decimalsOut < 0) {
    throw new Error('Decimals must be non-negative');
  }

  try {
    const normalizedIn = new Decimal(amountIn).div(new Decimal(10).pow(decimalsIn));
    const normalizedOut = new Decimal(amountOut).div(new Decimal(10).pow(decimalsOut));

    if (normalizedIn.isZero()) {
      return 0;
    }

    return normalizedOut.div(normalizedIn).toNumber();
  } catch (error) {
    throw new Error(`Decimal calculation failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export function sumFeesUsd(fees: Array<{ amountUSD?: string }>): number | null {
  if (!Array.isArray(fees)) {
    throw new Error('Fees must be an array');
  }

  if (fees.length === 0) {
    return null;
  }

  try {
    const total = fees.reduce((sum, fee) => {
      if (!fee?.amountUSD) return sum;
      return sum.plus(new Decimal(fee.amountUSD));
    }, new Decimal(0));

    return total.toNumber();
  } catch (error) {
    throw new Error(`Fee calculation failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}
