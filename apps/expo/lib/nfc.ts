/**
 * NFC utilities for tag detection and writing.
 * Requires a development build (not Expo Go) - react-native-nfc-manager uses native code.
 *
 * Reading uses registerTagEvent (event-based) instead of requestTechnology, matching
 * the ultimatetag approach for better Android reliability (avoids system intercept).
 */
import { Platform } from "react-native";
import NfcManager, {
  Ndef,
  NfcEvents,
  NfcTech,
  type TagEvent,
} from "react-native-nfc-manager";

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
    // Android: delay after start() helps prevent "native NFC scan window" from
    // appearing (react-native-nfc-manager #423). 1.5–2.5s recommended.
    if (Platform.OS === "android") {
      await new Promise((r) => setTimeout(r, 1500));
    }
    return "supported";
  } catch {
    return "unsupported";
  }
}

/** Extract URL from a TagEvent's ndefMessage (first URI record). */
export function parseUrlFromTagEvent(tag: TagEvent): string | null {
  const ndefMessage = tag.ndefMessage;
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
}

/**
 * Start listening for NFC tags with URL (NDEF URI). Uses registerTagEvent for
 * event-based scanning (better Android reliability). Call stopNfcUrlReader to stop.
 * If a tag has no Venturai URL, onTagWithoutUrl is called (e.g. to open register flow).
 */
export async function startNfcUrlReader(
  onUrl: (url: string) => void,
  onError?: (err: Error) => void,
  onTagWithoutUrl?: () => void,
): Promise<() => void> {
  const opts = {
    alertMessage: "Hold your phone near the NFC tag",
    invalidateAfterFirstRead: false,
    // Android: isReaderModeEnabled=false uses foreground dispatch, which may
    // suppress the system NFC modal better on some devices (Samsung, etc.).
    // When true, add FLAG_READER_NO_PLATFORM_SOUNDS (256) to reduce system UI.
    ...(Platform.OS === "android" && {
      isReaderModeEnabled: false,
      readerModeFlags: 256, // FLAG_READER_NO_PLATFORM_SOUNDS (used if reader mode on)
      readerModeDelay: 500,
    }),
  };
  try {
    await NfcManager.registerTagEvent(opts);
  } catch (err) {
    onError?.(err instanceof Error ? err : new Error(String(err)));
    return () => {};
  }
  const handler = (tag: TagEvent) => {
    const url = parseUrlFromTagEvent(tag);
    if (url && parseAssetIdFromUrl(url)) {
      onUrl(url);
      if (Platform.OS === "ios") {
        NfcManager.unregisterTagEvent().catch(() => {});
      }
    } else {
      onTagWithoutUrl?.();
      if (Platform.OS === "ios") {
        NfcManager.unregisterTagEvent().catch(() => {});
      }
    }
  };
  NfcManager.setEventListener(NfcEvents.DiscoverTag, handler);
  return () => {
    NfcManager.setEventListener(NfcEvents.DiscoverTag, null);
    NfcManager.unregisterTagEvent().catch(() => {});
  };
}

/** Stop the NFC URL reader (unregister tag event and remove listener). */
export async function stopNfcUrlReader(): Promise<void> {
  NfcManager.setEventListener(NfcEvents.DiscoverTag, null);
  try {
    await NfcManager.unregisterTagEvent();
  } catch {
    // Ignore
  }
}

let _cancelNfcUrlRead: (() => void) | null = null;

/**
 * Read the URL from an NFC tag. Uses registerTagEvent under the hood.
 * Call cancelNfcScan() to abort. Prefer startNfcUrlReader/stopNfcUrlReader for
 * useFocusEffect-based flows.
 */
export function readUrlFromNfcTag(): Promise<string | null> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      stop().then(() => resolve(null));
    }, 120_000);
    let done = false;
    const stop = async () => {
      if (done) return;
      done = true;
      _cancelNfcUrlRead = null;
      clearTimeout(timeout);
      await stopNfcUrlReader();
    };
    _cancelNfcUrlRead = () => {
      stop().then(() => resolve(null));
    };
    startNfcUrlReader(
      (url) => {
        stop().then(() => resolve(url));
      },
      () => {
        stop().then(() => resolve(null));
      },
    ).then((unsub) => {
      if (done) unsub();
    });
  });
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

/**
 * Check if app was launched by scanning an NFC tag (Android). Returns assetId if
 * tag had a Venturai URL, or "register" if tag had no Venturai URL. Returns null
 * if not launched by NFC.
 */
export async function getNfcLaunchDestination(): Promise<
  string | "register" | null
> {
  if (Platform.OS !== "android") return null;
  const log = (msg: string, data?: unknown) =>
    console.log("[NFC Launch]", msg, data ?? "");
  try {
    const getLaunchTagEvent = NfcManager.getLaunchTagEvent;
    if (!getLaunchTagEvent) {
      log("getLaunchTagEvent not available");
      return null;
    }
    const tag = await getLaunchTagEvent();
    log("getLaunchTagEvent result", tag ? "tag received" : "null");
    if (!tag) return null;
    const url = parseUrlFromTagEvent(tag);
    const assetId = url ? parseAssetIdFromUrl(url) : null;
    const dest = assetId ?? "register";
    log("parsed", { url: url ?? "(none)", assetId, dest });
    return dest;
  } catch (err) {
    console.log("[NFC Launch] error", err);
    return null;
  }
}

/** Build the asset dashboard URL for a given asset ID */
export function assetUrl(assetId: string): string {
  return `${APP_URL.replace(/\/$/, "")}/a/${assetId}`;
}

/** Cancel any active NFC scan (requestTechnology or registerTagEvent) */
export async function cancelNfcScan(): Promise<void> {
  if (_cancelNfcUrlRead) {
    _cancelNfcUrlRead();
    return;
  }
  try {
    await NfcManager.cancelTechnologyRequest();
  } catch {
    // Ignore
  }
}
