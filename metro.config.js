const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Metro resolves @react-native-async-storage/async-storage via package.json "react-native" →
// src/index.ts; some setups fail on that entry. Use the published CommonJS build instead.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === '@react-native-async-storage/async-storage') {
    return {
      type: 'sourceFile',
      filePath: require.resolve(
        '@react-native-async-storage/async-storage/lib/commonjs/index.js',
      ),
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
