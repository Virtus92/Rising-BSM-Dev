// src/api/axios.ts
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true // Wichtig für session-basierte Auth
});

// Interceptor für CSRF-Token
api.interceptors.request.use((config) => {
  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
  if (csrfToken) {
    config.headers['X-CSRF-Token'] = csrfToken;
  }
  return config;
});

// Fehlerbehandlung
api.interceptors.response.use(
  response => response,
  error => {
    const { response } = error;
    
    // Auth-Fehler -> Weiterleitung zum Login
    if (response && response.status === 401) {
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default api;