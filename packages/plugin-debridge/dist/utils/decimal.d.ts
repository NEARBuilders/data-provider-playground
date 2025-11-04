import Decimal from 'decimal.js';
/**
 * Decimal utilities for precise financial calculations
 * Prevents floating-point arithmetic errors in rate calculations
 */
export declare class DecimalUtils {
    /**
     * Calculate effective rate with precise decimal arithmetic
     * Preserves raw strings, computes normalized rate
     */
    static calculateEffectiveRate(fromAmount: string, toAmount: string, fromDecimals: number, toDecimals: number): number;
    /**
     * Sum fee amounts with precision
     */
    static sumFees(fees: Array<{
        amountUSD?: string | number;
    }>): number;
    /**
     * Calculate slippage in basis points
     */
    static calculateSlippageBps(expectedRate: number, actualRate: number): number;
    /**
     * Normalize amount from smallest units to human-readable
     */
    static normalizeAmount(amount: string, decimals: number): Decimal;
    /**
     * Denormalize amount from human-readable to smallest units
     */
    static denormalizeAmount(amount: string | number, decimals: number): string;
}
