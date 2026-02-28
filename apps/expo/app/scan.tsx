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
        <Text style={styles.title}>NFC not available</Text>
        <Text style={styles.hint}>
          This device does not support NFC or it is disabled.
        </Text>
        <Pressable style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Scan NFC Tag</Text>
      <Text style={styles.hint}>
        {status === "scanning" || status === "ready"
          ? "Hold your phone near the NFC tag to open the asset."
          : status === "error"
            ? "Could not read the tag. Hold it steady and try again."
            : "Checking NFC..."}
      </Text>
      {(status === "scanning" || status === "checking") && (
        <ActivityIndicator size="large" style={styles.spinner} />
      )}
      {status === "error" && (
        <Pressable style={styles.button} onPress={startReader}>
          <Text style={styles.buttonText}>Retry</Text>
        </Pressable>
      )}
      <Pressable
        style={[styles.button, styles.buttonSecondary]}
        onPress={() => {
          cancelNfcScan();
          router.back();
        }}
      >
        <Text style={styles.buttonText}>Cancel</Text>
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
  title: { fontSize: 20, fontWeight: "600", marginBottom: 8 },
  hint: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 24,
  },
  spinner: { marginVertical: 24 },
  button: {
    backgroundColor: "#2563eb",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 12,
  },
  buttonSecondary: { backgroundColor: "#64748b" },
  buttonText: { color: "#fff", fontSize: 16 },
});
