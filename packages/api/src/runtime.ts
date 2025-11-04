import "dotenv/config";
import { createPluginRuntime, type PluginBinding } from "every-plugin";
import type { Router } from "@orpc/server";
import type LifiPlugin from "@misbah/lifi";

type AppBindings = {
  "@misbah/lifi": PluginBinding<typeof LifiPlugin>;
};

const runtime = createPluginRuntime<AppBindings>({
  registry: {
    "@misbah/lifi": {
      remoteUrl: "http://localhost:3014/remoteEntry.js",
    },
  },
  secrets: {
    DATA_PROVIDER_API_KEY: process.env.DATA_PROVIDER_API_KEY || "",
  },
});

const plugin = await runtime.usePlugin("@misbah/lifi", {
  variables: {
    baseUrl: process.env.DATA_PROVIDER_BASE_URL || "https://li.quest/v1",
    timeout: Number(process.env.DATA_PROVIDER_TIMEOUT) || 10000,
  },
  secrets: { apiKey: "{{DATA_PROVIDER_API_KEY}}" },
});

export const dataProviderRouter: Router<any, any> = plugin.router;