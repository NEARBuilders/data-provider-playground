// Stub for zephyr-rspack-plugin (for local development)
// The actual zephyr plugin is used for CDN deployment
// For local dev, we just pass through the config

module.exports = {
  withZephyr: (options) => (config) => config
};
