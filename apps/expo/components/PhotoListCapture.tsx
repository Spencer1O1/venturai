import * as ImagePicker from "expo-image-picker";
import { useCallback, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { theme } from "../lib/theme";

type Props = {
  label: string;
  onPhotosChange: (uris: string[]) => void;
  photos: string[];
  maxPhotos?: number;
  disabled?: boolean;
};

/**
 * Optional multi-photo capture: add one or more photos.
 */
export function PhotoListCapture({
  label,
  onPhotosChange,
  photos,
  maxPhotos = 5,
  disabled,
}: Props) {
  const [capturing, setCapturing] = useState(false);

  const capture = useCallback(async () => {
    if (photos.length >= maxPhotos) return;

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
        onPhotosChange([...photos, result.assets[0].uri]);
      }
    } finally {
      setCapturing(false);
    }
  }, [photos, maxPhotos, onPhotosChange]);

  const remove = useCallback(
    (index: number) => {
      onPhotosChange(photos.filter((_, i) => i !== index));
    },
    [photos, onPhotosChange],
  );

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      {photos.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.thumbnails}
        >
          {photos.map((uri, i) => (
            <View key={`${i}-${uri.slice(-20)}`} style={styles.thumbWrapper}>
              <Image source={{ uri }} style={styles.thumbnail} />
              <Pressable
                style={styles.removeBtn}
                onPress={() => remove(i)}
                disabled={disabled}
              >
                <Text style={styles.removeBtnText}>×</Text>
              </Pressable>
            </View>
          ))}
        </ScrollView>
      )}
      {photos.length < maxPhotos && (
        <Pressable
          style={[styles.addButton, capturing && styles.addButtonDisabled]}
          onPress={capture}
          disabled={disabled || capturing}
        >
          <Text style={styles.addButtonText}>
            {capturing ? "Opening camera..." : "+ Add photo"}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    color: theme.text,
  },
  thumbnails: { marginBottom: 8 },
  thumbWrapper: { position: "relative", marginRight: 8 },
  thumbnail: {
    width: 72,
    height: 72,
    borderRadius: 8,
    backgroundColor: theme.backgroundCard,
  },
  removeBtn: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.error,
    alignItems: "center",
    justifyContent: "center",
  },
  removeBtnText: {
    color: theme.background,
    fontSize: 18,
    fontWeight: "600",
    lineHeight: 20,
  },
  addButton: {
    backgroundColor: theme.backgroundElevated,
    padding: 12,
    borderRadius: 10,
    alignSelf: "flex-start",
    borderWidth: 2,
    borderColor: theme.border,
    borderStyle: "dashed",
  },
  addButtonDisabled: { opacity: 0.7 },
  addButtonText: {
    fontSize: 14,
    color: theme.textMuted,
    fontWeight: "500",
  },
});
