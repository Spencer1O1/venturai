import { useQuery } from "convex/react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import type { Id } from "@venturai/backend/dataModel";
import { api } from "@venturai/backend";

/**
 * Asset dashboard - /a/<assetId>.
 * The NFC tag stores the asset URL (venturai.app/a/<assetId>); when scanned, this route loads the asset.
 */
export default function AssetDashboardScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const asset = useQuery(
    api.assets.queries.getById,
    id ? { assetId: id as Id<"assets"> } : "skip",
  );
  const adminOrgs = useQuery(api.org_members.getOrgsUserIsAdminOf);

  if (asset === undefined) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (asset === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Asset not found</Text>
        <Text style={styles.subtitle}>
          The tag may point to a deleted asset or be unprogrammed.
        </Text>
        {adminOrgs?.length ? (
          <Pressable
            style={styles.button}
            onPress={() => router.push("/register" as never)}
          >
            <Text style={styles.buttonText}>Register new asset</Text>
          </Pressable>
        ) : null}
        <Pressable style={[styles.button, styles.buttonSecondary]} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <AssetDashboardContent assetId={asset._id} asset={asset} router={router} />
  );
}

function AssetDashboardContent({
  assetId,
  asset,
  router,
}: {
  assetId: string;
  asset: { name: string };
  router: ReturnType<typeof useRouter>;
}) {
  const isMaintenanceWorker = true; // TODO: auth_helpers.isMaintenanceWorkerForAsset

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{asset.name}</Text>
      <Text style={styles.subtitle}>What would you like to do?</Text>

      <Pressable
        style={styles.button}
        onPress={() => router.push(`/inspection/${assetId}`)}
      >
        <Text style={styles.buttonTitle}>Inspect</Text>
        <Text style={styles.buttonHint}>
          Take photos, enter information, routine check
        </Text>
      </Pressable>

      <Pressable
        style={styles.button}
        onPress={() => router.push(`/report/${assetId}`)}
      >
        <Text style={styles.buttonTitle}>Report a problem</Text>
        <Text style={styles.buttonHint}>
          Take photo of problem, enter details
        </Text>
      </Pressable>

      {isMaintenanceWorker && (
        <>
          <Pressable
            style={[styles.button, styles.buttonMaintenance]}
            onPress={() =>
              router.push(`/maintenance/${assetId}` as Parameters<typeof router.push>[0])
            }
          >
            <Text style={styles.buttonTitle}>Report maintenance</Text>
            <Text style={styles.buttonHint}>
              Update status of work items, record work done
            </Text>
          </Pressable>

          <Pressable
            style={[styles.button, styles.buttonSecondary]}
            onPress={() =>
              router.push(`/view/${assetId}` as Parameters<typeof router.push>[0])
            }
          >
            <Text style={[styles.buttonTitle, styles.textSecondary]}>View</Text>
            <Text style={[styles.buttonHint, styles.textSecondary]}>
              See history and most recent report
            </Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  container: { flex: 1, padding: 24 },
  title: { fontSize: 22, fontWeight: "600", marginBottom: 4 },
  subtitle: { fontSize: 14, color: "#64748b", marginBottom: 24 },
  button: {
    backgroundColor: "#2563eb",
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  buttonMaintenance: { backgroundColor: "#059669" },
  buttonSecondary: { backgroundColor: "#64748b" },
  buttonTitle: { color: "#fff", fontSize: 16, fontWeight: "600" },
  buttonHint: { color: "rgba(255,255,255,0.85)", fontSize: 13, marginTop: 4 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  textSecondary: { color: "#fff" },
});
