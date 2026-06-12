const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Required for @anthropic-ai/sdk package.json exports field
config.resolver.unstable_enablePackageExports = true;
config.resolver.unstable_conditionNames = ['require', 'default'];

// Resolve node: built-ins to empty shims
const emptyModule = require.resolve('./shims/empty.js');
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.startsWith('node:')) {
    return { type: 'sourceFile', filePath: emptyModule };
  }
  // Resolve @/ path alias
  if (moduleName.startsWith('@/')) {
    return {
      type: 'sourceFile',
      filePath: path.resolve(__dirname, moduleName.slice(2)),
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
