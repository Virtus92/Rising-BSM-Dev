import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:9295',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true
});

// CSRF-Token Interceptor
api.interceptors.request.use((config) => {
  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
  if (csrfToken) {
    config.headers['X-CSRF-Token'] = csrfToken;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Fehler-Handling
api.interceptors.response.use(
  response => response,
  error => {
    const { response } = error;
    
    // Automatische Weiterleitung bei Authentifizierungsfehler
    if (response && (response.status === 401 || response.status === 403)) {
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default api;