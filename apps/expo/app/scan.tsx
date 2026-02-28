/* import { View, Text, ActivityIndicator, Alert } from "react-native";
import { useEffect } from "react";
import { useRouter } from "expo-router";
import { useMutation } from "convex/react";
import NfcManager, { NfcTech } from "react-native-nfc-manager";
import { api } from "../convex/_generated/api";

export default function ScanScreen() {
  const router = useRouter();
  const getAsset = useMutation(api.assets.getAssetByNfcTagId);

  useEffect(() => {
    const startScan = async () => {
      try {
        await NfcManager.start();
        await NfcManager.requestTechnology(NfcTech.Ndef);

        const tag = await NfcManager.getTag();
        const nfcTagId = tag?.id;

        if (!nfcTagId) throw new Error("Invalid NFC tag");

        const asset = await getAsset({ nfcTagId });

        if (!asset) {
          Alert.alert("Asset not found");
          router.replace("/");
          return;
        }

        router.replace(`/asset/${asset._id}`);
      } catch (err) {
        Alert.alert("Scan failed");
        router.replace("/");
      } finally {
        NfcManager.cancelTechnologyRequest();
      }
    };

    startScan();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" />
      <Text>Hold device near NFC tag...</Text>
    </View>
  );
} */