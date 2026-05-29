// API Configuration
const RAW_API_URL = import.meta.env.VITE_API_URL;
export const API_URL = RAW_API_URL.replace(/\/+$/, '');

export const getApiUrl = (endpoint = '') => {
  if (!endpoint) return API_URL;
  return `${API_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
};
