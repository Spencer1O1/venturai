import { View, Text, ScrollView, Pressable } from "react-native";
import { useState } from "react";

export default function InspectionScreen() {
  const [items, setItems] = useState([
    { id: "1", label: "Check oil level", checked: false },
    { id: "2", label: "Inspect belts", checked: false },
  ]);

  const toggle = (id: string) => {
    setItems(prev =>
      prev.map(item =>
        item.id === id
          ? { ...item, checked: !item.checked }
          : item
      )
    );
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 24 }}>
      <Text style={{ fontSize: 20, marginBottom: 20 }}>
        Daily Inspection
      </Text>

      {items.map(item => (
        <Pressable
          key={item.id}
          onPress={() => toggle(item.id)}
          style={{
            padding: 16,
            backgroundColor: item.checked ? "#22c55e" : "#e5e7eb",
            borderRadius: 6,
            marginBottom: 12,
          }}
        >
          <Text>{item.label}</Text>
        </Pressable>
      ))}

      <Pressable
        style={{
          backgroundColor: "#1e40af",
          padding: 16,
          borderRadius: 8,
          marginTop: 20,
        }}
      >
        <Text style={{ color: "#fff", textAlign: "center" }}>
          Submit Inspection
        </Text>
      </Pressable>
    </ScrollView>
  );
}