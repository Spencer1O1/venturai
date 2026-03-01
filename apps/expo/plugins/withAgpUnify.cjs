/**
 * Force all Android subprojects to use AGP 8.11.0 for variant matching.
 * Fixes "No variants exist" when native modules (gesture-handler, screens, etc.)
 * pin older AGP versions that don't match the root project.
 */
const fs = require("fs");
const path = require("path");
const { withDangerousMod } = require("@expo/config-plugins");

const AGP_UNIFY_BLOCK = `
// Force AGP 8.11.0 for all subprojects to fix "No variants exist" variant matching
subprojects { subproject ->
  subproject.buildscript.configurations.configureEach {
    resolutionStrategy.eachDependency { details ->
      if (details.requested.group == "com.android.tools.build" && details.requested.name == "gradle") {
        details.useVersion "8.11.0"
        details.because "Unify AGP for variant compatibility with Expo/RN"
      }
    }
  }
}
`;

function withAgpUnify(config) {
  return withDangerousMod(config, [
    "android",
    async (config) => {
      const buildGradlePath = path.join(
        config.modRequest.projectRoot,
        "android",
        "build.gradle",
      );
      let content = await fs.promises.readFile(buildGradlePath, "utf-8");

      if (content.includes("Unify AGP for variant compatibility")) {
        return config;
      }

      const insertPoint = content.indexOf("apply plugin: \"expo-root-project\"");
      if (insertPoint === -1) {
        return config;
      }

      content =
        content.slice(0, insertPoint) +
        AGP_UNIFY_BLOCK +
        "\n" +
        content.slice(insertPoint);

      await fs.promises.writeFile(buildGradlePath, content);
      return config;
    },
  ]);
}

module.exports = withAgpUnify;
