import type { LzScanClient } from "../client/lzScan";
import type { StargateClient, Quote } from "../client/stargate";

/**
 * Core service functions for LayerZero/Stargate data provider
 */

/**
 * Compute volume from LayerZero Scan messages
 * Sums source.tx.value across all messages in the time window
 */
export async function computeVolume(
  lzScan: LzScanClient,
  params: {
    start: number; // Unix timestamp ms
    end: number; // Unix timestamp ms
  }
): Promise<{
  window: { start: number; end: number };
  raw: string; // Total in smallest native units
  messageCount: number;
}> {
  const startIso = new Date(params.start).toISOString();
  const endIso = new Date(params.end).toISOString();

  const messages = await lzScan.fetchAllMessages({
    start: startIso,
    end: endIso,
    limit: 200,
  });

  let rawSum = 0n;
  let messageCount = 0;

  for (const message of messages) {
    if (message.source?.tx?.value) {
      try {
        rawSum += BigInt(message.source.tx.value);
        messageCount++;
      } catch (error) {
        // Skip invalid values
        console.warn(`Invalid value in message: ${message.source.tx.value}`);
      }
    }
  }

  return {
    window: { start: params.start, end: params.end },
    raw: rawSum.toString(),
    messageCount,
  };
}

/**
 * Calculate effective rate from quote
 * Normalizes for decimals: (dstAmount / 10^dstDec) / (srcAmount / 10^srcDec)
 */
export function calculateEffectiveRate(
  srcAmount: string,
  dstAmount: string,
  srcDecimals: number,
  dstDecimals: number
): number {
  const srcBig = BigInt(srcAmount);
  const dstBig = BigInt(dstAmount);

  // Convert to floating point with proper decimal adjustment
  const srcNormalized = Number(srcBig) / Math.pow(10, srcDecimals);
  const dstNormalized = Number(dstBig) / Math.pow(10, dstDecimals);

  return dstNormalized / srcNormalized;
}

/**
 * Calculate total fees from quote
 * Sums all fee amounts and converts to USD estimate
 */
export function calculateTotalFees(
  quote: Quote,
  srcAmount: string,
  srcDecimals: number,
  estimatedUsdPrice: number = 1.0 // Assume stablecoin for now
): number {
  let totalFeeInSrcUnits = 0n;

  // Handle optional fees array
  const fees = quote.fees || [];
  
  for (const fee of fees) {
    try {
      totalFeeInSrcUnits += BigInt(fee.amount);
    } catch (error) {
      console.warn(`Invalid fee amount: ${fee.amount}`);
    }
  }

  const feeNormalized = Number(totalFeeInSrcUnits) / Math.pow(10, srcDecimals);
  return feeNormalized * estimatedUsdPrice;
}

/**
 * Binary search to find max amount at target slippage
 * Probes the Stargate quotes API to find the largest srcAmount where slippage <= targetBps
 */
export async function findMaxAmountAtSlippage(
  stargateClient: StargateClient,
  params: {
    srcToken: string;
    dstToken: string;
    srcChainKey: string;
    dstChainKey: string;
    srcAddress: string;
    dstAddress: string;
    srcDecimals: number;
    dstDecimals: number;
    targetBps: number; // e.g., 50 for 0.5%, 100 for 1.0%
  }
): Promise<{
  maxSrcAmount: string;
  slippageBps: number;
  samples: Array<{ srcAmount: string; dstAmount: string; slippageBps: number }>;
}> {
  const samples: Array<{ srcAmount: string; dstAmount: string; slippageBps: number }> = [];

  // Get baseline quote with 1 unit
  const oneUnit = BigInt(10 ** params.srcDecimals);
  const baseQuote = await stargateClient.getQuote({
    srcToken: params.srcToken,
    dstToken: params.dstToken,
    srcChainKey: params.srcChainKey,
    dstChainKey: params.dstChainKey,
    srcAddress: params.srcAddress,
    dstAddress: params.dstAddress,
    srcAmount: oneUnit.toString(),
    dstAmountMin: "0",
  });

  const baseRate = calculateEffectiveRate(
    baseQuote.srcAmount,
    baseQuote.dstAmount,
    params.srcDecimals,
    params.dstDecimals
  );

  samples.push({
    srcAmount: baseQuote.srcAmount,
    dstAmount: baseQuote.dstAmount,
    slippageBps: 0,
  });

  // Binary search bounds
  let lo = oneUnit;
  let hi = BigInt(1_000_000) * BigInt(10 ** params.srcDecimals); // Start with 1M units
  let bestAmount = oneUnit;
  let bestSlippage = 0;

  // Binary search with max 24 iterations
  for (let i = 0; i < 24; i++) {
    if (lo > hi) break;

    const mid = (lo + hi) / 2n;

    try {
      const quote = await stargateClient.getQuote({
        srcToken: params.srcToken,
        dstToken: params.dstToken,
        srcChainKey: params.srcChainKey,
        dstChainKey: params.dstChainKey,
        srcAddress: params.srcAddress,
        dstAddress: params.dstAddress,
        srcAmount: mid.toString(),
        dstAmountMin: "0",
      });

      const rate = calculateEffectiveRate(
        quote.srcAmount,
        quote.dstAmount,
        params.srcDecimals,
        params.dstDecimals
      );

      // Calculate slippage in basis points
      const slippageBps = Math.max(0, Math.round((1 - rate / baseRate) * 10_000));

      samples.push({
        srcAmount: quote.srcAmount,
        dstAmount: quote.dstAmount,
        slippageBps,
      });

      if (slippageBps <= params.targetBps) {
        // This amount is acceptable, try larger
        bestAmount = mid;
        bestSlippage = slippageBps;
        lo = mid + 1n;
      } else {
        // Too much slippage, try smaller
        hi = mid - 1n;
      }
    } catch (error) {
      // If quote fails, amount is too large
      hi = mid - 1n;
    }
  }

  return {
    maxSrcAmount: bestAmount.toString(),
    slippageBps: bestSlippage,
    samples,
  };
}

/**
 * Route context for liquidity depth calculation
 */
export interface RouteContext {
  srcToken: string;
  dstToken: string;
  srcChainKey: string;
  dstChainKey: string;
  srcAddress: string;
  dstAddress: string;
  srcDecimals: number;
  dstDecimals: number;
}
