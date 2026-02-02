import axios from 'axios';

// Firebase Cloud Function URL
// The function is named 'api' and routes are prefixed with '/api'
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://us-central1-adelclinic-35393.cloudfunctions.net/api/api';

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
