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

// High priority so we get NFC intents before Chrome intercepts https URLs
const NDEF_DISCOVERED_FILTER = {
  $: { "android:priority": "999" },
  action: [{ $: { "android:name": "android.nfc.action.NDEF_DISCOVERED" } }],
  category: [
    { $: { "android:name": "android.intent.category.DEFAULT" } },
    { $: { "android:name": "android.intent.category.BROWSABLE" } },
  ],
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

// App Links: when assetlinks.json is verified, Android opens app for venturai.app/a/* links
const APP_LINKS_VIEW_FILTER = {
  $: { "android:autoVerify": "true" },
  action: [{ $: { "android:name": "android.intent.action.VIEW" } }],
  category: [
    { $: { "android:name": "android.intent.category.DEFAULT" } },
    { $: { "android:name": "android.intent.category.BROWSABLE" } },
  ],
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
    mainActivity["intent-filter"].push(NDEF_DISCOVERED_FILTER);
    mainActivity["intent-filter"].push(APP_LINKS_VIEW_FILTER);
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
