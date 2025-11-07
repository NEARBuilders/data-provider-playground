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
    testTimeout: 60000, // Increased timeout for real API calls
    hookTimeout: 60000, // Timeout for hooks like beforeAll
  },
  resolve: {
    alias: {
      "@": "./src",
    },
  },
});
