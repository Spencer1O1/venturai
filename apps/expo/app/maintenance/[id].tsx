import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

/**
 * Report maintenance - update work item status (maintenance workers only).
 * Select which work items were fixed, add notes, submit.
 * TODO: Wire to Convex - workItems.listOpenByAsset, maintenanceRecords.create
 */
const mockWorkItems = [
  { id: "1", title: "Hydraulic leak - replace seal", riskValue: 45 },
  { id: "2", title: "Sensor calibration needed", riskValue: 25 },
];

export default function ReportMaintenanceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState("");

  const toggle = (workItemId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(workItemId)) next.delete(workItemId);
      else next.add(workItemId);
      return next;
    });
  };

  const submit = () => {
    // TODO: maintenanceRecords.create({ assetId, closedWorkItemIds: [...selectedIds], notes })
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Report maintenance</Text>
      <Text style={styles.subtitle}>
        Select work items you completed, add notes, then submit
      </Text>

      <Text style={styles.sectionLabel}>Work items</Text>
      <FlatList
        data={mockWorkItems}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            style={[
              styles.workItem,
              selectedIds.has(item.id) && styles.workItemSelected,
            ]}
            onPress={() => toggle(item.id)}
          >
            <View style={styles.workItemContent}>
              <Text style={styles.workItemTitle}>{item.title}</Text>
              <Text style={styles.riskBadge}>Risk: {item.riskValue}</Text>
            </View>
            <Text style={styles.checkbox}>
              {selectedIds.has(item.id) ? "✓" : ""}
            </Text>
          </Pressable>
        )}
        style={styles.list}
      />

      <Text style={styles.sectionLabel}>Notes (optional)</Text>
      <TextInput
        placeholder="What was done? Parts replaced? Time spent?"
        value={notes}
        onChangeText={setNotes}
        multiline
        style={styles.notesInput}
      />

      <Pressable
        style={[
          styles.submitButton,
          selectedIds.size === 0 && styles.submitButtonDisabled,
        ]}
        onPress={submit}
        disabled={selectedIds.size === 0}
      >
        <Text style={styles.submitText}>
          Submit ({selectedIds.size} item{selectedIds.size !== 1 ? "s" : ""}{" "}
          selected)
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  title: { fontSize: 20, fontWeight: "600", marginBottom: 4 },
  subtitle: { fontSize: 14, color: "#64748b", marginBottom: 20 },
  sectionLabel: { fontSize: 14, fontWeight: "600", marginBottom: 8 },
  list: { maxHeight: 220, marginBottom: 20 },
  workItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#f1f5f9",
    borderRadius: 8,
    marginBottom: 8,
  },
  workItemSelected: {
    backgroundColor: "#d1fae5",
    borderWidth: 2,
    borderColor: "#059669",
  },
  workItemContent: { flex: 1 },
  workItemTitle: { fontSize: 15, marginBottom: 4 },
  riskBadge: { fontSize: 12, color: "#64748b" },
  checkbox: { fontSize: 18, color: "#059669", fontWeight: "600" },
  notesInput: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    padding: 12,
    minHeight: 80,
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: "#059669",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  submitButtonDisabled: { backgroundColor: "#94a3b8", opacity: 0.7 },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
