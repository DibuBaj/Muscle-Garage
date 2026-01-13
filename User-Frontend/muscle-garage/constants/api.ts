import { Platform } from 'react-native';
import Constants from 'expo-constants';

const getApiUrl = () => {
  // For web
  if (Platform.OS === 'web') {
    return 'http://localhost:5000/api';
  }
  
  // For Android Emulator
  if (Platform.OS === 'android') {
    // Check if running on emulator or physical device
    // For physical device, use your computer's local IP address
    // Replace with your actual IP if using physical device
    return 'http://10.0.2.2:5000/api';
  }
  
  // For iOS Simulator
  return 'http://localhost:5000/api';
};

export const API_URL = getApiUrl();

// Log the API URL for debugging
console.log('Using API URL:', API_URL);
