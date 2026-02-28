import type { Id } from "@venturai/backend/dataModel";
import { api } from "@venturai/backend";
import { useQuery } from "convex/react";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

/**
 * Inspect flow - routine assessment.
 * Takes photos per template, answers additional questions, submits with notes.
 * TODO: Camera integration, storage upload, api.assessments.actions.createWithAI
 */
export default function InspectionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [notes, setNotes] = useState("");
  const template = useQuery(
    api.assets.queries.getTemplateForAsset,
    id ? { assetId: id as Id<"assets"> } : "skip",
  );
  const [answers, setAnswers] = useState<Record<string, string | number | boolean>>({});

  if (template === undefined) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const handleAnswerChange = (key: string, value: string | number | boolean) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Inspect</Text>
      <Text style={styles.subtitle}>Routine inspection for asset</Text>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Photos</Text>
        {template.photoDescriptions.map((desc, i) => (
          <View key={`${i}-${desc}`} style={styles.photoSlot}>
            <Text style={styles.photoLabel}>{i + 1}. {desc}</Text>
            <Text style={styles.placeholder}>Camera integration coming</Text>
          </View>
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
          value={notes}
          onChangeText={setNotes}
          multiline
          style={styles.input}
        />
      </View>

      <Pressable style={styles.submitButton}>
        <Text style={styles.submitText}>Submit inspection</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 20, fontWeight: "600", marginBottom: 4 },
  subtitle: { fontSize: 14, color: "#64748b", marginBottom: 24 },
  section: { marginBottom: 20 },
  sectionLabel: { fontSize: 14, fontWeight: "600", marginBottom: 8 },
  photoSlot: { marginBottom: 12 },
  photoLabel: { fontSize: 14, marginBottom: 4 },
  questionRow: { marginBottom: 12 },
  questionLabel: { fontSize: 14, marginBottom: 4 },
  placeholder: { fontSize: 14, color: "#94a3b8" },
  input: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    padding: 12,
    minHeight: 80,
  },
  submitButton: {
    backgroundColor: "#2563eb",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 12,
  },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
