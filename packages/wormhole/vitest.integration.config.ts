import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true,
		environment: "node",
		include: ["src/__tests__/integration/**/*.test.ts"],
		exclude: [
			"node_modules/**",
			"dist/**",
			"**/node_modules/**",
			"**/*.d.ts",
			"src/__tests__/unit/**",
		],
		testTimeout: 45000, // Longer timeout for integration tests with real API calls
		// Run sequentially to avoid rate limiting
		pool: "threads",
		poolOptions: {
			threads: {
				singleThread: true
			}
		}
	},
	resolve: {
		alias: {
			"@": "./src",
		},
	},
});
