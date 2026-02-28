import type { Id } from "@venturai/backend/dataModel";
import * as FileSystem from "expo-file-system/legacy";

/**
 * Upload a photo from a local file URI to Convex storage.
 * Returns the storage ID for use with suggestFromPhoto etc.
 */
export async function uploadPhotoFromUri(
  uri: string,
  uploadUrl: string,
): Promise<Id<"_storage">> {
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: "base64",
  });
  const byteChars = atob(base64);
  const byteNumbers = new Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) {
    byteNumbers[i] = byteChars.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: "image/jpeg" });

  const resp = await fetch(uploadUrl, {
    method: "POST",
    headers: { "Content-Type": "image/jpeg" },
    body: blob,
  });
  if (!resp.ok) {
    throw new Error(`Upload failed: ${resp.status}`);
  }
  const json = (await resp.json()) as { storageId?: string };
  if (!json.storageId) {
    throw new Error("No storageId in upload response");
  }
  return json.storageId as Id<"_storage">;
}
