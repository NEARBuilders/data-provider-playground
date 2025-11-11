import type DataProviderTemplatePlugin from "@data-provider/template";
import { createPluginRuntime } from "every-plugin";

declare module "every-plugin" {
  interface RegisteredPlugins {
    "@data-provider/across": typeof DataProviderTemplatePlugin;
    // "axelar": typeof DataProviderTemplatePlugin;
    // "cbridge": typeof DataProviderTemplatePlugin;
    // "cctp": typeof DataProviderTemplatePlugin;
    // "debridge": typeof DataProviderTemplatePlugin;
    // "layerzero": typeof DataProviderTemplatePlugin;
    // "lifi": typeof DataProviderTemplatePlugin;
    // "wormhole": typeof DataProviderTemplatePlugin;
  }
}

// Plugin URLs - hardcoded for cleanliness since these are deployment artifacts
const PLUGIN_URLS = {
  production: {
    "@data-provider/across": "https://elliot-braem-412-data-provider-across-0xjesus-dat-db76f08db-ze.zephyrcloud.app/remoteEntry.js",
    // axelar: "https://elliot-braem-403-data-provider-axelar-usman-data--4c705eff4-ze.zephyrcloud.app/remoteEntry.js",
    // cbridge: "https://elliot-braem-404-data-provider-cbridge-data-provi-5d6d8d39a-ze.zephyrcloud.app/remoteEntry.js",
    // cctp: "https://elliot-braem-405-data-provider-cctp-0xjesus-data--8c7836a6a-ze.zephyrcloud.app/remoteEntry.js",
    // debridge: "https://elliot-braem-407-data-provider-debridge-wali-data-245ddc19e-ze.zephyrcloud.app/remoteEntry.js",
    // layerzero: "https://elliot-braem-408-data-provider-layerzero-0xjesus--c1b0b6b8d-ze.zephyrcloud.app/remoteEntry.js",
    // lifi: "https://elliot-braem-409-data-provider-lifi-posma-data-pr-07032d5ae-ze.zephyrcloud.app/remoteEntry.js",
    // wormhole: "https://elliot-braem-410-data-provider-wormhole-0xjesus-d-50cc2e421-ze.zephyrcloud.app/remoteEntry.js",
  },
  development: {
    "@data-provider/across": "http://localhost:3017/remoteEntry.js",
    // axelar: "http://localhost:3014/remoteEntry.js",
    // cbridge: "http://localhost:3021/remoteEntry.js",
    // cctp: "http://localhost:3016/remoteEntry.js",
    // debridge: "http://localhost:3018/remoteEntry.js",
    // layerzero: "http://localhost:3015/remoteEntry.js",
    // lifi: "http://localhost:3019/remoteEntry.js",
    // wormhole: "http://localhost:3020/remoteEntry.js",
  }
} as const;

const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
const urls = isDevelopment ? PLUGIN_URLS.development : PLUGIN_URLS.production;

const env = {
  DATA_PROVIDER_API_KEY: process.env.DATA_PROVIDER_API_KEY || "",
};

export const runtime = createPluginRuntime({
  registry: {
    "@data-provider/across": { remoteUrl: urls["@data-provider/across"] },
    // "axelar": { remoteUrl: urls.axelar },
    // "cbridge": { remoteUrl: urls.cbridge },
    // "cctp": { remoteUrl: urls.cctp },
    // "debridge": { remoteUrl: urls.debridge },
    // "layerzero": { remoteUrl: urls.layerzero },
    // "lifi": { remoteUrl: urls.lifi },
    // "wormhole": { remoteUrl: urls.wormhole },
  },
  secrets: env,
});

// Load all configured providers
const across = await runtime.usePlugin("@data-provider/across", {
  variables: {
    baseUrl: process.env.ACROSS_BASE_URL || "https://app.across.to/api",
    timeout: Number(process.env.DATA_PROVIDER_TIMEOUT) || 10000,
  },
  secrets: {
    apiKey: "{{DATA_PROVIDER_API_KEY}}"
  },
});

// const axelar = await runtime.usePlugin("axelar", {
//   variables: {
//     baseUrl: process.env.AXELAR_BASE_URL || "https://api.axelarscan.io",
//     timeout: Number(process.env.DATA_PROVIDER_TIMEOUT) || 10000,
//   },
//   secrets: {
//     apiKey: "{{DATA_PROVIDER_API_KEY}}"
//   },
// });

// const cbridge = await runtime.usePlugin("cbridge", {
//   variables: {
//     baseUrl: process.env.CBRIDGE_BASE_URL || "https://cbridge-prod2.celer.app",
//     timeout: Number(process.env.DATA_PROVIDER_TIMEOUT) || 10000,
//   },
//   secrets: {
//     apiKey: "{{DATA_PROVIDER_API_KEY}}"
//   },
// });

// const cctp = await runtime.usePlugin("cctp", {
//   variables: {
//     baseUrl: process.env.CCTP_BASE_URL || "https://api.circle.com",
//     timeout: Number(process.env.DATA_PROVIDER_TIMEOUT) || 10000,
//   },
//   secrets: {
//     apiKey: "{{DATA_PROVIDER_API_KEY}}"
//   },
// });

// const debridge = await runtime.usePlugin("debridge", {
//   variables: {
//     baseUrl: process.env.DEBRIDGE_BASE_URL || "https://dln.debridge.finance/v1.0",
//     timeout: Number(process.env.DATA_PROVIDER_TIMEOUT) || 10000,
//   },
//   secrets: {
//     apiKey: "{{DATA_PROVIDER_API_KEY}}"
//   },
// });

// const layerzero = await runtime.usePlugin("layerzero", {
//   variables: {
//     baseUrl: process.env.LAYERZERO_BASE_URL || "https://api.layerzero.com",
//     timeout: Number(process.env.DATA_PROVIDER_TIMEOUT) || 10000,
//   },
//   secrets: {
//     apiKey: "{{DATA_PROVIDER_API_KEY}}"
//   },
// });

// const lifi = await runtime.usePlugin("lifi", {
//   variables: {
//     baseUrl: process.env.LIFI_BASE_URL || "https://li.quest/v1",
//     timeout: Number(process.env.DATA_PROVIDER_TIMEOUT) || 10000,
//   },
//   secrets: {
//     apiKey: "{{DATA_PROVIDER_API_KEY}}"
//   },
// });

// const wormhole = await runtime.usePlugin("wormhole", {
//   variables: {
//     baseUrl: process.env.WORMHOLE_BASE_URL || "https://api.wormholescan.io/api/v1",
//     timeout: Number(process.env.DATA_PROVIDER_TIMEOUT) || 10000,
//   },
//   secrets: {
//     apiKey: "{{DATA_PROVIDER_API_KEY}}"
//   },
// });

export const plugins = { across, 
  // axelar, cbridge, cctp, debridge, layerzero, lifi, wormhole 
} as const;

// if (typeof process !== 'undefined') {
//   process.once('SIGTERM', () => runtime.shutdown().then(() => process.exit(0)));
//   process.once('SIGINT', () => runtime.shutdown().then(() => process.exit(0)));
// }
