const { EveryPluginDevServer } = require('every-plugin/build/rspack');
const { withZephyr } = require('zephyr-rspack-plugin');

// Use Zephyr only when explicitly enabled (e.g., in CI or with ZEPHYR_ENABLED=true)
const useZephyr = process.env.ZEPHYR_ENABLED === 'true' || process.env.CI === 'true';

const baseConfig = {
  plugins: [new EveryPluginDevServer()],
};

module.exports = useZephyr ? withZephyr({
  hooks: {
    onDeployComplete: (info) => {
      console.log('🚀 Deployment Complete!');
      console.log(`   URL: ${info.url}`);
      console.log(`   Module: ${info.snapshot.uid.app_name}`);
      console.log(`   Build ID: ${info.snapshot.uid.build}`);
      console.log(`   Dependencies: ${info.federatedDependencies.length}`);
      console.log(`   Git: ${info.snapshot.git.branch}@${info.snapshot.git.commit}`);
      console.log(`   CI: ${info.buildStats.context.isCI ? 'Yes' : 'No'}`);
    },
  },
})(baseConfig) : baseConfig;
