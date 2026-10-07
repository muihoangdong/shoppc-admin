import axios from 'axios';

/** Phát ra khi server báo token không hợp lệ/hết hạn; AuthContext lắng nghe và đăng xuất mượt (không tải lại trang). */
export const AUTH_EXPIRED_EVENT = 'auth:unauthorized';

export const API_BASE_URL: string = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Thêm token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Các API trả 401 khi sai mật khẩu — đó KHÔNG phải là hết phiên đăng nhập
const AUTH_ENDPOINTS = /\/auth\/(login|register|refresh-token|forgot-password|reset-password)|\/users\/me\/password/;

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url: string = error.config?.url ?? '';
    if (status === 401 && !AUTH_ENDPOINTS.test(url) && localStorage.getItem('admin_token')) {
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
    }
    return Promise.reject(error);
  }
);

/** Lấy thông báo lỗi tiếng Việt từ phản hồi của server (hoặc thông báo dự phòng). */
export const apiErrorMessage = (error: any, fallback: string): string => {
  if (error?.code === 'ECONNABORTED') return 'Máy chủ phản hồi quá lâu, vui lòng thử lại.';
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.request && !error?.response) return 'Không kết nối được tới máy chủ. Hãy kiểm tra mạng và thử lại.';
  return fallback;
};

export default api;
