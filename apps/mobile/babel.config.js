module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Reanimated 4 moved its babel plugin into react-native-worklets.
    // It rewrites worklet functions, so it must stay last in the list.
    plugins: ['react-native-worklets/plugin'],
  };
};
