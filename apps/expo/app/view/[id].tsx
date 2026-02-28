import { useLocalSearchParams } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";

/**
 * View history and most recent report (maintenance workers).
 * TODO: Wire to Convex - assessments.listByAsset, workItems.listOpenByAsset
 */
export default function ViewHistoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Asset History</Text>
      <Text style={styles.assetId}>Asset ID: {id}</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Most recent report</Text>
        <Text style={styles.placeholder}>
          Will show latest assessment summary when Convex is wired
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Assessment history</Text>
        <Text style={styles.placeholder}>
          Timeline of inspections and problem reports
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  title: { fontSize: 20, fontWeight: "600", marginBottom: 8 },
  assetId: { fontSize: 14, color: "#64748b", marginBottom: 24 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: "600", marginBottom: 8 },
  placeholder: { fontSize: 14, color: "#94a3b8" },
});
