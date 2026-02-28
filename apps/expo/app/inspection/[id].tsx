import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

/**
 * Inspect flow - routine assessment.
 * Take photos (from template), enter information, submit.
 * TODO: Wire to Convex - templates.getById, storage upload, api.assessments.actions.createWithAI
 */
export default function InspectionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [notes, setNotes] = useState("");

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Inspect</Text>
      <Text style={styles.subtitle}>Routine inspection for asset {id}</Text>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Photos</Text>
        <Text style={styles.placeholder}>
          Take photos per template (wide shot, close-ups) – camera integration
          coming
        </Text>
      </View>

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
  title: { fontSize: 20, fontWeight: "600", marginBottom: 4 },
  subtitle: { fontSize: 14, color: "#64748b", marginBottom: 24 },
  section: { marginBottom: 20 },
  sectionLabel: { fontSize: 14, fontWeight: "600", marginBottom: 8 },
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
