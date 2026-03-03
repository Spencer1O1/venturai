const { withSettingsGradle } = require("@expo/config-plugins");

/**
 * Ensure Expo autolinking resolves native modules from the monorepo root
 * (repo-level node_modules) instead of apps/expo/android.
 *
 * This runs during prebuild and updates android/settings.gradle, so you
 * never have to edit files under android/ by hand.
 */
function withAutolinkingProjectRoot(config) {
  return withSettingsGradle(config, (config) => {
    let contents = config.modResults.contents;

    // Only modify projects that use the Expo autolinking settings plugin.
    if (!contents.includes('id("expo-autolinking-settings")')) {
      return config;
    }

    // Avoid duplicating the setting if prebuild runs multiple times.
    if (contents.includes("expoAutolinking.projectRoot")) {
      return config;
    }

    const pluginsBlock =
      "plugins {\n" +
      '  id("com.facebook.react.settings")\n' +
      '  id("expo-autolinking-settings")\n' +
      "}\n";

    if (contents.includes(pluginsBlock)) {
      contents = contents.replace(
        pluginsBlock,
        `${pluginsBlock}\n` +
          "// Monorepo: resolve native modules from repo root node_modules\n" +
          // biome-ignore lint/suspicious/noTemplateCurlyInString: Will be a groovy interpolation
          'expoAutolinking.projectRoot = file("${rootDir}/../../..")\n',
      );
    } else if (contents.includes("expoAutolinking.useExpoModules()")) {
      // Fallback: insert just before useExpoModules() if the plugins block shape ever changes.
      contents = contents.replace(
        "expoAutolinking.useExpoModules()",
        "// Monorepo: resolve native modules from repo root node_modules\n" +
          // biome-ignore lint/suspicious/noTemplateCurlyInString: Will be a groovy interpolation
          'expoAutolinking.projectRoot = file("${rootDir}/../../..")\n\n' +
          "expoAutolinking.useExpoModules()",
      );
    }

    config.modResults.contents = contents;
    return config;
  });
}

module.exports = withAutolinkingProjectRoot;
