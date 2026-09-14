import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach JWT access token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('fc_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't auto-redirect if checking /api/auth/me during initial mount
      const isAuthCheck = error.config?.url?.includes('/auth/me');
      if (!isAuthCheck) {
        // Token expired or invalid
        localStorage.removeItem('fc_token');
        localStorage.removeItem('fc_user');
      }
    }
    return Promise.reject(error);
  }
);
