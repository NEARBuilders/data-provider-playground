import type DataProviderAxelarPlugin from "@data-provider/axelar-usman";
import { createPluginRuntime } from "every-plugin";

declare module "every-plugin" {
  interface RegisteredPlugins {
    "axelar": typeof DataProviderTemplatePlugin;
    "layerzero": typeof DataProviderTemplatePlugin;
    "cctp": typeof DataProviderTemplatePlugin;
    "across": typeof DataProviderTemplatePlugin;
    "debridge": typeof DataProviderTemplatePlugin;
    "lifi": typeof DataProviderTemplatePlugin;
    "wormhole": typeof DataProviderTemplatePlugin;
  }
}

const env = {
  DATA_PROVIDER_API_KEY: process.env.DATA_PROVIDER_API_KEY || "",
};

export const runtime = createPluginRuntime({
  registry: {
    "axelar": {
      remoteUrl: process.env.AXELAR_PLUGIN_URL || "http://localhost:3014/remoteEntry.js",
    },
    "layerzero": {
      remoteUrl: process.env.LAYERZERO_PLUGIN_URL || "http://localhost:3015/remoteEntry.js",
    },
    "cctp": {
      remoteUrl: process.env.CCTP_PLUGIN_URL || "http://localhost:3016/remoteEntry.js",
    },
    "across": {
      remoteUrl: process.env.ACROSS_PLUGIN_URL || "http://localhost:3017/remoteEntry.js",
    },
    "debridge": {
      remoteUrl: process.env.DEBRIDGE_PLUGIN_URL || "http://localhost:3018/remoteEntry.js",
    },
    "lifi": {
      remoteUrl: process.env.LIFI_PLUGIN_URL || "http://localhost:3019/remoteEntry.js",
    },
    "wormhole": {
      remoteUrl: process.env.WORMHOLE_PLUGIN_URL || "http://localhost:3020/remoteEntry.js",
    },
  },
  secrets: env,
});

// Load all configured providers
const axelar = await runtime.usePlugin("axelar", {
  variables: {
    baseUrl: process.env.AXELAR_BASE_URL || "https://api.axelarscan.io",
    timeout: Number(process.env.DATA_PROVIDER_TIMEOUT) || 10000,
  },
  secrets: {
    apiKey: "{{DATA_PROVIDER_API_KEY}}"
  },
});

const layerzero = await runtime.usePlugin("layerzero", {
  variables: {
    baseUrl: process.env.LAYERZERO_BASE_URL || "https://api.layerzero.com",
    timeout: Number(process.env.DATA_PROVIDER_TIMEOUT) || 10000,
  },
  secrets: {
    apiKey: "{{DATA_PROVIDER_API_KEY}}"
  },
});

const cctp = await runtime.usePlugin("cctp", {
  variables: {
    baseUrl: process.env.CCTP_BASE_URL || "https://api.circle.com",
    timeout: Number(process.env.DATA_PROVIDER_TIMEOUT) || 10000,
  },
  secrets: {
    apiKey: "{{DATA_PROVIDER_API_KEY}}"
  },
});

const across = await runtime.usePlugin("across", {
  variables: {
    baseUrl: process.env.ACROSS_BASE_URL || "https://app.across.to/api",
    timeout: Number(process.env.DATA_PROVIDER_TIMEOUT) || 10000,
  },
  secrets: {
    apiKey: "{{DATA_PROVIDER_API_KEY}}"
  },
});

const debridge = await runtime.usePlugin("debridge", {
  variables: {
    baseUrl: process.env.DEBRIDGE_BASE_URL || "https://dln.debridge.finance/v1.0",
    timeout: Number(process.env.DATA_PROVIDER_TIMEOUT) || 10000,
  },
  secrets: {
    apiKey: "{{DATA_PROVIDER_API_KEY}}"
  },
});

const lifi = await runtime.usePlugin("lifi", {
  variables: {
    baseUrl: process.env.LIFI_BASE_URL || "https://li.quest/v1",
    timeout: Number(process.env.DATA_PROVIDER_TIMEOUT) || 10000,
  },
  secrets: {
    apiKey: "{{DATA_PROVIDER_API_KEY}}"
  },
});

const wormhole = await runtime.usePlugin("wormhole", {
  variables: {
    baseUrl: process.env.WORMHOLE_BASE_URL || "https://api.wormholescan.io/api/v1",
    timeout: Number(process.env.DATA_PROVIDER_TIMEOUT) || 10000,
  },
  secrets: {
    apiKey: "{{DATA_PROVIDER_API_KEY}}"
  },
});

export const plugins = { axelar, layerzero, cctp, across, debridge, lifi, wormhole } as const;

// if (typeof process !== 'undefined') {
//   process.once('SIGTERM', () => runtime.shutdown().then(() => process.exit(0)));
//   process.once('SIGINT', () => runtime.shutdown().then(() => process.exit(0)));
// }
