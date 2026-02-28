import type { Id } from "@venturai/backend/dataModel";
import { api } from "@venturai/backend";
import { useAction, useMutation, useQuery } from "convex/react";
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

import { PhotoCaptureSlot } from "../../components/PhotoCaptureSlot";
import { buildAssessmentSuccessMessage } from "../../lib/assessmentSuccessMessage";
import { theme } from "../../lib/theme";
import { uploadPhotoFromUri } from "../../lib/uploadPhoto";

/**
 * Inspect flow - routine assessment.
 * Takes photos per template, answers additional questions, submits with notes.
 */
export default function InspectionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const assetId = id as Id<"assets">;

  const [notes, setNotes] = useState("");
  const [photoUris, setPhotoUris] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string | number | boolean>>({});

  const template = useQuery(
    api.assets.queries.getTemplateForAsset,
    id ? { assetId } : "skip",
  );
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
  const createWithAI = useAction(api.assessments.actions.createWithAI);

  const setPhoto = useCallback((index: number, uri: string | null) => {
    setPhotoUris((prev) => {
      const next = [...prev];
      while (next.length <= index) next.push("");
      next[index] = uri ?? "";
      return next;
    });
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!id || !template) return;
    const requiredCount = template.photoDescriptions.length;
    const validUris = photoUris.slice(0, requiredCount).filter(Boolean);
    if (validUris.length < requiredCount) {
      Alert.alert(
        "Photos required",
        `Please take ${requiredCount} photo(s): ${template.photoDescriptions.join(", ")}`,
      );
      return;
    }

    setSubmitting(true);
    try {
      const storageIds: Id<"_storage">[] = [];
      for (const uri of validUris) {
        const uploadUrl = await generateUploadUrl();
        const sid = await uploadPhotoFromUri(uri, uploadUrl);
        storageIds.push(sid);
      }

      const result = await createWithAI({
        assetId,
        intent: "routine",
        photoStorageIds: storageIds,
        photoDescriptions: template.photoDescriptions,
        answers,
        notes: notes || undefined,
      });

      const msg = buildAssessmentSuccessMessage(result.aiAnalysis);
      Alert.alert("Assessment submitted", msg, [
        { text: "OK", onPress: () => router.replace(`/a/${id}` as never) },
      ]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Submit failed";
      Alert.alert("Error", msg);
    } finally {
      setSubmitting(false);
    }
  }, [
    id,
    assetId,
    template,
    photoUris,
    answers,
    notes,
    generateUploadUrl,
    createWithAI,
    router,
  ]);

  if (template === undefined) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  const handleAnswerChange = (key: string, value: string | number | boolean) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  const requiredCount = template.photoDescriptions.length;
  const hasAllPhotos =
    photoUris.slice(0, requiredCount).filter(Boolean).length >= requiredCount;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Inspect</Text>
      <Text style={styles.subtitle}>Routine inspection for asset</Text>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Photos</Text>
        {template.photoDescriptions.map((desc, i) => (
          <PhotoCaptureSlot
            key={`${i}-${desc}`}
            label={`${i + 1}. ${desc}`}
            value={photoUris[i] || null}
            onCapture={(uri) => setPhoto(i, uri)}
            onClear={() => setPhoto(i, null)}
            disabled={submitting}
          />
        ))}
      </View>

      {template.additionalQuestions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Additional questions</Text>
          {template.additionalQuestions.map((q) => (
            <View key={q.key} style={styles.questionRow}>
              <Text style={styles.questionLabel}>{q.label}</Text>
              <TextInput
                placeholder={q.type === "text" ? "Enter..." : String(q.type)}
                placeholderTextColor={theme.textMuted}
                value={String(answers[q.key] ?? "")}
                onChangeText={(v) => handleAnswerChange(q.key, v)}
                style={styles.input}
              />
            </View>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Notes (optional)</Text>
        <TextInput
          placeholder="Additional observations..."
          placeholderTextColor={theme.textMuted}
          value={notes}
          onChangeText={setNotes}
          multiline
          style={styles.input}
        />
      </View>

      <Pressable
        style={[styles.submitButton, (!hasAllPhotos || submitting) && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={!hasAllPhotos || submitting}
      >
        <Text style={styles.submitText}>
          {submitting ? "Submitting..." : "Submit inspection"}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: theme.background,
  },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 4,
    color: theme.text,
  },
  subtitle: {
    fontSize: 14,
    color: theme.textMuted,
    marginBottom: 24,
  },
  section: { marginBottom: 20 },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    color: theme.textMuted,
  },
  photoSlot: { marginBottom: 12 },
  photoLabel: { fontSize: 14, marginBottom: 4, color: theme.text },
  questionRow: { marginBottom: 12 },
  questionLabel: { fontSize: 14, marginBottom: 4, color: theme.text },
  placeholder: { fontSize: 14, color: theme.textMuted },
  input: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 10,
    padding: 12,
    minHeight: 80,
    backgroundColor: theme.backgroundElevated,
    color: theme.text,
  },
  submitButton: {
    backgroundColor: theme.buttonPrimary,
    paddingVertical: theme.buttonPaddingVertical,
    paddingHorizontal: theme.buttonPaddingHorizontal,
    borderRadius: theme.buttonBorderRadius,
    alignItems: "center",
    marginTop: 12,
  },
  submitButtonDisabled: { opacity: 0.6 },
  submitText: {
    color: theme.background,
    fontSize: theme.buttonFontSize,
    fontWeight: theme.buttonFontWeight,
  },
});
