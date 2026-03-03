# EAS Build Setup for Venturai

## Monorepo (required for EAS)

- **Run all EAS commands from `apps/expo`**: e.g. `cd apps/expo` then `eas build ...`. Do not run `eas build` from the repo root.
- **Git at repo root**: The repository must have a single `.git` at the monorepo root (e.g. `venturai/.git`). If `.git` were inside `apps/expo`, EAS would not find `pnpm-lock.yaml` and would fail. Keep the repo as one git root.
- **`eas.json`** lives only in `apps/expo`. The root `eas.json` has been removed to match [Expo’s monorepo guidance](https://docs.expo.dev/build-reference/build-with-monorepos/).
- **`.easignore`** at the repo root controls what is excluded from the EAS upload. Do not exclude `pnpm-lock.yaml` or `pnpm-workspace.yaml`.

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

### 3. Build with EAS

From the repo root, you can use the helper script:

```bash
pnpm build:android
```

Or run EAS directly from the Expo app directory:

```bash
cd apps/expo
eas build --profile preview --platform android
```

## Debug vs Release APK

- **Release APK**: Use this one. It bundles the JS and works standalone. Requires `EXPO_PUBLIC_CONVEX_URL` (see above).
- **Debug APK**: Connects to Metro/dev tools. Not suitable for standalone use — it will hang without a dev server.

## Configuration in place

These are already configured; keep them when modifying the project:

- **Expo SDK 55**: The Expo app in `apps/expo` is on Expo SDK 55 with the matching `react` / `react-native` versions. Do not downgrade individual packages by hand; use `npx expo install --check --fix` if you need to realign versions.

- **`experiments.autolinkingModuleResolution`** in `app.config.js`: Aligns Metro with autolinking for monorepos. This is the default for SDK 55 and should stay enabled.

- **`withNfcIntentFilter` plugin** (`plugins/withNfcIntentFilter.cjs`): Ensures the Android manifest contains NFC `NDEF_DISCOVERED` intent filters for `venturai://a/...` and `https://venturai.app/a/...` so scanning a tag launches the app and routes into the correct screen. Keep this plugin so NFC tags continue to deep-link into the app.

## Troubleshooting

- **EAS build fails**:
  - Make sure you are on the latest EAS CLI version specified in `apps/expo/eas.json`.
  - From `apps/expo`, retry with:
    ```bash
    eas build --profile preview --platform android --clear-cache
    ```
  - If errors mention mismatched package versions, run:
    ```bash
    cd apps/expo
    npx expo install --check --fix
    ```
    then re-run `pnpm install` from the repo root.

- **NFC tag does not open the app**:
  - Confirm `withNfcIntentFilter` is present in `app.config.js` `plugins`.
  - Run `pnpm expo:prebuild` to re-apply manifest changes.
  - On the device, clear any “Open by default” settings for third-party NFC apps so Android will offer your app for `venturai://` tags.
