import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { convexAuthStorage } from "../lib/convexAuthStorage";

const convex = new ConvexReactClient(
  process.env.EXPO_PUBLIC_CONVEX_URL ?? "https://placeholder.convex.cloud",
);

export default function RootLayout() {
  return (
    <ConvexAuthProvider client={convex} storage={convexAuthStorage}>
      <SafeAreaProvider>
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
