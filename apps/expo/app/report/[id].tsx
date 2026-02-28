import { View, Text, TextInput, Pressable } from "react-native";
import { useState } from "react";

export default function ReportProblem() {
  const [description, setDescription] = useState("");

  return (
    <View style={{ flex: 1, padding: 24 }}>
      <Text style={{ fontSize: 20, marginBottom: 20 }}>
        Report a Problem
      </Text>

      <TextInput
        placeholder="Describe the issue..."
        value={description}
        onChangeText={setDescription}
        multiline
        style={{
          borderWidth: 1,
          borderColor: "#ccc",
          borderRadius: 6,
          padding: 12,
          height: 120,
          marginBottom: 20,
        }}
      />

      <Pressable
        style={{
          backgroundColor: "#dc2626",
          padding: 16,
          borderRadius: 8,
        }}
      >
        <Text style={{ color: "#fff", textAlign: "center" }}>
          Submit Report
        </Text>
      </Pressable>
    </View>
  );
}