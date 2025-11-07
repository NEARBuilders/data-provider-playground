import { describe, expect, it } from "vitest";
import {
  calculateEffectiveRate,
  calculateTotalFees,
} from "../../services";
import type { Quote } from "../../client/stargate";

describe("Services - Core Functions", () => {
  describe("calculateEffectiveRate", () => {
    it("should calculate rate for same decimals", () => {
      const rate = calculateEffectiveRate(
        "1000000", // 1 USDC
        "995000", // 0.995 USDC
        6, // USDC decimals
        6 // USDC decimals
      );

      expect(rate).toBeCloseTo(0.995, 3);
    });

    it("should calculate rate for different decimals", () => {
      const rate = calculateEffectiveRate(
        "1000000000000000000", // 1 ETH (18 decimals)
        "2000000000", // 2000 USDC (6 decimals)
        18, // ETH decimals
        6 // USDC decimals
      );

      expect(rate).toBeCloseTo(2000, 1);
    });

    it("should handle small amounts", () => {
      const rate = calculateEffectiveRate(
        "1", // 1 wei
        "1", // 1 smallest unit
        18,
        18
      );

      expect(rate).toBe(1);
    });

    it("should handle large amounts", () => {
      const rate = calculateEffectiveRate(
        "1000000000000000000000", // 1000 tokens (18 decimals)
        "999000000000000000000", // 999 tokens
        18,
        18
      );

      expect(rate).toBeCloseTo(0.999, 3);
    });

    it("should handle zero destination amount", () => {
      const rate = calculateEffectiveRate(
        "1000000",
        "0",
        6,
        6
      );

      expect(rate).toBe(0);
    });
  });

  describe("calculateTotalFees", () => {
    it("should sum all fees", () => {
      const quote: Quote = {
        srcAmount: "1000000",
        dstAmount: "995000",
        dstAmountMin: "990000",
        duration: { estimated: 60 },
        fees: [
          { name: "protocol", amount: "3000" },
          { name: "gas", amount: "2000" },
        ],
      };

      const totalFees = calculateTotalFees(quote, "1000000", 6, 1.0);

      // (3000 + 2000) / 1e6 * 1.0 = 0.005
      expect(totalFees).toBeCloseTo(0.005, 6);
    });

    it("should handle empty fees array", () => {
      const quote: Quote = {
        srcAmount: "1000000",
        dstAmount: "1000000",
        dstAmountMin: "1000000",
        duration: { estimated: 60 },
        fees: [],
      };

      const totalFees = calculateTotalFees(quote, "1000000", 6, 1.0);

      expect(totalFees).toBe(0);
    });

    it("should apply USD price multiplier", () => {
      const quote: Quote = {
        srcAmount: "1000000000000000000", // 1 ETH
        dstAmount: "995000000000000000",
        dstAmountMin: "990000000000000000",
        duration: { estimated: 60 },
        fees: [
          { name: "fee", amount: "5000000000000000" }, // 0.005 ETH
        ],
      };

      const totalFees = calculateTotalFees(quote, "1000000000000000000", 18, 2000);

      // 0.005 ETH * $2000 = $10
      expect(totalFees).toBeCloseTo(10, 1);
    });

    it("should handle invalid fee amounts gracefully", () => {
      const quote: Quote = {
        srcAmount: "1000000",
        dstAmount: "995000",
        dstAmountMin: "990000",
        duration: { estimated: 60 },
        fees: [
          { name: "valid", amount: "1000" },
          { name: "invalid", amount: "not-a-number" },
          { name: "another-valid", amount: "2000" },
        ],
      };

      // Should skip invalid and sum valid ones
      const totalFees = calculateTotalFees(quote, "1000000", 6, 1.0);

      // (1000 + 2000) / 1e6 = 0.003
      expect(totalFees).toBeCloseTo(0.003, 6);
    });
  });
});
