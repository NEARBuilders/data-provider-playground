import { pluginModuleFederation } from "@module-federation/rsbuild-plugin";
import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";
import { pluginNodePolyfill } from "@rsbuild/plugin-node-polyfill";

const isDevelopment = process.env.NODE_ENV === "development";

// Base plugins needed in both dev and prod
const basePlugins = [
  pluginReact(),
  pluginModuleFederation({
    name: "profile",
    filename: "profile/remoteEntry.js",
    exposes: {
      "./Profile": "./src/components/Profile.tsx",
    },
    experiments: {
      federationRuntime: "hoisted",
    },
    shared: {
      react: { singleton: true, eager: true, requiredVersion: "^18.0.0" },
      "react-dom": {
        singleton: true,
        eager: true,
        requiredVersion: "^18.0.0",
      },
    },
  }),
];

// Add node polyfill only in development
if (isDevelopment) {
  basePlugins.push(pluginNodePolyfill());
}

export default defineConfig({
  html: {
    template: "./index.html",
  },
  server: {
    port: 5170,
  },
  output: {
    distPath: {
      root: "dist",
    },
  },
  source: {
    entry: {
      index: "./src/index.tsx",
    },
  },
  plugins: basePlugins,
});
