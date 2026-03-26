import { Platform } from 'react-native';
import Constants from 'expo-constants';

const getApiUrl = () => {
  // 1. PRIORITY: Environmental variable (set in .env file)
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) {
    console.log('🔌 Using API URL from .env:', envUrl);
    return envUrl;
  }

  // 2. For web (browser testing)
  if (Platform.OS === 'web') {
    console.log('🔌 Using web localhost');
    return 'http://localhost:5000/api';
  }

  // 3. Auto-detect from Expo host (works for physical devices on WiFi)
  const hostUri = Constants.expoConfig?.hostUri || Constants.manifest2?.extra?.expoClient?.hostUri;
  const host = hostUri ? hostUri.split(':')[0] : null;
  if (host) {
    const url = `http://${host}:5000/api`;
    console.log('🔌 Auto-detected from Expo host (physical device):', url);
    return url;
  }

  // 4. Android emulator fallback (only if auto-detect fails)
  if (Platform.OS === 'android') {
    console.log('🔌 Using Android emulator IP');
    return 'http://10.0.2.2:5000/api';
  }

  // 5. No valid URL found
  const errorMsg = '❌ Could not determine API URL.\n\nTo fix:\n1. Make sure Backend is running: npm run dev in Backend folder\n2. Phone and computer must be on SAME WiFi\n3. Restart Expo: npm start\n4. Scan fresh QR code';
  console.error(errorMsg);
  throw new Error(errorMsg);
};

export const API_URL = getApiUrl();
console.log('✅ API_URL:', API_URL);
