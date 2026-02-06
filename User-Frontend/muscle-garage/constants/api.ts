import { Platform } from 'react-native';
import Constants from 'expo-constants';

const getApiUrl = () => {
  // 1. Check explicit environment variable first (for manual override)
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) {
    console.log('🔌 Using API URL from .env:', envUrl);
    return envUrl;
  }

  // 2. For web
  if (Platform.OS === 'web') {
    console.log('🔌 Using web localhost');
    return 'http://localhost:5000/api';
  }

  // 3. Android emulator
  if (Platform.OS === 'android') {
    console.log('🔌 Using Android emulator');
    return 'http://10.0.2.2:5000/api';
  }

  // 4. Auto-detect from Expo host (WORKS AUTOMATICALLY!)
  const hostUri = Constants.expoConfig?.hostUri || Constants.manifest2?.extra?.expoClient?.hostUri;
  const host = hostUri ? hostUri.split(':')[0] : null;
  if (host) {
    const url = `http://${host}:5000/api`;
    console.log('🔌 Auto-detected from Expo host:', url);
    return url;
  }

  // 5. No valid URL found - throw error
  const errorMsg = 'Could not determine API URL. Make sure:\n1. Running "npx expo start" in the same network\n2. Or set EXPO_PUBLIC_API_URL in .env file';
  console.error('❌', errorMsg);
  throw new Error(errorMsg);
};

export const API_URL = getApiUrl();
console.log('✅ API_URL:', API_URL);
