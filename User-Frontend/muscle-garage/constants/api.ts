import axios from 'axios';
import { Platform } from 'react-native';

const DEFAULT_API_URL = 'https://muscle-garage-backend.vercel.app/api';

const sanitizeApiUrl = (url: string) => url.trim().replace(/\/$/, '');

const getApiUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) {
    const sanitized = sanitizeApiUrl(envUrl);
    console.log('[api] Using API URL from EXPO_PUBLIC_API_URL:', sanitized);
    return sanitized;
  }

  console.log('[api] Falling back to deployed API URL:', DEFAULT_API_URL);
  return DEFAULT_API_URL;
};

export const API_URL = getApiUrl();
axios.defaults.timeout = 20000;
console.log('[api] Resolved API_URL:', API_URL);
