/**
 * Add NFC intent filters and nfc_tech_filter.xml so that:
 * 1. NDEF_DISCOVERED: scanning venturai.app/a/* launches app (background/closed)
 * 2. TECH_DISCOVERED + nfc_tech_filter: declares app handles NDEF tags, helps
 *    suppress the system NFC modal when scanning in foreground (rn-nfc-manager #423)
 */
const fs = require("node:fs");
const path = require("node:path");
const {
  withAndroidManifest,
  withDangerousMod,
} = require("@expo/config-plugins");

const NFC_TECH_FILTER_XML = `<?xml version="1.0" encoding="utf-8"?>
<resources xmlns:xliff="urn:oasis:names:tc:xliff:document:1.2">
  <tech-list>
    <tech>android.nfc.tech.Ndef</tech>
  </tech-list>
  <tech-list>
    <tech>android.nfc.tech.NdefFormatable</tech>
  </tech-list>
</resources>
`;

// Custom scheme: only our app handles it, browser never intercepts
const NDEF_VENTURAI_FILTER = {
  action: [{ $: { "android:name": "android.nfc.action.NDEF_DISCOVERED" } }],
  category: [{ $: { "android:name": "android.intent.category.DEFAULT" } }],
  data: [
    {
      $: {
        "android:scheme": "venturai",
        "android:host": "a",
        "android:pathPrefix": "/",
      },
    },
  ],
};

// https fallback: for tags already written with web URL (browser may still intercept)
const NDEF_HTTPS_FILTER = {
  action: [{ $: { "android:name": "android.nfc.action.NDEF_DISCOVERED" } }],
  category: [{ $: { "android:name": "android.intent.category.DEFAULT" } }],
  data: [
    {
      $: {
        "android:scheme": "https",
        "android:host": "venturai.app",
        "android:pathPrefix": "/a/",
      },
    },
  ],
};

const TECH_DISCOVERED_FILTER = {
  action: [{ $: { "android:name": "android.nfc.action.TECH_DISCOVERED" } }],
  category: [{ $: { "android:name": "android.intent.category.DEFAULT" } }],
};

// meta-data must be activity child, NOT inside intent-filter (AAPT error)
const TECH_DISCOVERED_META = {
  $: {
    "android:name": "android.nfc.action.TECH_DISCOVERED",
    "android:resource": "@xml/nfc_tech_filter",
  },
};

function withNfcIntentFilter(c) {
  let config = withDangerousMod(c, [
    "android",
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const xmlDir = path.join(
        projectRoot,
        "android",
        "app",
        "src",
        "main",
        "res",
        "xml",
      );
      await fs.promises.mkdir(xmlDir, { recursive: true });
      await fs.promises.writeFile(
        path.join(xmlDir, "nfc_tech_filter.xml"),
        NFC_TECH_FILTER_XML,
      );
      return config;
    },
  ]);

  config = withAndroidManifest(config, (config) => {
    const { manifest } = config.modResults;
    const application = manifest.application?.[0];
    if (!application?.activity) return config;

    const mainActivity = application.activity.find(
      (a) => a.$?.["android:name"] === ".MainActivity",
    );
    if (!mainActivity) return config;

    if (!Array.isArray(mainActivity["intent-filter"])) {
      mainActivity["intent-filter"] = [];
    }
    mainActivity["intent-filter"].push(NDEF_VENTURAI_FILTER);
    mainActivity["intent-filter"].push(NDEF_HTTPS_FILTER);
    mainActivity["intent-filter"].push(TECH_DISCOVERED_FILTER);

    if (!Array.isArray(mainActivity["meta-data"])) {
      mainActivity["meta-data"] = [];
    }
    mainActivity["meta-data"].push(TECH_DISCOVERED_META);

    return config;
  });

  return config;
}

module.exports = withNfcIntentFilter;
