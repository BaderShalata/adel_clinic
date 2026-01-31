import axios from 'axios';

// Change this to your Firebase Cloud Function URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api-zotx6w4dua-uc.a.run.app/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const setAuthToken = (token: string | null) => {
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common['Authorization'];
  }
};

export default apiClient;
