import { createPluginRuntime, type PluginBinding } from "every-plugin";

import type DataProviderTemplatePlugin from "@every-plugin/template";

type AppBindings = {
  "@every-plugin/template": PluginBinding<typeof DataProviderTemplatePlugin>;
};

const runtime = createPluginRuntime<AppBindings>({
  registry: {
    "@every-plugin/template": {
      remoteUrl: "http://localhost:3014/remoteEntry.js",
    },
  },
  secrets: {
    DATA_PROVIDER_API_KEY: process.env.DATA_PROVIDER_API_KEY!,
  },
});

export const { router: dataProviderRouter } = await runtime.usePlugin("@every-plugin/template", {
  variables: {
    baseUrl: process.env.DATA_PROVIDER_BASE_URL || "https://api.example.com",
    timeout: Number(process.env.DATA_PROVIDER_TIMEOUT) || 10000,
  },
  secrets: { apiKey: "{{DATA_PROVIDER_API_KEY}}" },
});
