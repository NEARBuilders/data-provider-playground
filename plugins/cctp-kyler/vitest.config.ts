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
    testTimeout: 10000,
    setupFiles: ["./src/__tests__/setup.ts"],
  },
  resolve: {
    alias: {
      "@": "./src",
    },
  },
});
