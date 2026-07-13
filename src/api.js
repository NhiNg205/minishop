// src/api.js
import axios from 'axios';

const api = axios.create({
  // Tự động lấy URL từ file .env tùy theo môi trường local hay deploy
  baseURL: import.meta.env.VITE_API_BASE_URL 
    ? `${import.meta.env.VITE_API_BASE_URL}/api` 
    : 'http://localhost:5000/api', 
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;