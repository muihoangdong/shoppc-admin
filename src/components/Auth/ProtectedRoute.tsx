import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../Common/LoadingSpinner';
import { Role, hasRole, roleLabel } from '../../utils/roles';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Vai trò tối thiểu để vào trang. Mặc định: nhân viên (staff) trở lên. */
  requireRole?: Extract<Role, 'staff' | 'admin'>;
}

const AccessDenied: React.FC<{ requireRole: string; currentRole: string; isAdminArea: boolean }> = ({
  requireRole,
  currentRole,
  isAdminArea,
}) => {
  const { logout } = useAuth();
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-bold text-gray-800">Bạn không có quyền truy cập</h1>
        <p className="mt-2 text-sm text-gray-600">
          Trang này dành cho <strong>{requireRole}</strong> trở lên. Tài khoản của bạn đang là <strong>{currentRole}</strong>.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          {isAdminArea ? (
            <Link to="/admin" className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
              Về trang tổng quan
            </Link>
          ) : (
            <button onClick={logout} className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
              Đăng xuất
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/** Chặn truy cập khi chưa đăng nhập hoặc không đủ vai trò (trước đây component này không kiểm tra gì). */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireRole = 'staff' }) => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (!hasRole(user.role, requireRole)) {
    return (
      <AccessDenied
        requireRole={roleLabel(requireRole)}
        currentRole={roleLabel(user.role)}
        isAdminArea={hasRole(user.role, 'staff')}
      />
    );
  }
  return <>{children}</>;
};

export default ProtectedRoute;
