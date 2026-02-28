import * as ImagePicker from "expo-image-picker";
import { useCallback, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

type Props = {
  label: string;
  onCapture: (uri: string) => void;
  onClear?: () => void;
  value?: string | null;
  disabled?: boolean;
};

/**
 * Photo slot: "Take photo" button or thumbnail with retake.
 * Requests camera permission on first capture.
 */
export function PhotoCaptureSlot({
  label,
  onCapture,
  onClear,
  value,
  disabled,
}: Props) {
  const [capturing, setCapturing] = useState(false);

  const capture = useCallback(async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Camera required",
        "Venturai needs camera access to photograph assets.",
      );
      return;
    }

    setCapturing(true);
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        onCapture(result.assets[0].uri);
      }
    } finally {
      setCapturing(false);
    }
  }, [onCapture]);

  return (
    <View style={styles.slot}>
      <Text style={styles.label}>{label}</Text>
      {value ? (
        <View style={styles.thumbnailRow}>
          <Image source={{ uri: value }} style={styles.thumbnail} />
          <View style={styles.actions}>
            <Pressable
              style={[styles.button, styles.buttonSecondary]}
              onPress={capture}
              disabled={disabled || capturing}
            >
              <Text style={styles.buttonText}>
                {capturing ? "Opening..." : "Retake"}
              </Text>
            </Pressable>
            {onClear && (
              <Pressable
                style={[styles.button, styles.buttonOutline]}
                onPress={onClear}
                disabled={disabled}
              >
                <Text style={styles.buttonTextSecondary}>Remove</Text>
              </Pressable>
            )}
          </View>
        </View>
      ) : (
        <Pressable
          style={[styles.captureButton, capturing && styles.captureButtonDisabled]}
          onPress={capture}
          disabled={disabled || capturing}
        >
          <Text style={styles.captureButtonText}>
            {capturing ? "Opening camera..." : "Take photo"}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  slot: { marginBottom: 16 },
  label: { fontSize: 14, marginBottom: 8 },
  captureButton: {
    backgroundColor: "#e2e8f0",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#cbd5e1",
    borderStyle: "dashed",
  },
  captureButtonDisabled: { opacity: 0.7 },
  captureButtonText: { fontSize: 15, color: "#475569", fontWeight: "500" },
  thumbnailRow: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
  },
  actions: { flex: 1, gap: 8 },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  buttonSecondary: { backgroundColor: "#e2e8f0" },
  buttonOutline: { backgroundColor: "transparent", borderWidth: 1, borderColor: "#94a3b8" },
  buttonText: { fontSize: 14, fontWeight: "500", color: "#334155" },
  buttonTextSecondary: { fontSize: 14, color: "#64748b" },
});
