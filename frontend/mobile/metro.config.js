const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const defaultConfig = getDefaultConfig(projectRoot);

// Keep a reference to the original resolver
const originalResolveRequest = defaultConfig.resolver.resolveRequest;

defaultConfig.resolver.resolveRequest = (context, moduleName, platform) => {
  // Redirect react-native-maps to a lightweight web shim when bundling for web
  if (moduleName === 'react-native-maps' && platform === 'web') {
    return {
      filePath: path.resolve(projectRoot, 'web-mocks', 'react-native-maps.js'),
      type: 'sourceFile',
    };
  }

  // Fallback to the original resolver
  return originalResolveRequest
    ? originalResolveRequest(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform);
};

module.exports = defaultConfig;
