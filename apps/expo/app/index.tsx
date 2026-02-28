import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "@venturai/backend";
import { useConvexAuth, useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

/** Placeholder for "Scan NFC Tag" when no real NFC - use a real asset ID from seed for testing */
const DEMO_ASSET_ID = "demo";

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
      <Text style={styles.title}>Venturai</Text>
      <Text style={styles.subtitle}>Asset Management</Text>

      <Pressable
        style={styles.scanButton}
        onPress={() =>
          router.push({
            pathname: "/a/[id]",
            params: { id: DEMO_ASSET_ID },
          })
        }
      >
        <Text style={styles.scanText}>Scan NFC Tag</Text>
      </Pressable>
      <Text style={styles.hint}>
        For now, this opens a demo asset. Real NFC deep links to /a/[id].
      </Text>

      {isAuthenticated ? (
        <>
          {adminOrgs && adminOrgs.length > 0 && (
            <Pressable
              style={[styles.signInButton, styles.registerButton]}
              onPress={() => router.push("/register" as never)}
            >
              <Text style={[styles.signInText, styles.registerText]}>
                Register new asset
              </Text>
            </Pressable>
          )}
          <Pressable
            style={styles.signInButton}
            onPress={async () => {
              await signOut();
            }}
          >
            <Text style={styles.signInText}>Sign out</Text>
          </Pressable>
        </>
      ) : (
        <Pressable
          style={styles.signInButton}
          onPress={() => router.push("/sign-in" as never)}
        >
          <Text style={styles.signInText}>Sign in (maintenance / admin)</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  title: { fontSize: 28, fontWeight: "700", marginBottom: 4 },
  subtitle: { fontSize: 16, color: "#64748b", marginBottom: 40 },
  scanButton: {
    backgroundColor: "#1e40af",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  scanText: { color: "#fff", fontSize: 18 },
  hint: { fontSize: 12, color: "#94a3b8", marginTop: 12, textAlign: "center" },
  signInButton: {
    marginTop: 32,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
  },
  signInText: { fontSize: 14, color: "#64748b" },
  registerButton: {
    borderColor: "#2563eb",
    backgroundColor: "transparent",
  },
  registerText: { color: "#60a5fa" },
});
