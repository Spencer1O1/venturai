import { View, Text, FlatList } from "react-native";

const mockRequests = [
  { id: "1", status: "Open", description: "Hydraulic leak" },
  { id: "2", status: "Resolved", description: "Sensor replaced" },
];

export default function MaintenanceScreen() {
  return (
    <View style={{ flex: 1, padding: 24 }}>
      <Text style={{ fontSize: 20, marginBottom: 20 }}>
        Maintenance Requests
      </Text>

      <FlatList
        data={mockRequests}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View
            style={{
              padding: 16,
              backgroundColor: "#f3f4f6",
              borderRadius: 6,
              marginBottom: 12,
            }}
          >
            <Text>Status: {item.status}</Text>
            <Text>{item.description}</Text>
          </View>
        )}
      />
    </View>
  );
}