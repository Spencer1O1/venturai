import * as SecureStore from "expo-secure-store";

/**
 * TokenStorage adapter for Convex Auth using expo-secure-store.
 * Required for React Native since localStorage is not available.
 */
export const convexAuthStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  async setItem(key: string, value: string): Promise<void> {
    await SecureStore.setItemAsync(key, value);
  },
  async removeItem(key: string): Promise<void> {
    await SecureStore.deleteItemAsync(key);
  },
};
