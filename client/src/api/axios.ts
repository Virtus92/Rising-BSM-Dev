import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:9295/api',
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

// Error Handling Interceptor
api.interceptors.response.use(
  response => response,
  error => {
    console.error('Full Axios Error:', error);
    console.error('Response:', error.response);
    
    if (error.response) {
      console.error('Error Status:', error.response.status);
      console.error('Error Data:', error.response.data);
    }
    
    return Promise.reject(error);
  }
);

export default api;