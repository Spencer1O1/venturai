import { View, Text, Pressable, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

export default function AssetDashboard() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Asset Dashboard</Text>

      <Pressable
        style={styles.button}
        onPress={() => router.push(`/inspection/${id}`)}
      >
        <Text style={styles.text}>Daily Inspection</Text>
      </Pressable>

      <Pressable
        style={styles.button}
        onPress={() => router.push(`/report/${id}`)}
      >
        <Text style={styles.text}>Report Problem</Text>
      </Pressable>

      <Pressable
        style={styles.button}
        onPress={() => router.push(`/maintenance/${id}`)}
      >
        <Text style={styles.text}>Maintenance Requests</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  title: { fontSize: 22, fontWeight: "600", marginBottom: 24 },
  button: {
    backgroundColor: "#2563eb",
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  text: { color: "#fff", fontSize: 16 },
});