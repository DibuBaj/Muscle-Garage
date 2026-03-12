// API Configuration
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const getApiUrl = (endpoint) => {
  return `${API_URL}${endpoint}`;
};
