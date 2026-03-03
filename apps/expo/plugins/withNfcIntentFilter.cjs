const { withAndroidManifest } = require("@expo/config-plugins");

/**
 * Ensure NFC NDEF intent-filters exist for venturai://a/... and
 * https://venturai.app/a/... URIs, so scanning tags launches the app
 * instead of a generic NFC tool.
 */
function withNfcIntentFilter(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults;
    const app = manifest.manifest?.application?.[0];
    if (!app) return config;

    const activities = app.activity || [];
    const mainActivity = activities.find(
      (activity) => activity.$?.["android:name"] === ".MainActivity",
    );
    if (!mainActivity) return config;

    mainActivity["intent-filter"] = mainActivity["intent-filter"] || [];
    const filters = mainActivity["intent-filter"];

    const ensureNdefFilter = ({ scheme, host, pathPrefix }) => {
      const existing = filters.find((f) => {
        const hasAction =
          f.action &&
          f.action.some(
            (a) =>
              a.$?.["android:name"] ===
              "android.nfc.action.NDEF_DISCOVERED",
          );
        if (!hasAction) return false;

        const data = f.data || [];
        return data.some((d) => {
          const attrs = d.$ || {};
          if (attrs["android:scheme"] !== scheme) return false;
          if (host && attrs["android:host"] !== host) return false;
          if (pathPrefix && attrs["android:pathPrefix"] !== pathPrefix) {
            return false;
          }
          return true;
        });
      });

      if (existing) {
        return;
      }

      filters.push({
        action: [
          {
            $: {
              "android:name": "android.nfc.action.NDEF_DISCOVERED",
            },
          },
        ],
        category: [
          { $: { "android:name": "android.intent.category.DEFAULT" } },
        ],
        data: [
          {
            $: {
              "android:scheme": scheme,
              ...(host ? { "android:host": host } : {}),
              ...(pathPrefix ? { "android:pathPrefix": pathPrefix } : {}),
            },
          },
        ],
      });
    };

    ensureNdefFilter({ scheme: "venturai", host: "a", pathPrefix: "/" });
    ensureNdefFilter({
      scheme: "https",
      host: "venturai.app",
      pathPrefix: "/a/",
    });

    return config;
  });
}

module.exports = withNfcIntentFilter;

