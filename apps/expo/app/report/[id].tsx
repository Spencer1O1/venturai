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
 * Report a problem flow - problem assessment.
 * Take photo of problem, enter details, submit.
 * TODO: Wire to Convex - storage upload, api.assessments.actions.createWithAI (intent: problem)
 */
export default function ReportProblemScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [description, setDescription] = useState("");

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Report a problem</Text>
      <Text style={styles.subtitle}>Asset {id}</Text>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Photo of problem</Text>
        <Text style={styles.placeholder}>
          Take photo of the issue – camera integration coming
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Describe the issue</Text>
        <TextInput
          placeholder="What’s wrong? When did you notice it?"
          value={description}
          onChangeText={setDescription}
          multiline
          style={styles.input}
        />
      </View>

      <Pressable style={styles.submitButton}>
        <Text style={styles.submitText}>Submit report</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  title: { fontSize: 20, fontWeight: "600", marginBottom: 4 },
  subtitle: { fontSize: 14, color: "#64748b", marginBottom: 24 },
  section: { marginBottom: 20 },
  sectionLabel: { fontSize: 14, fontWeight: "600", marginBottom: 8 },
  placeholder: { fontSize: 14, color: "#94a3b8", marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
  },
  submitButton: {
    backgroundColor: "#dc2626",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 12,
  },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
