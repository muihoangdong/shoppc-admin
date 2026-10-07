import React, { useEffect, useMemo, useState } from 'react';
import { PlusIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';
import { ManagedUser, NewUserInput, userService } from '../services/userService';
import { formatDateTime } from '../utils/formatters';
import { ROLE_BADGE_CLASSES, ROLE_LABELS, Role } from '../utils/roles';

const ROLE_ORDER: Role[] = ['admin', 'staff', 'customer'];

const EMPTY_FORM: NewUserInput = { username: '', password: '', email: '', full_name: '', role: 'staff' };

const UsersPage: React.FC = () => {
  const { user: me } = useAuth();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<Role | 'all'>('all');
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<NewUserInput>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      setUsers(await userService.getUsers());
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const counts = useMemo(
    () =>
      ROLE_ORDER.reduce(
        (acc, role) => ({ ...acc, [role]: users.filter((u) => u.role === role).length }),
        {} as Record<Role, number>
      ),
    [users]
  );

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter(
      (u) =>
        (roleFilter === 'all' || u.role === roleFilter) &&
        (!q || [u.username, u.email, u.full_name].some((f) => String(f || '').toLowerCase().includes(q)))
    );
  }, [users, roleFilter, search]);

  const run = async (id: number, action: () => Promise<void>, success: string) => {
    try {
      setBusyId(id);
      await action();
      toast.success(success);
      await load();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setBusyId(null);
    }
  };

  const changeRole = (u: ManagedUser, role: Role) => {
    if (role === u.role) return;
    if (!window.confirm(`Đổi vai trò của "${u.username}" từ ${ROLE_LABELS[u.role]} sang ${ROLE_LABELS[role]}?`)) return;
    void run(u.id, () => userService.updateUser(u.id, { role }), 'Đã đổi vai trò');
  };

  const toggleStatus = (u: ManagedUser) => {
    const lock = u.status === 'active';
    if (!window.confirm(lock ? `Khóa tài khoản "${u.username}"? Người này sẽ không đăng nhập được.` : `Mở khóa tài khoản "${u.username}"?`)) return;
    void run(u.id, () => userService.updateUser(u.id, { status: lock ? 'inactive' : 'active' }), lock ? 'Đã khóa tài khoản' : 'Đã mở khóa tài khoản');
  };

  const remove = (u: ManagedUser) => {
    if (!window.confirm(`Xóa vĩnh viễn tài khoản "${u.username}"? Không thể hoàn tác.`)) return;
    void run(u.id, () => userService.deleteUser(u.id), 'Đã xóa tài khoản');
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await userService.createUser(form);
      toast.success('Đã tạo tài khoản');
      setModalOpen(false);
      setForm(EMPTY_FORM);
      await load();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading && users.length === 0) return <LoadingSpinner />;

  const inputClass = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Quản lý tài khoản</h1>
          <p className="mt-1 text-sm text-gray-500">
            {counts.admin ?? 0} quản trị viên · {counts.staff ?? 0} nhân viên · {counts.customer ?? 0} khách hàng
          </p>
        </div>
        <button
          onClick={() => {
            setForm(EMPTY_FORM);
            setModalOpen(true);
          }}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
        >
          <PlusIcon className="h-5 w-5" />
          Thêm tài khoản
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
          placeholder="Tìm theo tên, tên đăng nhập, email…"
          className={`${inputClass} max-w-sm`}
        />
        <select
          value={roleFilter}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setRoleFilter(e.target.value as Role | 'all')}
          className={`${inputClass} max-w-[12rem]`}
        >
          <option value="all">Tất cả vai trò</option>
          {ROLE_ORDER.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-lg bg-white shadow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {['Tài khoản', 'Email', 'Vai trò', 'Trạng thái', 'Đăng nhập gần nhất', 'Thao tác'].map((h) => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {visible.map((u) => {
                const isSelf = u.id === me?.id;
                const busy = busyId === u.id;
                return (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">
                        {u.full_name} {isSelf && <span className="text-xs font-normal text-blue-600">(Bạn)</span>}
                      </p>
                      <p className="text-xs text-gray-500">@{u.username}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{u.email}</td>
                    <td className="px-6 py-4">
                      {isSelf ? (
                        <span className={`rounded-full px-2 py-1 text-xs ${ROLE_BADGE_CLASSES[u.role]}`}>{ROLE_LABELS[u.role]}</span>
                      ) : (
                        <select
                          value={u.role}
                          disabled={busy}
                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => changeRole(u, e.target.value as Role)}
                          className={`rounded-full border-0 px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500 ${ROLE_BADGE_CLASSES[u.role]}`}
                        >
                          {ROLE_ORDER.map((r) => (
                            <option key={r} value={r}>
                              {ROLE_LABELS[r]}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-2 py-1 text-xs ${
                          u.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {u.status === 'active' ? 'Hoạt động' : 'Đã khóa'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{u.last_login ? formatDateTime(u.last_login) : 'Chưa đăng nhập'}</td>
                    <td className="px-6 py-4">
                      {isSelf ? (
                        <span className="text-xs text-gray-400">—</span>
                      ) : (
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => toggleStatus(u)}
                            disabled={busy}
                            className="text-xs text-blue-600 hover:underline disabled:opacity-50"
                          >
                            {u.status === 'active' ? 'Khóa' : 'Mở khóa'}
                          </button>
                          <button
                            onClick={() => remove(u)}
                            disabled={busy}
                            title="Xóa tài khoản"
                            className="rounded p-1 text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-500">
                    Không có tài khoản nào phù hợp
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={submit} className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">Thêm tài khoản</h2>
              <button type="button" onClick={() => setModalOpen(false)} className="rounded p-1 hover:bg-gray-100">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3">
              <input
                required
                placeholder="Họ tên"
                value={form.full_name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, full_name: e.target.value })}
                className={inputClass}
              />
              <input
                required
                placeholder="Tên đăng nhập (3–50 ký tự, không khoảng trắng)"
                value={form.username}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, username: e.target.value })}
                className={inputClass}
              />
              <input
                required
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, email: e.target.value })}
                className={inputClass}
              />
              <input
                required
                type="password"
                minLength={6}
                placeholder="Mật khẩu (tối thiểu 6 ký tự)"
                value={form.password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, password: e.target.value })}
                className={inputClass}
              />
              <select
                value={form.role}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm({ ...form, role: e.target.value as Role })}
                className={inputClass}
              >
                {ROLE_ORDER.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Đang tạo…' : 'Tạo tài khoản'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
