/**
 * NFC utilities for tag detection and writing.
 * Requires a development build (not Expo Go) - react-native-nfc-manager uses native code.
 */
import NfcManager, { Ndef, NfcTech } from "react-native-nfc-manager";

export type NfcStatus = "checking" | "supported" | "unsupported" | "disabled";

const APP_URL =
  (typeof process !== "undefined" && process.env?.EXPO_PUBLIC_APP_URL) ||
  "https://venturai.app";

/** Initialize NFC and check if supported */
export async function initNfc(): Promise<NfcStatus> {
  try {
    const supported = await NfcManager.isSupported();
    if (!supported) return "unsupported";
    await NfcManager.start();
    return "supported";
  } catch {
    return "unsupported";
  }
}

/**
 * Read the URL from an NFC tag. Waits for user to hold phone near tag.
 * Returns the URL string or null if not found / error.
 */
export async function readUrlFromNfcTag(): Promise<string | null> {
  try {
    await NfcManager.requestTechnology(NfcTech.Ndef);
    const tag = await NfcManager.getTag();
    const ndefMessage = tag?.ndefMessage;
    if (!ndefMessage?.length) return null;
    const record = ndefMessage[0];
    if (!record) return null;
    if (!Ndef.isType(record, Ndef.TNF_WELL_KNOWN, Ndef.RTD_URI)) return null;
    const payload =
      record.payload instanceof Uint8Array
        ? record.payload
        : new Uint8Array(record.payload || []);
    const url = Ndef.uri.decodePayload(payload);
    return typeof url === "string" && url ? url : null;
  } catch {
    return null;
  } finally {
    try {
      NfcManager.cancelTechnologyRequest();
    } catch {
      // Ignore
    }
  }
}

/**
 * Parse asset ID from a Venturai asset URL (e.g. https://venturai.app/a/xyz → xyz).
 * Matches /a/<id> pattern in any venturai URL.
 */
export function parseAssetIdFromUrl(url: string): string | null {
  const match = url.match(/\/a\/([^/?#]+)/);
  return (match?.[1] ?? null) as string | null;
}

/**
 * Wait for an NFC tag to be detected. Resolves when user holds phone near tag.
 * Call cancelNfcScan() to abort.
 */
export async function waitForNfcTag(): Promise<boolean> {
  try {
    await NfcManager.requestTechnology(NfcTech.Ndef);
    return true;
  } catch {
    return false;
  } finally {
    try {
      NfcManager.cancelTechnologyRequest();
    } catch {
      // Ignore cancel errors
    }
  }
}

/**
 * Write a URL to an NFC tag. Waits for user to hold phone near tag, then writes.
 * URL should be the full asset URL (e.g. https://venturai.app/a/<assetId>).
 */
export async function writeUrlToNfcTag(url: string): Promise<boolean> {
  try {
    await NfcManager.requestTechnology(NfcTech.Ndef);
    const bytes = Ndef.encodeMessage([Ndef.uriRecord(url)]);
    await NfcManager.ndefHandler.writeNdefMessage(bytes);
    return true;
  } catch {
    return false;
  } finally {
    try {
      NfcManager.cancelTechnologyRequest();
    } catch {
      // Ignore cancel errors
    }
  }
}

/** Build the asset dashboard URL for a given asset ID */
export function assetUrl(assetId: string): string {
  return `${APP_URL.replace(/\/$/, "")}/a/${assetId}`;
}

/** Cancel any active NFC scan */
export async function cancelNfcScan(): Promise<void> {
  try {
    await NfcManager.cancelTechnologyRequest();
  } catch {
    // Ignore
  }
}
