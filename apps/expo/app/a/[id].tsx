import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

/**
 * Asset dashboard - NFC deep link route /a/<assetId>.
 * Flows:
 * - Inspect: routine assessment (photos, info)
 * - Report a problem: problem assessment (photo of issue, info)
 * - Report maintenance: maintenance workers only - update work item status
 * - View: maintenance workers only - history and most recent report
 *
 * TODO: Role check - only show Report maintenance & View to users registered
 * as maintenance workers in this asset's maintenance group.
 */
export default function AssetDashboard() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const isMaintenanceWorker = true; // TODO: fetch from auth / maintenance group membership

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Asset</Text>
      <Text style={styles.subtitle}>What would you like to do?</Text>

      <Pressable
        style={styles.button}
        onPress={() => router.push(`/inspection/${id}`)}
      >
        <Text style={styles.buttonTitle}>Inspect</Text>
        <Text style={styles.buttonHint}>
          Take photos, enter information, routine check
        </Text>
      </Pressable>

      <Pressable
        style={styles.button}
        onPress={() => router.push(`/report/${id}`)}
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
              router.push(
                `/maintenance/${id}` as Parameters<typeof router.push>[0],
              )
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
              router.push(`/view/${id}` as Parameters<typeof router.push>[0])
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
  textSecondary: { color: "#fff" },
});
