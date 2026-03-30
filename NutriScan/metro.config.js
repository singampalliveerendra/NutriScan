const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
};

config.resolver.sourceExts = [...config.resolver.sourceExts, 'cjs'];

config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

config.watchFolders = [...(config.watchFolders || [])];

module.exports = config;
