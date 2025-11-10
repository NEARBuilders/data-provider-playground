import type DataProviderAxelarPlugin from "@data-provider/axelar-usman";
import { createPluginRuntime } from "every-plugin";

declare module "every-plugin" {
  interface RegisteredPlugins {
    "@data-provider/axelar-usman": typeof DataProviderAxelarPlugin;
  }
}

const env = {
  DATA_PROVIDER_API_KEY: process.env.DATA_PROVIDER_API_KEY || "",
};

export const runtime = createPluginRuntime({
  registry: {
    "@data-provider/axelar-usman": {
      remoteUrl: process.env.DATA_PROVIDER_PLUGIN_URL || "http://localhost:3015/remoteEntry.js",
    },
  },
  secrets: env,
});

const dataProvider = await runtime.usePlugin("@data-provider/axelar-usman", {
  variables: {
    baseUrl: process.env.DATA_PROVIDER_BASE_URL || "https://api.axelarscan.io/api",
    timeout: Number(process.env.DATA_PROVIDER_TIMEOUT) || 30000,
  },
  secrets: {
    apiKey: "{{DATA_PROVIDER_API_KEY}}"
  },
});

export const plugins: { dataProvider: unknown } = { dataProvider };

// if (typeof process !== 'undefined') {
//   process.once('SIGTERM', () => runtime.shutdown().then(() => process.exit(0)));
//   process.once('SIGINT', () => runtime.shutdown().then(() => process.exit(0)));
// }