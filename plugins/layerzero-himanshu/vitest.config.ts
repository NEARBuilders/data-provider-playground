import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: [
      "src/__tests__/unit/**/*.test.ts",
      "src/__tests__/integration/**/*.test.ts"
    ],
    exclude: ["node_modules", "dist"],
    // Increased timeout for real API calls (liquidity binary search takes ~20-30s)
    testTimeout: 60000,
  },
  resolve: {
    alias: {
      "@": "./src",
    },
  },
});
