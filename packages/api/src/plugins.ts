import type DataProviderTemplatePlugin from "@data-provider/template";
import { createPluginRuntime } from "every-plugin";

declare module "every-plugin" {
  interface RegisteredPlugins {
    "@data-provider/template": typeof DataProviderTemplatePlugin;
  }
}

const env = {
  DATA_PROVIDER_API_KEY: process.env.DATA_PROVIDER_API_KEY!,
};

export const runtime = createPluginRuntime({
  registry: {
    "@data-provider/template": {
      remoteUrl: process.env.DATA_PROVIDER_PLUGIN_URL || "http://localhost:3014/remoteEntry.js",
    },
  },
  secrets: env,
});

const dataProvider = await runtime.usePlugin("@data-provider/template", {
  variables: {
    baseUrl: process.env.DATA_PROVIDER_BASE_URL || "https://api.example.com",
    timeout: Number(process.env.DATA_PROVIDER_TIMEOUT) || 10000,
  },
  secrets: {
    apiKey: "{{DATA_PROVIDER_API_KEY}}"
  },
});

export const plugins = { dataProvider } as const;
