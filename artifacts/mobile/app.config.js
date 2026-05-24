const PRODUCTION_URL = "https://contractor-estimate-pro--gjshrock941.replit.app";
const devDomain = process.env.REPLIT_DEV_DOMAIN || process.env.EXPO_PUBLIC_DOMAIN || "";
const isProduction = process.env.NODE_ENV === "production";

const apiUrl = isProduction ? PRODUCTION_URL : devDomain ? `https://${devDomain}` : "";

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
      themeColor: "#0f2044",
      backgroundColor: "#0f2044",
      description:
        "AI-powered material and labor cost estimator for contractors. Describe any job and instantly get an itemized materials list with real Home Depot and Lowe's pricing, plus a labor estimate tailored to your experience level.",
      lang: "en",
    },
    plugins: [
      ["expo-router", { origin: PRODUCTION_URL }],
      "expo-font",
      "expo-web-browser",
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      apiUrl,
    },
  },
};
