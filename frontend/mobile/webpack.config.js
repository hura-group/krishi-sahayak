const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const path = require('path');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);

  config.resolve = config.resolve || {};
  config.resolve.alias = Object.assign({}, config.resolve.alias, {
    // Use a lightweight web shim for react-native-maps to avoid native imports on web
    'react-native-maps': path.resolve(__dirname, 'web-mocks', 'react-native-maps.js'),
  });

  return config;
};
