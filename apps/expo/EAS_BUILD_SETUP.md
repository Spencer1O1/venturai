# EAS Build Setup for Venturai

## Convex URL (Required)

The app needs your Convex deployment URL at build time. Without it, the release APK will show a config error and sign-in will hang.

### 1. Get your Convex URL

From your project root, run:
```bash
npx convex dashboard
```
In the dashboard, go to Settings → the URL is shown there (e.g. `https://happy-animal-123.convex.cloud`).

Or check your `.env.local` or `.env` — it's the value of `CONVEX_URL`.

### 2. Add it as an EAS environment variable

From the **apps/expo** directory:

```bash
cd apps/expo
eas env:create --name EXPO_PUBLIC_CONVEX_URL --value "https://YOUR_DEPLOYMENT.convex.cloud" --environment preview --visibility plaintext
```

Or for all environments (preview + production):

```bash
eas env:create --name EXPO_PUBLIC_CONVEX_URL --value "https://YOUR_DEPLOYMENT.convex.cloud" --environment all --visibility plaintext
```

Replace `YOUR_DEPLOYMENT` with your actual Convex deployment name. Use `plaintext` visibility since this URL is bundled into the app (not sensitive).

### 3. Rebuild the APK

```bash
pnpm build:apk
# or: eas build --profile preview --platform android
```

## Debug vs Release APK

- **Release APK**: Use this one. It bundles the JS and works standalone. Requires `EXPO_PUBLIC_CONVEX_URL` (see above).
- **Debug APK**: Connects to Metro/dev tools. Not suitable for standalone use — it will hang without a dev server.

## Configuration in place

These are already configured; keep them when modifying the project:

- **`withAgpUnify` plugin** (`plugins/withAgpUnify.cjs`): Forces all native modules (gesture-handler, screens, safe-area-context, nfc-manager) to use AGP 8.11.0, matching the root project. Required because those modules pin older AGP versions, which causes "No variants exist" during Gradle resolution. Do not remove this plugin.

- **`experiments.autolinkingModuleResolution`** in `app.config.js`: Aligns Metro with autolinking for monorepos. Required with `nodeLinker: hoisted` in `pnpm-workspace.yaml`.

## Troubleshooting

### "No matching variant" / "No variants exist" for native modules

If the build fails with:

```
Could not resolve project :react-native-gesture-handler.
> No matching variant of project :react-native-gesture-handler was found...
  - No variants exist.
```

The project already uses the `withAgpUnify` plugin to fix this. If it recurs:

1. **Clear the EAS build cache**:
   ```bash
   cd apps/expo
   eas build --profile preview --platform android --clear-cache
   ```

2. **Verify the plugin is active**: Ensure `withAgpUnify` is in `app.config.js` plugins and that `android/build.gradle` (after prebuild) contains the "Force AGP 8.11.0 for all subprojects" block.

3. **Check for duplicate native modules**: Run `pnpm why react-native-safe-area-context` (and similar) from the repo root. Deduplicate any duplicates.

4. **Try a local build** to isolate cloud vs. environment:
   ```bash
   cd apps/expo
   eas build --profile preview --platform android --local
   ```

5. If the issue persists, it may be an EAS/Expo infrastructure change (e.g. [expo/expo#42729](https://github.com/expo/expo/issues/42729)). Check [Expo Discord](https://chat.expo.dev) and [expo/expo issues](https://github.com/expo/expo/issues) for updates.
