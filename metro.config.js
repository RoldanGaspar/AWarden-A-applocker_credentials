const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Support .wasm files required by expo-sqlite on web
config.resolver.assetExts.push('wasm');

module.exports = config;
