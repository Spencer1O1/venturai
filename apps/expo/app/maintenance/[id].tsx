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
import { theme } from "../../lib/theme";
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

      Alert.alert(
        "Maintenance recorded",
        `${selectedIds.size} work item(s) marked as completed.`,
        [{ text: "OK", onPress: () => router.replace(`/a/${id}` as never) }],
      );
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
        <ActivityIndicator size="large" color={theme.accent} />
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
        placeholderTextColor={theme.textMuted}
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
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: theme.background,
  },
  centered: { justifyContent: "center", alignItems: "center" },
  title: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 4,
    color: theme.text,
  },
  subtitle: {
    fontSize: 14,
    color: theme.textMuted,
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    color: theme.textMuted,
  },
  emptyText: {
    fontSize: 14,
    color: theme.textMuted,
    marginBottom: 20,
  },
  list: { maxHeight: 220, marginBottom: 20 },
  workItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: theme.backgroundElevated,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  workItemSelected: {
    backgroundColor: theme.successBg,
    borderWidth: 2,
    borderColor: theme.success,
  },
  workItemContent: { flex: 1 },
  workItemTitle: { fontSize: 15, marginBottom: 4, color: theme.text },
  riskBadge: { fontSize: 12, color: theme.textMuted },
  checkbox: { fontSize: 18, color: theme.success, fontWeight: "600" },
  notesInput: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 10,
    padding: 12,
    minHeight: 80,
    marginBottom: 20,
    backgroundColor: theme.backgroundElevated,
    color: theme.text,
  },
  submitButton: {
    backgroundColor: theme.success,
    paddingVertical: theme.buttonPaddingVertical,
    paddingHorizontal: theme.buttonPaddingHorizontal,
    borderRadius: theme.buttonBorderRadius,
    alignItems: "center",
  },
  submitButtonDisabled: {
    backgroundColor: theme.buttonSecondary,
    borderWidth: 1,
    borderColor: theme.border,
    opacity: 0.7,
  },
  submitText: {
    color: theme.background,
    fontSize: theme.buttonFontSize,
    fontWeight: theme.buttonFontWeight,
  },
  backButton: {
    backgroundColor: theme.buttonSecondary,
    borderWidth: 1,
    borderColor: theme.border,
    paddingVertical: theme.buttonPaddingVertical,
    paddingHorizontal: theme.buttonPaddingHorizontal,
    borderRadius: theme.buttonBorderRadius,
    alignItems: "center",
    marginTop: 16,
  },
  buttonText: {
    color: theme.text,
    fontSize: theme.buttonFontSize,
    fontWeight: theme.buttonFontWeight,
  },
});
