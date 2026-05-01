const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Bundle audio assets alongside images/fonts.
config.resolver.assetExts = Array.from(new Set([
  ...(config.resolver.assetExts || []),
  'wav',
  'mp3',
  'm2a',
  'aac',
  'ogg',
]));

module.exports = config;
