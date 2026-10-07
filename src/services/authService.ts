import api from './api';
import { LoginCredentials, LoginResponse, User, ApiResponse } from '../types';

interface LoginApiPayload {
  token: string;
  user: User;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      const response = await api.post<ApiResponse<LoginApiPayload>>('/auth/login', credentials);
      const payload = response.data.data;

      if (!response.data.success || !payload?.token || !payload?.user) {
        throw new Error(response.data.message || 'Đăng nhập thất bại');
      }

      // Trang quản trị chỉ dành cho admin/nhân viên; tài khoản khách hàng không được lưu token ở đây
      if (payload.user.role !== 'admin' && payload.user.role !== 'staff') {
        throw new Error('Tài khoản này không có quyền truy cập trang quản trị');
      }

      localStorage.setItem('admin_token', payload.token);
      localStorage.setItem('admin_user', JSON.stringify(payload.user));

      return payload;
    } catch (error: any) {
      throw new Error(error?.response?.data?.message || error?.message || 'Tên đăng nhập hoặc mật khẩu không đúng');
    }
  },

  logout(): void {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
  },

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('admin_user');
    if (!userStr) return null;

    try {
      return JSON.parse(userStr) as User;
    } catch {
      return null;
    }
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('admin_token');
  },
};
