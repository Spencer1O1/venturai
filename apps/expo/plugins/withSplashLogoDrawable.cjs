/**
 * Copy app icon to splashscreen_logo drawable.
 * Required when expo-splash-screen has no image (avoids Jimp bug) but Android
 * styles still reference @drawable/splashscreen_logo.
 */
const fs = require("fs");
const path = require("path");
const { withDangerousMod } = require("@expo/config-plugins");

function withSplashLogoDrawable(config, { iconPath }) {
  return withDangerousMod(config, [
    "android",
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const drawableDir = path.join(
        projectRoot,
        "android",
        "app",
        "src",
        "main",
        "res",
        "drawable",
      );
      const destPath = path.join(drawableDir, "splashscreen_logo.png");

      await fs.promises.mkdir(drawableDir, { recursive: true });
      await fs.promises.copyFile(iconPath, destPath);

      return config;
    },
  ]);
}

module.exports = withSplashLogoDrawable;
