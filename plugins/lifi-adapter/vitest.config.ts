import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ['./src/tests/setup.ts'],
    include: [
      "src/tests/unit/**/*.test.ts",
      "src/tests/integration/**/*.test.ts"
    ],
    exclude: ["node_modules", "dist"],
    testTimeout: 15000,
  },
  resolve: {
    alias: {
      "@": "./src",
    },
  },
});
