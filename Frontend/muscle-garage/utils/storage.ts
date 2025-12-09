import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const webStorage = {
  async getItem(key: string): Promise<string | null> {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
    return null;
  },
  async setItem(key: string, value: string): Promise<void> {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  },
  async deleteItem(key: string): Promise<void> {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    }
  },
};

export const storage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return webStorage.getItem(key);
    }
    return SecureStore.getItemAsync(key);
  },
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      return webStorage.setItem(key, value);
    }
    return SecureStore.setItemAsync(key, value);
  },
  async deleteItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      return webStorage.deleteItem(key);
    }
    return SecureStore.deleteItemAsync(key);
  },
};
