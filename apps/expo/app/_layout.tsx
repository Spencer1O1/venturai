import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { api } from "@venturai/backend";
import { ConvexReactClient } from "convex/react";
import { useConvexAuth, useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { Stack } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import NfcManager, { NfcEvents } from "react-native-nfc-manager";

import { convexAuthStorage } from "../lib/convexAuthStorage";
import {
  getNfcLaunchDestination,
  parseUrlFromTagEvent,
  parseAssetIdFromUrl,
} from "../lib/nfc";

const convex = new ConvexReactClient(
  process.env.EXPO_PUBLIC_CONVEX_URL ?? "https://placeholder.convex.cloud",
);

function NfcLaunchHandler() {
  const router = useRouter();
  const [pendingDest, setPendingDest] = useState<
    string | "register" | null
  >(null);
  const handledRef = useRef(false);

  const { isLoading, isAuthenticated } = useConvexAuth();
  const adminOrgs = useQuery(
    api.org_members.getOrgsUserIsAdminOf,
    isAuthenticated ? {} : "skip",
  );

  const handleNfcTag = useCallback(
    (tag: { ndefMessage?: unknown[] }) => {
      const url = parseUrlFromTagEvent(tag as Parameters<typeof parseUrlFromTagEvent>[0]);
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
    console.log("[NFC Launch] NfcLaunchHandler mounted, Platform:", Platform.OS);
    if (Platform.OS !== "android") return;
    console.log("[NFC Launch] calling getNfcLaunchDestination...");
    getNfcLaunchDestination().then((dest) => {
      console.log("[NFC Launch] destination from tag", dest);
      if (dest) setPendingDest(dest);
    });
  }, []);

  useEffect(() => {
    if (Platform.OS !== "android") return;
    const onBackgroundTag = (tag: unknown) => {
      console.log("[NFC Launch] DiscoverBackgroundTag", tag);
      handleNfcTag(tag as { ndefMessage?: unknown[] });
    };
    NfcManager.setEventListener(NfcEvents.DiscoverBackgroundTag, onBackgroundTag);
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
  }, [
    pendingDest,
    isLoading,
    isAuthenticated,
    adminOrgs,
    router,
  ]);

  return null;
}

export default function RootLayout() {
  return (
    <ConvexAuthProvider client={convex} storage={convexAuthStorage}>
      <SafeAreaProvider>
        <NfcLaunchHandler />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: "#0f172a" },
            headerTintColor: "#ffffff",
          }}
        />
      </SafeAreaProvider>
    </ConvexAuthProvider>
  );
}
