const domain = process.env.REPLIT_DEV_DOMAIN || process.env.EXPO_PUBLIC_DOMAIN || "";

module.exports = {
  expo: {
    name: "Material Estimator",
    slug: "mobile",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "mobile",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    splash: {
      image: "./assets/images/icon.png",
      resizeMode: "contain",
      backgroundColor: "#0f2044",
    },
    ios: {
      supportsTablet: false,
      bundleIdentifier: "com.materialestimator.app",
      buildNumber: "1",
    },
    android: {},
    web: {
      favicon: "./assets/images/icon.png",
    },
    plugins: [
      ["expo-router", { origin: "https://replit.com/" }],
      "expo-font",
      "expo-web-browser",
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      apiUrl: domain ? `https://${domain}` : "",
    },
  },
};
