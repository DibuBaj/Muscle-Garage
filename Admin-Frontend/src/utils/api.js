// API Configuration
export const API_URL = import.meta.env.VITE_API_URL || 'https://muscle-garage-3rgl.vercel.app';

export const getApiUrl = (endpoint) => {
  return `${API_URL}${endpoint}`;
};
