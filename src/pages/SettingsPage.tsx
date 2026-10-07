import React, { useEffect, useState } from 'react';
import { Cog6ToothIcon, ShieldCheckIcon, UserCircleIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api, { apiErrorMessage } from '../services/api';
import { ApiResponse, User } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { hasRole, roleLabel } from '../utils/roles';
import PaymentSettingsCard from '../components/Settings/PaymentSettingsCard';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import usePageTitle from '../hooks/usePageTitle';
import { PASSWORD_MIN, validatePasswordChange, validateProfile } from '../utils/settingsValidation';

const inputClass =
  'w-full rounded-2xl border px-4 py-3 outline-none transition focus:border-blue-500';

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

const Field: React.FC<{ id: string; label: string; error?: string; children: React.ReactNode }> = ({ id, label, error, children }) => (
  <div>
    <label htmlFor={id} className="mb-2 block text-sm font-medium text-slate-700">
      {label}
    </label>
    {children}
    {error && (
      <p role="alert" className="mt-1 text-xs text-red-600">
        {error}
      </p>
    )}
  </div>
);

const SettingsPage: React.FC = () => {
  usePageTitle('Cài đặt');
  const { user, logout, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [profile, setProfile] = useState({ full_name: '', email: '' });
  const [original, setOriginal] = useState({ full_name: '', email: '' });
  const [profileErrors, setProfileErrors] = useState<ReturnType<typeof validateProfile>>({});
  const [passwords, setPasswords] = useState({ current_password: '', new_password: '', confirm: '' });
  const [passwordErrors, setPasswordErrors] = useState<ReturnType<typeof validatePasswordChange>>({});
  const [showPasswords, setShowPasswords] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get<ApiResponse<User>>('/users/me');
        const current = response.data.data;
        const values = { full_name: current.full_name || '', email: current.email || '' };
        setProfile(values);
        setOriginal(values);
      } catch (error: any) {
        toast.error(apiErrorMessage(error, 'Không thể tải thông tin tài khoản'));
      } finally {
        setLoading(false);
      }
    };

    void fetchProfile();
  }, []);

  const profileChanged = profile.full_name.trim() !== original.full_name || profile.email.trim() !== original.email;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateProfile(profile);
    setProfileErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSavingProfile(true);
    try {
      const payload = { full_name: profile.full_name.trim(), email: profile.email.trim() };
      const response = await api.put<ApiResponse<User>>('/users/me', payload);
      const updated = response.data.data;
      // Cập nhật ngay tên/email trên giao diện (header, sidebar) mà không cần tải lại trang
      updateUser({ full_name: updated.full_name, email: updated.email });
      const values = { full_name: updated.full_name || '', email: updated.email || '' };
      setProfile(values);
      setOriginal(values);
      toast.success('Cập nhật hồ sơ thành công');
    } catch (error: any) {
      toast.error(apiErrorMessage(error, 'Không thể cập nhật hồ sơ'));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validatePasswordChange(passwords);
    setPasswordErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSavingPassword(true);
    try {
      await api.put('/users/me/password', {
        current_password: passwords.current_password,
        new_password: passwords.new_password,
      });
      setPasswords({ current_password: '', new_password: '', confirm: '' });
      toast.success('Đổi mật khẩu thành công. Vui lòng đăng nhập lại.');
      logout();
    } catch (error: any) {
      // Mật khẩu hiện tại sai: backend trả 400 (và interceptor cũng bỏ qua 401 của endpoint này) nên không bị đăng xuất
      toast.error(apiErrorMessage(error, 'Không thể đổi mật khẩu'));
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  const border = (error?: string) => (error ? 'border-red-400' : 'border-slate-200');

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] bg-gradient-to-r from-sidebar via-sidebar to-blue-900 p-6 text-white shadow-lg">
        <h1 className="text-3xl font-bold tracking-tight">Cài đặt tài khoản</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/80">Xem thông tin đăng nhập, cập nhật hồ sơ, đổi mật khẩu và (admin) tài khoản ngân hàng nhận tiền.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <Card title="Thông tin phiên đăng nhập" description="Tài khoản bạn đang sử dụng để quản trị cửa hàng." icon={UserCircleIcon}>
          <div className="space-y-4">
            {[
              ['Tên hiển thị', user?.full_name],
              ['Tên đăng nhập', user?.username],
              ['Email', user?.email],
              ['Vai trò', roleLabel(user?.role)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
                <p className="mt-1 break-words font-semibold text-slate-900">{value || 'Chưa có dữ liệu'}</p>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          <Card title="Cập nhật hồ sơ" description="Chỉnh sửa họ tên và email của bạn." icon={Cog6ToothIcon}>
            <form onSubmit={handleSaveProfile} noValidate>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field id="st-name" label="Họ và tên" error={profileErrors.full_name}>
                  <input
                    id="st-name"
                    value={profile.full_name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setProfile((prev) => ({ ...prev, full_name: e.target.value })); setProfileErrors((p) => ({ ...p, full_name: undefined })); }}
                    className={`${inputClass} ${border(profileErrors.full_name)}`}
                    autoComplete="name"
                  />
                </Field>
                <Field id="st-email" label="Email" error={profileErrors.email}>
                  <input
                    id="st-email"
                    type="email"
                    value={profile.email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setProfile((prev) => ({ ...prev, email: e.target.value })); setProfileErrors((p) => ({ ...p, email: undefined })); }}
                    className={`${inputClass} ${border(profileErrors.email)}`}
                    autoComplete="email"
                  />
                </Field>
              </div>
              <div className="mt-5 flex justify-end">
                <button
                  type="submit"
                  disabled={savingProfile || !profileChanged}
                  className="rounded-2xl bg-blue-600 px-5 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {savingProfile ? 'Đang lưu...' : 'Lưu hồ sơ'}
                </button>
              </div>
            </form>
          </Card>

          <Card title="Bảo mật tài khoản" description="Đổi mật khẩu đăng nhập." icon={ShieldCheckIcon}>
            <form onSubmit={handleChangePassword} noValidate>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field id="st-current" label="Mật khẩu hiện tại" error={passwordErrors.current_password}>
                  <input
                    id="st-current"
                    type={showPasswords ? 'text' : 'password'}
                    value={passwords.current_password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setPasswords((prev) => ({ ...prev, current_password: e.target.value })); setPasswordErrors((p) => ({ ...p, current_password: undefined })); }}
                    className={`${inputClass} ${border(passwordErrors.current_password)}`}
                    autoComplete="current-password"
                  />
                </Field>
                <div />
                <Field id="st-new" label={`Mật khẩu mới (tối thiểu ${PASSWORD_MIN} ký tự)`} error={passwordErrors.new_password}>
                  <input
                    id="st-new"
                    type={showPasswords ? 'text' : 'password'}
                    value={passwords.new_password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setPasswords((prev) => ({ ...prev, new_password: e.target.value })); setPasswordErrors((p) => ({ ...p, new_password: undefined })); }}
                    className={`${inputClass} ${border(passwordErrors.new_password)}`}
                    autoComplete="new-password"
                  />
                </Field>
                <Field id="st-confirm" label="Nhập lại mật khẩu mới" error={passwordErrors.confirm}>
                  <input
                    id="st-confirm"
                    type={showPasswords ? 'text' : 'password'}
                    value={passwords.confirm}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setPasswords((prev) => ({ ...prev, confirm: e.target.value })); setPasswordErrors((p) => ({ ...p, confirm: undefined })); }}
                    className={`${inputClass} ${border(passwordErrors.confirm)}`}
                    autoComplete="new-password"
                  />
                </Field>
              </div>
              <button
                type="button"
                onClick={() => setShowPasswords((v) => !v)}
                className="mt-3 flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"
              >
                {showPasswords ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                {showPasswords ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              </button>
              <div className="mt-4 rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                Sau khi đổi mật khẩu thành công, hệ thống sẽ đăng xuất để bạn đăng nhập lại bằng mật khẩu mới.
              </div>
              <div className="mt-5 flex justify-end">
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="rounded-2xl bg-blue-600 px-5 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {savingPassword ? 'Đang cập nhật...' : 'Đổi mật khẩu'}
                </button>
              </div>
            </form>
          </Card>
        </div>
      </div>

      {hasRole(user?.role, 'admin') && <PaymentSettingsCard />}
    </div>
  );
};

export default SettingsPage;
