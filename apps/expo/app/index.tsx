import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Asset Management</Text>

      <Pressable
        style={styles.scanButton}
        onPress={() => router.push("/scan")}
      >
        <Text style={styles.scanText}>Scan NFC Tag</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 40,
  },
  scanButton: {
    backgroundColor: "#1e40af",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  scanText: {
    color: "#fff",
    fontSize: 18,
  },
});