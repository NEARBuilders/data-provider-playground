import Plugin from "@/index";
import pluginDevConfig, { sampleRoute } from "../../plugin.dev";
import type { PluginRegistry } from "every-plugin";
import { createLocalPluginRuntime } from "every-plugin/testing";
import { beforeAll, describe, expect, it } from "vitest";

const TEST_PLUGIN_ID = pluginDevConfig.pluginId;
const TEST_CONFIG = pluginDevConfig.config;

const TEST_REGISTRY: PluginRegistry = {
  [TEST_PLUGIN_ID]: {
    remoteUrl: "http://localhost:3000/remoteEntry.js",
    version: "1.0.0",
    description: "Data provider template for integration testing",
  },
};

const TEST_PLUGIN_MAP = {
  [TEST_PLUGIN_ID]: Plugin,
} as const;

describe("Data Provider Plugin Integration Tests", () => {
  const runtime = createLocalPluginRuntime<typeof TEST_PLUGIN_MAP>(
    {
      registry: TEST_REGISTRY,
      secrets: { },
    },
    TEST_PLUGIN_MAP
  );

  beforeAll(async () => {
    const { initialized } = await runtime.usePlugin(TEST_PLUGIN_ID, TEST_CONFIG);
    expect(initialized).toBeDefined();
    expect(initialized.plugin.id).toBe(TEST_PLUGIN_ID);
  });

  describe("getSnapshot procedure", () => {
    it("should handle multiple routes correctly", async () => {
      const { client } = await runtime.usePlugin(TEST_PLUGIN_ID, TEST_CONFIG);

      // Create reverse route by swapping source and destination
      const secondRoute = {
        source: sampleRoute.destination,
        destination: sampleRoute.source,
      };

      const result = await client.getSnapshot({
        routes: [sampleRoute, secondRoute],
        notionals: ["1000"],
        includeWindows: ["24h"]
      });

      // For multiple routes, we expect at least some results
      expect(result.volumes.length).toBeGreaterThan(0);
      expect(result.listedAssets.assets.length).toBeGreaterThan(0);
      
      if (result.rates) {
        expect(result.rates.length).toBeGreaterThanOrEqual(1);
      }
      
      if (result.liquidity) {
        expect(result.liquidity.length).toBeGreaterThanOrEqual(1);
      }
    }, 60000);
  });

  describe("ping procedure", () => {
    it("[SANITY CHECK] should return healthy status", async () => {
      const { client } = await runtime.usePlugin(TEST_PLUGIN_ID, TEST_CONFIG);

      const result = await client.ping();

      expect(result.status).toBe("ok");
    });
  });
});
