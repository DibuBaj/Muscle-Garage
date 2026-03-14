import { Platform } from 'react-native';
import Constants from 'expo-constants';

const getApiUrl = () => {
  // 1. PRIORITY: Environmental variable (set in .env file)
  // ⭐ Use this for testing on your PHONE!
  // Set EXPO_PUBLIC_API_URL=http://YOUR_COMPUTER_IP:5000/api in .env
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) {
    console.log('🔌 Using API URL from .env:', envUrl);
    console.log('📱 This is configured for testing on your phone/device');
    return envUrl;
  }

  // 2. For web (browser testing)
  if (Platform.OS === 'web') {
    console.log('🔌 Using web localhost');
    return 'http://localhost:5000/api';
  }

  // 3. Android emulator (on your computer)
  if (Platform.OS === 'android') {
    console.log('🔌 Using Android emulator');
    return 'http://10.0.2.2:5000/api';
  }

  // 4. Auto-detect from Expo host (fallback for development)
  const hostUri = Constants.expoConfig?.hostUri || Constants.manifest2?.extra?.expoClient?.hostUri;
  const host = hostUri ? hostUri.split(':')[0] : null;
  if (host) {
    const url = `http://${host}:5000/api`;
    console.log('🔌 Auto-detected from Expo host:', url);
    return url;
  }

  // 5. No valid URL found
  const errorMsg = '❌ Could not determine API URL.\n\nTo fix:\n1. Set EXPO_PUBLIC_API_URL in .env file\n2. Get your computer IP: ipconfig (look for IPv4 Address)\n3. Set: EXPO_PUBLIC_API_URL=http://YOUR_IP:5000/api\n4. Phone must be on SAME WiFi as your computer\n5. Restart Expo with: npx expo start';
  console.error(errorMsg);
  throw new Error(errorMsg);
};

export const API_URL = getApiUrl();
console.log('✅ API_URL:', API_URL);
