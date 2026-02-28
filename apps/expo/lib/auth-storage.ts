import * as SecureStore from "expo-secure-store";

/**
 * Token storage for Convex Auth on React Native.
 * Uses expo-secure-store for encrypted storage.
 */
export const authStorage = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) =>
    SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};
