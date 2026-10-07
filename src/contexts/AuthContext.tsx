import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authService } from '../services/authService';
import { AUTH_EXPIRED_EVENT } from '../services/api';
import { User, LoginCredentials } from '../types';
import { getTokenExpiry, isTokenExpired } from '../utils/jwt';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  /** Cập nhật thông tin hiển thị của người dùng hiện tại (sau khi sửa hồ sơ) mà không cần tải lại trang. */
  updateUser: (patch: Partial<User>) => void;
  isAuthenticated: boolean;
}

// Export AuthContext để có thể import ở file khác
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom hook để sử dụng AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

const SESSION_EXPIRED_MESSAGE = 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại';

/** Đọc phiên đã lưu; token hết hạn thì xóa luôn để không hiện giao diện rồi mới bị đá ra. */
const restoreSession = (): User | null => {
  const token = localStorage.getItem('admin_token');
  if (!token || isTokenExpired(token)) {
    authService.logout();
    return null;
  }
  return authService.getCurrentUser();
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(restoreSession);
  const loading = false; // phiên được khôi phục đồng bộ từ localStorage nên không còn trạng thái chờ

  const expireSession = useCallback(() => {
    authService.logout();
    setUser(null);
    toast.error(SESSION_EXPIRED_MESSAGE, { id: 'session-expired' }); // id cố định: nhiều request lỗi cùng lúc chỉ hiện 1 thông báo
  }, []);

  // Server báo token không hợp lệ (401) -> đăng xuất, ProtectedRoute sẽ đưa về trang đăng nhập
  useEffect(() => {
    window.addEventListener(AUTH_EXPIRED_EVENT, expireSession);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, expireSession);
  }, [expireSession]);

  // Tự đăng xuất đúng lúc token hết hạn (nếu để máy mở qua đêm)
  useEffect(() => {
    if (!user) return undefined;
    const exp = getTokenExpiry(localStorage.getItem('admin_token'));
    if (exp === null) return undefined;
    const delay = exp * 1000 - Date.now();
    if (delay <= 0) {
      expireSession();
      return undefined;
    }
    const timer = window.setTimeout(expireSession, Math.min(delay, 2 ** 31 - 1));
    return () => window.clearTimeout(timer);
  }, [user, expireSession]);

  // Đăng xuất/đăng nhập ở tab khác -> tab này đồng bộ theo
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== 'admin_token') return;
      setUser(e.newValue ? authService.getCurrentUser() : null);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const login = async (credentials: LoginCredentials) => {
    // Lỗi (sai mật khẩu, tài khoản khách...) được ném lên để trang đăng nhập hiện ngay tại form
    const response = await authService.login(credentials);
    setUser(response.user);
    toast.success('Đăng nhập thành công');
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    toast.success('Đã đăng xuất');
  };

  const updateUser = (patch: Partial<User>) => {
    setUser((current) => {
      if (!current) return current;
      const next = { ...current, ...patch };
      localStorage.setItem('admin_user', JSON.stringify(next));
      return next;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        updateUser,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
