const path = require("node:path");

// Use absolute paths so prebuild resolves images correctly (fixes monorepo path issues)
const projectRoot = __dirname;
const iconPath = path.resolve(projectRoot, "assets/images/icon.png");

// Plugin: copy icon to splashscreen_logo (required when splash image disabled)
const withSplashLogoDrawable = require("./plugins/withSplashLogoDrawable.cjs");

/** @type {import('expo/config').ExpoConfig} */
const config = {
  name: "Venturai",
  slug: "venturai",
  version: "1.0.0",
  orientation: "portrait",
  icon: iconPath,
  scheme: "venturai",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  ios: { supportsTablet: true },
  android: {
    adaptiveIcon: {
      foregroundImage: iconPath,
      backgroundColor: "#ffffff",
    },
    permissions: ["android.permission.NFC", "android.permission.RECORD_AUDIO"],
    package: "com.spencerls.venturai",
  },
  plugins: [
    "expo-router",
    [
      "react-native-nfc-manager",
      { nfcPermission: "Venturai uses NFC to register and read asset tags" },
    ],
    [
      "expo-image-picker",
      { cameraPermission: "Venturai needs camera access to photograph assets" },
    ],
    [
      "expo-splash-screen",
      {
        // Splash image disabled: Jimp "Could not find MIME for Buffer <null>" on Windows prebuild
        backgroundColor: "#ffffff",
      },
    ],
    [withSplashLogoDrawable, { iconPath }],
  ],
  experiments: { typedRoutes: true, reactCompiler: true },
  extra: {
    router: { origin: "https://venturai.app" },
    eas: { projectId: "template-project-id" },
  },
};

module.exports = config;
