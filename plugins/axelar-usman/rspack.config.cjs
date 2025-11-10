const { EveryPluginDevServer } = require('every-plugin/build/rspack');

module.exports = {
  plugins: [new EveryPluginDevServer()],
};
