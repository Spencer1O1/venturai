import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { api } from "@venturai/backend";
import { ConvexReactClient, useConvexAuth, useQuery } from "convex/react";
import * as Linking from "expo-linking";
import { Stack, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Platform, StatusBar, Text, View } from "react-native";
import NfcManager, { NfcEvents } from "react-native-nfc-manager";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { convexAuthStorage } from "../lib/convexAuthStorage";
import {
  getNfcLaunchDestination,
  parseAssetIdFromUrl,
  parseUrlFromTagEvent,
} from "../lib/nfc";
import { theme } from "../lib/theme";

const CONVEX_URL =
  process.env.EXPO_PUBLIC_CONVEX_URL ?? "https://placeholder.convex.cloud";

const convex = new ConvexReactClient(CONVEX_URL);

/** Route name → header title. Dynamic routes use [id] pattern. */
const ROUTE_TITLES: Record<string, string> = {
  index: "VENTURAI",
  "sign-in": "Sign In",
  scan: "Scan",
  register: "Register Asset",
  "register/index": "Register",
  "a/[id]": "Asset Interface",
  "inspection/[id]": "Inspection",
  "report/[id]": "Report",
  "maintenance/[id]": "Maintenance",
  "view/[id]": "Asset View",
};

function getHeaderTitle(routeName: string): string {
  const exact = ROUTE_TITLES[routeName];
  if (exact) return exact;
  // Fallback: format segment names (e.g. "sign-in" → "Sign In")
  return (
    routeName
      .replace(/\[.*?\]/g, "")
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim() || "VENTURAI"
  );
}

function NfcLaunchHandler() {
  const router = useRouter();
  const [pendingDest, setPendingDest] = useState<string | "register" | null>(
    null,
  );
  const handledRef = useRef(false);

  const { isLoading, isAuthenticated } = useConvexAuth();
  const adminOrgs = useQuery(
    api.org_members.getOrgsUserIsAdminOf,
    isAuthenticated ? {} : "skip",
  );

  const handleNfcTag = useCallback(
    (tag: { ndefMessage?: unknown[] }) => {
      const url = parseUrlFromTagEvent(
        tag as Parameters<typeof parseUrlFromTagEvent>[0],
      );
      const assetId = url ? parseAssetIdFromUrl(url) : null;
      if (assetId) {
        router.replace(`/a/${assetId}` as never);
      } else if (isAuthenticated && adminOrgs && adminOrgs.length > 0) {
        router.replace("/register" as never);
      }
    },
    [router, isAuthenticated, adminOrgs],
  );

  useEffect(() => {
    console.log(
      "[NFC Launch] NfcLaunchHandler mounted, Platform:",
      Platform.OS,
    );
    if (Platform.OS !== "android") return;
    const resolveLaunch = async () => {
      const nfcDest = await getNfcLaunchDestination();
      console.log("[NFC Launch] destination from NFC tag", nfcDest);
      if (nfcDest) {
        setPendingDest(nfcDest);
        return;
      }
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        const assetId = parseAssetIdFromUrl(initialUrl);
        if (assetId) {
          console.log("[NFC Launch] destination from VIEW intent", assetId);
          setPendingDest(assetId);
        }
      }
    };
    resolveLaunch();
  }, []);

  useEffect(() => {
    if (Platform.OS !== "android") return;
    const onBackgroundTag = (tag: unknown) => {
      console.log("[NFC Launch] DiscoverBackgroundTag", tag);
      handleNfcTag(tag as { ndefMessage?: unknown[] });
    };
    NfcManager.setEventListener(
      NfcEvents.DiscoverBackgroundTag,
      onBackgroundTag,
    );
    return () => {
      NfcManager.setEventListener(NfcEvents.DiscoverBackgroundTag, null);
    };
  }, [handleNfcTag]);

  useEffect(() => {
    const log = (msg: string, data?: unknown) =>
      console.log("[NFC Launch] handler", msg, data ?? "");
    if (!pendingDest || handledRef.current) return;

    if (pendingDest !== "register") {
      log("navigating to asset", pendingDest);
      handledRef.current = true;
      setPendingDest(null);
      router.replace(`/a/${pendingDest}` as never);
      return;
    }

    log("register case - checking auth", {
      isLoading,
      isAuthenticated,
      adminOrgsLen: adminOrgs?.length,
      adminOrgsUndefined: adminOrgs === undefined,
    });
    if (isLoading) return;
    if (!isAuthenticated) {
      log("skipping - not authenticated");
      handledRef.current = true;
      setPendingDest(null);
      return;
    }
    if (adminOrgs === undefined) return;
    handledRef.current = true;
    setPendingDest(null);
    if (adminOrgs.length > 0) {
      log("navigating to register");
      router.replace("/register" as never);
    } else {
      log("skipping - no orgs");
    }
  }, [pendingDest, isLoading, isAuthenticated, adminOrgs, router]);

  return null;
}

function ConfigErrorScreen() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
        backgroundColor: theme.background,
      }}
    >
      <Text
        style={{
          fontSize: 18,
          fontWeight: "600",
          color: theme.text,
          marginBottom: 12,
          textAlign: "center",
        }}
      >
        Convex URL not configured
      </Text>
      <Text
        style={{
          fontSize: 14,
          color: theme.textMuted,
          textAlign: "center",
          lineHeight: 22,
        }}
      >
        This build was created without EXPO_PUBLIC_CONVEX_URL. Run this from
        apps/expo, then rebuild:{"\n\n"}
        eas env:create --name EXPO_PUBLIC_CONVEX_URL --value
        "https://YOUR_DEPLOYMENT.convex.cloud" --environment preview --visibility plaintext
      </Text>
    </View>
  );
}

export default function RootLayout() {
  if (CONVEX_URL.includes("placeholder")) {
    return (
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" backgroundColor={theme.background} />
        <ConfigErrorScreen />
      </SafeAreaProvider>
    );
  }

  return (
    <ConvexAuthProvider client={convex} storage={convexAuthStorage}>
      <SafeAreaProvider>
        <StatusBar
          barStyle="light-content"
          backgroundColor={theme.background}
        />
        <NfcLaunchHandler />
        <Stack
          screenOptions={({ route }) => ({
            title: getHeaderTitle(route.name),
            headerStyle: { backgroundColor: theme.background },
            headerTintColor: theme.text,
            headerShadowVisible: false,
            contentStyle: { backgroundColor: theme.background },
          })}
        />
      </SafeAreaProvider>
    </ConvexAuthProvider>
  );
}
