const fs = require("node:fs");
const path = require("node:path");
const { withDangerousMod } = require("@expo/config-plugins");

/**
 * Ensure androidx.core:core-splashscreen is added to app/build.gradle
 * so Theme.SplashScreen and windowSplashScreen* attrs are available.
 *
 * This runs during prebuild and patches android/app/build.gradle.
 */
function withCoreSplashscreenDependency(config) {
  return withDangerousMod(config, [
    "android",
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const appBuildGradlePath = path.join(
        projectRoot,
        "android",
        "app",
        "build.gradle",
      );

      let contents = await fs.promises.readFile(appBuildGradlePath, "utf8");

      // Avoid duplicating the dependency if prebuild runs multiple times.
      if (contents.includes("androidx.core:core-splashscreen")) {
        return config;
      }

      const marker =
        '    // The version of react-native is set by the React Native Gradle Plugin\n' +
        '    implementation("com.facebook.react:react-android")';

      if (!contents.includes(marker)) {
        return config;
      }

      contents = contents.replace(
        marker,
        `${marker}\n    implementation("androidx.core:core-splashscreen:1.0.1")`,
      );

      await fs.promises.writeFile(appBuildGradlePath, contents);
      return config;
    },
  ]);
}

module.exports = withCoreSplashscreenDependency;

