import {
  cancelNfcScan,
  initNfc,
  parseAssetIdFromUrl,
  readUrlFromNfcTag,
} from "../lib/nfc";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function ScanScreen() {
  const router = useRouter();
  const [status, setStatus] = useState<
    "checking" | "ready" | "scanning" | "success" | "error" | "unsupported"
  >("checking");
  const mountedRef = useRef(true);

  const doScan = useCallback(async () => {
    setStatus("scanning");
    const url = await readUrlFromNfcTag();
    if (!mountedRef.current) return;
    if (!url) {
      setStatus("error");
      return;
    }
    const assetId = parseAssetIdFromUrl(url);
    if (!assetId) {
      setStatus("error");
      Alert.alert(
        "Invalid tag",
        "This tag does not contain a Venturai asset URL.",
      );
      return;
    }
    setStatus("success");
    router.replace(`/a/${assetId}` as never);
  }, [router]);

  useEffect(() => {
    mountedRef.current = true;
    initNfc().then((result: "checking" | "supported" | "unsupported" | "disabled") => {
      if (!mountedRef.current) return;
      if (result === "supported") {
        setStatus("ready");
        doScan();
      } else {
        setStatus("unsupported");
      }
    });
    return () => {
      mountedRef.current = false;
      cancelNfcScan();
    };
  }, [doScan]);

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
        <Pressable style={styles.button} onPress={doScan}>
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
