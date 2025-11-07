const path = require("node:path");
const fs = require("node:fs");
const { rspack } = require("@rspack/core");
// const { withZephyr } = require("zephyr-rspack-plugin");

const pkg = require("./package.json");

const { getNormalizedRemoteName } = require("every-plugin/normalize");

const everyPluginPkg = require("every-plugin/package.json");
const workspaceRoot = path.resolve(__dirname, "..", "..");
const bunModulesRoot = path.join(workspaceRoot, "node_modules/.bun/node_modules");
const bunStoreRoot = path.join(workspaceRoot, "node_modules/.bun");

function resolveVersion(pkgName, fallback) {
  try {
    return require(`${pkgName}/package.json`).version;
  } catch (error) {
    try {
      const pkgJson = require(path.join(bunModulesRoot, pkgName, "package.json"));
      return pkgJson.version;
    } catch {
      // ignore, try bun store
    }

    try {
      const sanitizedName = pkgName.replace(/\//g, "+");
      const candidates = fs
        .readdirSync(bunStoreRoot, { withFileTypes: true })
        .filter((entry) => entry.isDirectory() && entry.name.startsWith(`${sanitizedName}@`));
      for (const candidate of candidates) {
        const candidatePath = path.join(
          bunStoreRoot,
          candidate.name,
          "node_modules",
          pkgName,
          "package.json",
        );
        if (fs.existsSync(candidatePath)) {
          return require(candidatePath).version;
        }
      }
    } catch {
      // ignore, fallback below
    }

    if (fallback) {
      console.warn(
        `[mf] Falling back to declared version for ${pkgName}: ${fallback} (${error.message})`,
      );
      return fallback;
    }
    throw error;
  }
}

const effectVersion = resolveVersion("effect", everyPluginPkg.dependencies?.effect);
const zodVersion = resolveVersion("zod", everyPluginPkg.dependencies?.zod);
const orpcContractVersion = resolveVersion(
  "@orpc/contract",
  everyPluginPkg.dependencies?.["@orpc/contract"],
);
const orpcServerVersion = resolveVersion(
  "@orpc/server",
  everyPluginPkg.dependencies?.["@orpc/server"],
);

function getPluginInfo() {
  return {
    name: pkg.name,
    version: pkg.version,
    normalizedName: getNormalizedRemoteName(pkg.name),
    dependencies: pkg.dependencies || {},
    peerDependencies: pkg.peerDependencies || {},
  };
}

const pluginInfo = getPluginInfo();

// Temporary: withZephyr is commented out to avoid build issues
// module.exports = withZephyr({
//   hooks: {
//       onDeployComplete: (info) => {
//         console.log('🚀 Deployment Complete!');
//         console.log(`   URL: ${info.url}`);
//         console.log(`   Module: ${info.snapshot.uid.app_name}`);
//         console.log(`   Build ID: ${info.snapshot.uid.build}`);
//         console.log(`   Dependencies: ${info.federatedDependencies.length}`);
//         console.log(`   Git: ${info.snapshot.git.branch}@${info.snapshot.git.commit}`);
//         console.log(`   CI: ${info.buildStats.context.isCI ? 'Yes' : 'No'}`);
//       },
//     },
// })({
module.exports = {
  entry: "./src/index",
  mode: process.env.NODE_ENV === "development" ? "development" : "production",
  target: "async-node",
  devtool: "source-map",
  output: {
    uniqueName: pluginInfo.normalizedName,
    publicPath: "auto",
    path: path.resolve(__dirname, "dist"),
    clean: true,
    library: { type: "commonjs-module" },
  },
  devServer: {
    static: path.join(__dirname, "dist"),
    hot: true,
    port: 3014,
    devMiddleware: {
      writeToDisk: true,
    },
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "builtin:swc-loader",
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  plugins: [
    new rspack.container.ModuleFederationPlugin({
      name: pluginInfo.normalizedName,
      filename: "remoteEntry.js",
      runtimePlugins: [
        require.resolve("@module-federation/node/runtimePlugin"),
      ],
      library: { type: "commonjs-module" },
      exposes: {
        "./plugin": "./src/index.ts",
      },
      shared: {
        "every-plugin": {
          version: everyPluginPkg.version,
          singleton: true,
          requiredVersion: everyPluginPkg.version,
          strictVersion: false,
          eager: false,
        },
        effect: {
          version: effectVersion,
          singleton: true,
          requiredVersion: effectVersion,
          strictVersion: false,
          eager: false,
        },
        zod: {
          version: zodVersion,
          singleton: true,
          requiredVersion: zodVersion,
          strictVersion: false,
          eager: false,
        },
        "@orpc/contract": {
          version: orpcContractVersion,
          singleton: true,
          requiredVersion: orpcContractVersion,
          strictVersion: false,
          eager: false,
        },
        "@orpc/server": {
          version: orpcServerVersion,
          singleton: true,
          requiredVersion: orpcServerVersion,
          strictVersion: false,
          eager: false,
        },
      },
    }),
  ],
};
