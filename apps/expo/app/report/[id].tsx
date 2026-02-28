import type { Id } from "@venturai/backend/dataModel";
import { api } from "@venturai/backend";
import { useAction, useMutation } from "convex/react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
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
 * Report a problem flow - problem assessment.
 * Take photo of problem, enter details, submit.
 */
export default function ReportProblemScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const assetId = id as Id<"assets">;

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
  const createWithAI = useAction(api.assessments.actions.createWithAI);

  const handleSubmit = useCallback(async () => {
    if (!id || !photoUri) {
      Alert.alert("Photo required", "Please take a photo of the problem.");
      return;
    }

    setSubmitting(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const storageId = await uploadPhotoFromUri(photoUri, uploadUrl);

      const result = await createWithAI({
        assetId,
        intent: "problem",
        photoStorageIds: [storageId],
        photoDescriptions: ["Photo of the problem"],
        answers: {},
        notes: description || undefined,
      });

      const msg = buildAssessmentSuccessMessage(result.aiAnalysis);
      Alert.alert("Report submitted", msg, [
        { text: "OK", onPress: () => router.replace(`/a/${id}` as never) },
      ]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Submit failed";
      Alert.alert("Error", msg);
    } finally {
      setSubmitting(false);
    }
  }, [id, assetId, photoUri, description, generateUploadUrl, createWithAI, router]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Report a problem</Text>
      <Text style={styles.subtitle}>Asset {id}</Text>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Photo of problem</Text>
        <PhotoCaptureSlot
          label="Take a photo of the issue"
          value={photoUri}
          onCapture={setPhotoUri}
          onClear={() => setPhotoUri(null)}
          disabled={submitting}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Describe the issue</Text>
        <TextInput
          placeholder="What's wrong? When did you notice it?"
          placeholderTextColor={theme.textMuted}
          value={description}
          onChangeText={setDescription}
          multiline
          style={styles.input}
        />
      </View>

      <Pressable
        style={[styles.submitButton, (!photoUri || submitting) && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={!photoUri || submitting}
      >
        <Text style={styles.submitText}>
          {submitting ? "Submitting..." : "Submit report"}
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
  input: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 10,
    padding: 12,
    minHeight: 100,
    backgroundColor: theme.backgroundElevated,
    color: theme.text,
  },
  submitButton: {
    backgroundColor: theme.error,
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
