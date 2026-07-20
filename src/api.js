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

// ✨ MỚI: Tự động gắn "Authorization: Bearer <token>" vào MỌI request nếu người dùng đã đăng nhập.
// Các route công khai (vd. GET /products) sẽ đơn giản bỏ qua header này, còn route yêu cầu
// đăng nhập (vd. GET /orders/my, hoặc các API quản trị) sẽ tự động dùng được ngay - không cần
// truyền token thủ công ở từng nơi gọi api trong App.jsx.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('minishop_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;