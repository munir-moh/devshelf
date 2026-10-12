import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5259/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('devshelf_token');
  if (token) config.headers.Authorization = 'Bearer ' + token;
  return config;
});

api.interceptors.response.use((response) => response, (error) => {
  if (error.response?.status === 401) {
    localStorage.removeItem('devshelf_token');
    localStorage.removeItem('devshelf_user');
    if (!['/login', '/register'].includes(window.location.pathname)) window.location.assign('/login');
  }
  return Promise.reject(error);
});

export function getApiError(error, fallback = 'Something went wrong. Please try again.') {
  const data = error.response?.data;
  if (data?.error) return data.error;
  if (data?.title) return data.title;
  if (data?.errors) return Object.values(data.errors).flat().join(' ');
  return error.response ? fallback : 'Could not connect to the API. Check that the backend is running.';
}

export default api;
