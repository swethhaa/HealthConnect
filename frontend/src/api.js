import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://127.0.0.1:5001',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sessionToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
