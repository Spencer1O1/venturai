import { api } from "@venturai/backend";
import type { Id } from "@venturai/backend/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { PhotoListCapture } from "../../components/PhotoListCapture";
import { uploadPhotoFromUri } from "../../lib/uploadPhoto";

/**
 * Report maintenance - update work item status (maintenance workers only).
 * Select which work items were fixed, add optional after photos, notes, submit.
 */
export default function ReportMaintenanceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const assetId = id as Id<"assets">;

  const [selectedIds, setSelectedIds] = useState<Set<Id<"workItems">>>(
    new Set(),
  );
  const [afterPhotoUris, setAfterPhotoUris] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const asset = useQuery(api.assets.queries.getById, id ? { assetId } : "skip");
  const workItems = useQuery(
    api.work_items.listOpenByAsset,
    id ? { assetId } : "skip",
  );
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
  const createRecord = useMutation(api.maintenance_records.create);

  const toggle = useCallback((workItemId: Id<"workItems">) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(workItemId)) next.delete(workItemId);
      else next.add(workItemId);
      return next;
    });
  }, []);

  const submit = useCallback(async () => {
    if (!asset || selectedIds.size === 0) return;

    setSubmitting(true);
    try {
      const afterPhotoStorageIds: Id<"_storage">[] = [];
      for (const uri of afterPhotoUris) {
        const uploadUrl = await generateUploadUrl();
        const sid = await uploadPhotoFromUri(uri, uploadUrl);
        afterPhotoStorageIds.push(sid);
      }

      await createRecord({
        assetId,
        maintenanceGroupId: asset.maintenanceGroupId,
        closedWorkItemIds: Array.from(selectedIds),
        notes: notes || undefined,
        afterPhotoStorageIds:
          afterPhotoStorageIds.length > 0 ? afterPhotoStorageIds : undefined,
      });

      router.replace(`/a/${id}` as never);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Submit failed";
      Alert.alert("Error", msg);
    } finally {
      setSubmitting(false);
    }
  }, [
    asset,
    assetId,
    selectedIds,
    afterPhotoUris,
    notes,
    generateUploadUrl,
    createRecord,
    router,
    id,
  ]);

  if (asset === undefined || workItems === undefined) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (asset === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Asset not found</Text>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Report maintenance</Text>
      <Text style={styles.subtitle}>
        Select work items you completed, add optional photos, then submit
      </Text>

      <Text style={styles.sectionLabel}>Work items</Text>
      {workItems.length === 0 ? (
        <Text style={styles.emptyText}>No open work items for this asset.</Text>
      ) : (
        <View style={styles.list}>
          {workItems.map((item) => (
            <Pressable
              key={item._id}
              style={[
                styles.workItem,
                selectedIds.has(item._id) && styles.workItemSelected,
              ]}
              onPress={() => toggle(item._id)}
            >
              <View style={styles.workItemContent}>
                <Text style={styles.workItemTitle}>{item.title}</Text>
                <Text style={styles.riskBadge}>Risk: {item.riskValue}</Text>
              </View>
              <Text style={styles.checkbox}>
                {selectedIds.has(item._id) ? "✓" : ""}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      <Text style={styles.sectionLabel}>After photos (optional)</Text>
      <PhotoListCapture
        label="Document the work completed"
        photos={afterPhotoUris}
        onPhotosChange={setAfterPhotoUris}
        disabled={submitting}
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
          (selectedIds.size === 0 || submitting) && styles.submitButtonDisabled,
        ]}
        onPress={submit}
        disabled={selectedIds.size === 0 || submitting}
      >
        <Text style={styles.submitText}>
          {submitting
            ? "Submitting..."
            : `Submit (${selectedIds.size} item${selectedIds.size !== 1 ? "s" : ""} selected)`}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  centered: { justifyContent: "center", alignItems: "center" },
  title: { fontSize: 20, fontWeight: "600", marginBottom: 4 },
  subtitle: { fontSize: 14, color: "#64748b", marginBottom: 20 },
  sectionLabel: { fontSize: 14, fontWeight: "600", marginBottom: 8 },
  emptyText: { fontSize: 14, color: "#94a3b8", marginBottom: 20 },
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
  backButton: {
    backgroundColor: "#64748b",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
