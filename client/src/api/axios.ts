import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:9295',  // Direct connection to backend
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true
});

// CSRF token interceptor
api.interceptors.request.use((config) => {
  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
  if (csrfToken) {
    config.headers['X-CSRF-Token'] = csrfToken;
  }
  return config;
});

// Error handling
api.interceptors.response.use(
  response => response,
  error => {
    const { response } = error;
    
    // Auth errors redirect to login
    if (response && response.status === 401) {
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default api;