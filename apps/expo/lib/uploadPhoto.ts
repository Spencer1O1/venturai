import type { Id } from "@venturai/backend/dataModel";
import * as FileSystem from "expo-file-system/legacy";

/**
 * Upload a photo from a local file URI to Convex storage.
 * Returns the storage ID for use with suggestFromPhoto etc.
 * Uses FileSystem.uploadAsync (React Native Blob/ArrayBuffer not supported for fetch body).
 */
export async function uploadPhotoFromUri(
  uri: string,
  uploadUrl: string,
): Promise<Id<"_storage">> {
  const response = await FileSystem.uploadAsync(uploadUrl, uri, {
    httpMethod: "POST",
    headers: { "Content-Type": "image/jpeg" },
    uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
  });

  if (response.status < 200 || response.status >= 300) {
    throw new Error(`Upload failed: ${response.status}`);
  }

  const json = JSON.parse(response.body) as { storageId?: string };
  if (!json.storageId) {
    throw new Error("No storageId in upload response");
  }
  return json.storageId as Id<"_storage">;
}
