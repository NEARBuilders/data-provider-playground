import type TemplatePlugin from "@every-plugin/template";
import { createPluginRuntime } from "every-plugin";

declare module "every-plugin" {
  interface RegisteredPlugins {
    "template": typeof TemplatePlugin;
  }
}

const runtime = createPluginRuntime({
  registry: {
    "template": {
      remoteUrl: "http://localhost:3014/remoteEntry.js",
    },
  },
  secrets: {
    DATA_PROVIDER_API_KEY: process.env.DATA_PROVIDER_API_KEY!,
  },
});

const template = await runtime.usePlugin("template", {
  variables: {
    baseUrl: process.env.DATA_PROVIDER_BASE_URL || "https://api.example.com",
    timeout: Number(process.env.DATA_PROVIDER_TIMEOUT) || 10000,
  },
  secrets: { apiKey: "{{DATA_PROVIDER_API_KEY}}" },
});

export const plugins = {
  template
};