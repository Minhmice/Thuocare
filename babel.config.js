module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    // reanimated plugin must be last. expo-router/babel is included in babel-preset-expo (SDK 50+).
    plugins: ["react-native-reanimated/plugin"]
  };
};
