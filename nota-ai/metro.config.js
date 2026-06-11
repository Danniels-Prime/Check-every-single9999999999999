const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver.unstable_enablePackageExports = true;
config.resolver.unstable_conditionNames = ['require', 'default'];

const emptyShim = path.resolve(__dirname, 'shims/empty.js');
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.startsWith('node:')) {
    return { type: 'sourceFile', filePath: emptyShim };
  }
  // Resolve @/* path aliases to project root (matches tsconfig paths).
  // react-native bundle (community CLI) doesn't run babel-preset-expo's
  // module-resolver transform before Metro resolves, so we handle it here.
  if (moduleName.startsWith('@/')) {
    const resolved = path.resolve(__dirname, moduleName.slice(2));
    return context.resolveRequest(context, resolved, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
