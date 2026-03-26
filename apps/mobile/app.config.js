/**
 * Single Expo config (no static app.json) so `expo-doctor` stays clean.
 * Default to Expo Go: opt into dev-client with EXPO_USE_DEV_CLIENT=1 or DEV_CLIENT=1.
 */
const base = {
  owner: "minhmice",
  name: "Thuocare",
  slug: "thuocare",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "mobile",
  userInterfaceStyle: "automatic",
  splash: {
    image: "./assets/images/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff",
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.thuocare.mobile",
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    package: "com.thuocare.mobile",
    adaptiveIcon: {
      backgroundColor: "#E6F4FE",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-dev-client",
    [
      "expo-router",
      {
        root: "./src/app",
      },
    ],
  ],
  experiments: {
    typedRoutes: false,
    reactCompiler: true,
  },
  extra: {
    eas: {
      projectId: "baae2482-21a7-494e-a338-dcb6a5694ff7",
    },
  },
};

module.exports = () => {
  const plugins = Array.isArray(base.plugins) ? base.plugins : [];
  const useDevClient =
    process.env.EXPO_USE_DEV_CLIENT === "1" || process.env.DEV_CLIENT === "1";
  const nextPlugins = useDevClient
    ? plugins
    : plugins.filter((p) => (Array.isArray(p) ? p[0] : p) !== "expo-dev-client");

  return {
    ...base,
    plugins: nextPlugins,
  };
};
