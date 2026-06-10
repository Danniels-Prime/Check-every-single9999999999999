const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver.unstable_enablePackageExports = true;
config.resolver.unstable_conditionNames = ['require', 'default'];

// Shim Node.js built-ins (node:fs, node:path, etc.) that the Anthropic SDK
// references but are not available in the React Native runtime.
const emptyShim = path.resolve(__dirname, 'shims/empty.js');
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.startsWith('node:')) {
    return { type: 'sourceFile', filePath: emptyShim };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
