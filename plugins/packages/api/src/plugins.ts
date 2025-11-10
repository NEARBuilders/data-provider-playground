import type DataProviderCBridgePlugin from "@data-provider/cbridge";
import { createPluginRuntime } from "every-plugin";

declare module "every-plugin" {
  interface RegisteredPlugins {
    "@data-provider/cbridge": typeof DataProviderCBridgePlugin;
  }
}

const env = {
  DATA_PROVIDER_API_KEY: process.env.DATA_PROVIDER_API_KEY || "",
};

export const runtime = createPluginRuntime({
  registry: {
    "@data-provider/cbridge": {
      remoteUrl: process.env.DATA_PROVIDER_PLUGIN_URL || "http://localhost:3014/remoteEntry.js",
    },
  },
  secrets: env,
});

const dataProvider = await runtime.usePlugin("@data-provider/cbridge", {
  variables: {
    baseUrl: process.env.DATA_PROVIDER_BASE_URL || "https://cbridge-prod2.celer.app",
    timeout: Number(process.env.DATA_PROVIDER_TIMEOUT) || 30000,
  },
  secrets: {
    apiKey: "{{DATA_PROVIDER_API_KEY}}"
  },
});

export const plugins = { dataProvider } as const;

// if (typeof process !== 'undefined') {
//   process.once('SIGTERM', () => runtime.shutdown().then(() => process.exit(0)));
//   process.once('SIGINT', () => runtime.shutdown().then(() => process.exit(0)));
// }