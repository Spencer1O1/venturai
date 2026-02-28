import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  cancelNfcScan,
  initNfc,
  parseAssetIdFromUrl,
  startNfcUrlReader,
  stopNfcUrlReader,
} from "../lib/nfc";
import { theme } from "../lib/theme";

export default function ScanScreen() {
  const router = useRouter();
  const [status, setStatus] = useState<
    "checking" | "ready" | "scanning" | "success" | "error" | "unsupported"
  >("checking");
  const mountedRef = useRef(true);

  const handleUrl = useCallback(
    (url: string) => {
      if (!mountedRef.current) return;
      const assetId = parseAssetIdFromUrl(url);
      if (assetId) {
        setStatus("success");
        router.replace(`/a/${assetId}`);
      } else {
        // Tag has URL but not a Venturai asset - open register
        setStatus("success");
        router.replace("/register");
      }
    },
    [router],
  );

  const handleTagWithoutUrl = useCallback(() => {
    if (!mountedRef.current) return;
    setStatus("success");
    router.replace("/register");
  }, [router]);

  const handleError = useCallback(() => {
    if (mountedRef.current) setStatus("error");
  }, []);

  const startReader = useCallback(async () => {
    setStatus("scanning");
    await stopNfcUrlReader();
    await startNfcUrlReader(
      handleUrl,
      (err) => {
        console.error("NFC reader error:", err);
        handleError();
      },
      handleTagWithoutUrl,
    );
  }, [handleUrl, handleError, handleTagWithoutUrl]);

  useFocusEffect(
    useCallback(() => {
      mountedRef.current = true;
      initNfc().then(async (result) => {
        if (!mountedRef.current) return;
        if (result !== "supported") {
          setStatus("unsupported");
          return;
        }
        await startReader();
      });
      return () => {
        mountedRef.current = false;
        stopNfcUrlReader();
      };
    }, [startReader]),
  );

  if (status === "unsupported") {
    return (
      <View style={styles.container}>
        <View style={styles.buttonRow}>
          <Text style={styles.title}>NFC not available</Text>
          <Text style={styles.hint}>
            This device does not support NFC or it is disabled.
          </Text>
          <Pressable
            style={[styles.button, styles.buttonPrimary]}
            onPress={() => router.back()}
          >
            <Text style={styles.buttonTextPrimary}>Back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.buttonRow}>
        <Text style={styles.title}>Scan Data Dot</Text>
        <Text style={styles.hint}>
          {status === "scanning" || status === "ready"
            ? "Hold your phone near the Data Dot to open the asset."
            : status === "error"
              ? "Could not read the tag. Hold it steady and try again."
              : "Checking NFC..."}
        </Text>
        {(status === "scanning" || status === "checking") && (
          <ActivityIndicator
            size="large"
            color={theme.accent}
            style={styles.spinner}
          />
        )}
        {status === "error" && (
          <Pressable
            style={[styles.button, styles.buttonPrimary]}
            onPress={startReader}
          >
            <Text style={styles.buttonTextPrimary}>Retry</Text>
          </Pressable>
        )}
        <Pressable
          style={[styles.button, styles.buttonSecondary]}
          onPress={() => {
            cancelNfcScan();
            router.back();
          }}
        >
          <Text style={styles.buttonTextSecondary}>Cancel</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: theme.background,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
    color: theme.text,
  },
  hint: {
    fontSize: 14,
    color: theme.textMuted,
    textAlign: "center",
    marginBottom: 24,
  },
  spinner: { marginVertical: 24 },
  buttonRow: { width: "100%", maxWidth: 320 },
  button: {
    alignSelf: "stretch",
    paddingVertical: theme.buttonPaddingVertical,
    paddingHorizontal: theme.buttonPaddingHorizontal,
    borderRadius: theme.buttonBorderRadius,
    alignItems: "center",
    marginBottom: 12,
  },
  buttonPrimary: {
    backgroundColor: theme.buttonPrimary,
  },
  buttonSecondary: {
    backgroundColor: theme.buttonSecondary,
    borderWidth: 1,
    borderColor: theme.border,
  },
  buttonTextPrimary: {
    color: theme.background,
    fontSize: theme.buttonFontSize,
    fontWeight: theme.buttonFontWeight,
  },
  buttonTextSecondary: {
    color: theme.text,
    fontSize: theme.buttonFontSize,
    fontWeight: theme.buttonFontWeight,
  },
});
