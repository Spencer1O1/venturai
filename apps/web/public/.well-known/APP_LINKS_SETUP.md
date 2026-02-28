# Android App Links Setup

For NFC tags (and web links) to open the Venturai app instead of the browser:

1. **Get your app's SHA-256 fingerprint:**
   - Debug: `keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey` (password: `android`)
   - Release: Use your release keystore and alias

2. **Update** `assetlinks.json` in this folder: replace `REPLACE_WITH_SHA256_FINGERPRINT` with your fingerprint (colon-separated hex, e.g. `AB:CD:EF:12:34:...`).

3. **Deploy** so `https://venturai.app/.well-known/assetlinks.json` is live.

4. **Verify:** [Google's Statement List Tester](https://developers.google.com/digital-asset-links/tools/generator)

5. On device: Settings → Apps → Venturai → Open by default → Add link → venturai.app (enable).
