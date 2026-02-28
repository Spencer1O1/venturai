import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "@venturai/backend";
import { useConvexAuth, useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { theme } from "../lib/theme";

export default function HomeScreen() {
  const router = useRouter();
  const { isLoading, isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();
  const adminOrgs = useQuery(
    api.org_members.getOrgsUserIsAdminOf,
    isAuthenticated ? {} : "skip",
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>VENTURAI</Text>
      <Text style={styles.subtitle}>Asset Management</Text>

      <View style={styles.buttonRow}>
        <Pressable
          style={({ pressed }) => [
            styles.button,
            styles.scanButton,
            pressed && styles.scanButtonPressed,
          ]}
          onPress={() => router.push("/scan" as never)}
        >
          <Text style={[styles.buttonText, styles.buttonTextPrimary]}>
            Scan Data Dot
          </Text>
        </Pressable>
        <Text style={styles.hint}>
          Hold your phone near an asset tag to open its dashboard.
        </Text>

        {isAuthenticated ? (
          <>
            {adminOrgs && adminOrgs.length > 0 && (
              <Pressable
                style={({ pressed }) => [
                  styles.button,
                  styles.secondaryButton,
                  styles.secondaryButtonAccent,
                  pressed && styles.buttonPressed,
                ]}
                onPress={() => router.push("/register" as never)}
              >
                <Text style={[styles.buttonText, styles.buttonTextAccent]}>
                  Register new asset
                </Text>
              </Pressable>
            )}
            <Pressable
              style={({ pressed }) => [
                styles.button,
                styles.secondaryButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={async () => {
                await signOut();
              }}
            >
              <Text style={[styles.buttonText, styles.buttonTextSecondary]}>
                Sign out
              </Text>
            </Pressable>
          </>
        ) : (
          <Pressable
            style={({ pressed }) => [
              styles.button,
              styles.secondaryButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => router.push("/sign-in" as never)}
          >
            <Text style={[styles.buttonText, styles.buttonTextSecondary]}>
              Sign in (maintenance / admin)
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: theme.background,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 4,
    color: theme.text,
    letterSpacing: 2,
  },
  subtitle: { fontSize: 16, color: theme.textMuted, marginBottom: 40 },
  buttonRow: { width: "100%", maxWidth: 320 },
  button: {
    alignSelf: "stretch",
    paddingVertical: theme.buttonPaddingVertical,
    paddingHorizontal: theme.buttonPaddingHorizontal,
    borderRadius: theme.buttonBorderRadius,
    alignItems: "center",
    justifyContent: "center",
  },
  scanButton: {
    backgroundColor: theme.buttonPrimary,
    marginBottom: 12,
    shadowColor: theme.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  scanButtonPressed: { opacity: 0.9 },
  secondaryButton: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.backgroundElevated,
  },
  secondaryButtonAccent: {
    borderColor: theme.accent,
    backgroundColor: "transparent",
  },
  buttonPressed: { opacity: 0.8 },
  buttonText: {
    fontSize: theme.buttonFontSize,
    fontWeight: theme.buttonFontWeight,
  },
  buttonTextPrimary: { color: theme.background },
  buttonTextSecondary: { color: theme.textMuted },
  buttonTextAccent: { color: theme.accent },
  hint: {
    fontSize: 12,
    color: theme.textMuted,
    marginTop: 12,
    textAlign: "center",
  },
});
