import React, { useEffect, useState } from 'react';
import {
  Cog6ToothIcon,
  ShieldCheckIcon,
  UserCircleIcon,
  LockClosedIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '../services/api';
import { ApiResponse, User } from '../types';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/Common/LoadingSpinner';

const Card: React.FC<{
  title: string;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  children: React.ReactNode;
}> = ({ title, description, icon: Icon, children }) => (
  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
    <div className="mb-5 flex items-start gap-4">
      <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
    </div>
    {children}
  </div>
);

const SettingsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [profile, setProfile] = useState({ full_name: '', email: '' });
  const [passwords, setPasswords] = useState({ current_password: '', new_password: '' });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get<ApiResponse<User>>('/users/me');
        const currentUser = response.data.data;
        setProfile({
          full_name: currentUser.full_name || '',
          email: currentUser.email || '',
        });
      } catch (error: any) {
        toast.error(error?.response?.data?.message || 'Không thể tải thông tin tài khoản');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const response = await api.put<ApiResponse<User>>('/users/me', profile);
      const updatedUser = response.data.data;
      localStorage.setItem('admin_user', JSON.stringify(updatedUser));
      toast.success('Cập nhật hồ sơ thành công');
      window.location.reload();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Không thể cập nhật hồ sơ');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwords.current_password || !passwords.new_password) {
      toast.error('Vui lòng nhập đủ mật khẩu hiện tại và mật khẩu mới');
      return;
    }

    setSavingPassword(true);
    try {
      await api.put('/users/me/password', passwords);
      setPasswords({ current_password: '', new_password: '' });
      toast.success('Đổi mật khẩu thành công. Vui lòng đăng nhập lại.');
      logout();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Không thể đổi mật khẩu');
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 p-6 text-white shadow-lg">
        <p className="text-sm uppercase tracking-[0.22em] text-blue-200">Cài đặt thật từ hệ thống</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Cài đặt tài khoản quản trị</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-200">
          Trang này dùng API thật để đọc và cập nhật hồ sơ admin đang đăng nhập. Không còn lưu giả lập bằng state hay setTimeout.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <Card title="Thông tin phiên đăng nhập" description="Dữ liệu hiện tại lấy từ token và endpoint /api/users/me." icon={UserCircleIcon}>
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Tên hiển thị</p>
              <p className="mt-1 font-semibold text-slate-900">{user?.full_name || 'Chưa có dữ liệu'}</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Tên đăng nhập</p>
              <p className="mt-1 font-semibold text-slate-900">{user?.username || 'N/A'}</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Email</p>
              <p className="mt-1 font-semibold text-slate-900">{user?.email || 'N/A'}</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Vai trò</p>
              <p className="mt-1 font-semibold text-slate-900">{user?.role === 'admin' ? 'Quản trị viên' : 'Nhân viên'}</p>
            </div>
            {/* <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-700">
              <div className="flex items-center gap-2 font-medium">
                <CheckCircleIcon className="h-5 w-5" />
                Trang cài đặt đang nối API thật
              </div>
              <p className="mt-2">Các thao tác cập nhật ở dưới sẽ gọi trực tiếp backend thay vì giả lập dữ liệu.</p>
            </div> */}
          </div>
        </Card>

        <div className="space-y-6">
          <Card title="Cập nhật hồ sơ" description="Chỉnh sửa full_name và email của admin đang đăng nhập." icon={Cog6ToothIcon}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Họ và tên</label>
                <input
                  value={profile.full_name}
                  onChange={(e) => setProfile((prev) => ({ ...prev, full_name: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile((prev) => ({ ...prev, email: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
                />
              </div>
            </div>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={savingProfile}
                className="rounded-2xl bg-blue-600 px-5 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {savingProfile ? 'Đang lưu...' : 'Lưu hồ sơ'}
              </button>
            </div>
          </Card>

          <Card title="Bảo mật tài khoản" description="Đổi mật khẩu bằng endpoint /api/users/me/password." icon={ShieldCheckIcon}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Mật khẩu hiện tại</label>
                <input
                  type="password"
                  value={passwords.current_password}
                  onChange={(e) => setPasswords((prev) => ({ ...prev, current_password: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Mật khẩu mới</label>
                <input
                  type="password"
                  value={passwords.new_password}
                  onChange={(e) => setPasswords((prev) => ({ ...prev, new_password: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500"
                />
              </div>
            </div>
            <div className="mt-4 rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
              Sau khi đổi mật khẩu thành công, hệ thống sẽ đăng xuất để bạn đăng nhập lại bằng mật khẩu mới.
            </div>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={handleChangePassword}
                disabled={savingPassword}
                className="rounded-2xl bg-slate-900 px-5 py-3 font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {savingPassword ? 'Đang cập nhật...' : 'Đổi mật khẩu'}
              </button>
            </div>
          </Card>

          {/* <Card title="Ghi chú triển khai" description="Những phần đã loại bỏ fake data khỏi trang cài đặt." icon={LockClosedIcon}>
            <ul className="space-y-3 text-sm text-slate-600">
              <li>• Không còn dùng <span className="font-medium text-slate-900">setTimeout</span> để giả lập thao tác lưu.</li>
              <li>• Không còn hard-code tên admin như <span className="font-medium text-slate-900">Admin New</span>.</li>
              <li>• Không còn dùng field sai như <span className="font-medium text-slate-900">fullName/full_Name</span>; tất cả dùng <span className="font-medium text-slate-900">full_name</span> theo database.</li>
              <li>• Tất cả dữ liệu trên trang đều đọc từ tài khoản admin thực trong database.</li>
            </ul>
          </Card> */}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
