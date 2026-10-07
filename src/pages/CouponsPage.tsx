import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { Coupon } from '../types';
import { couponService, CouponInput } from '../services/couponService';
import { CouponModal } from '../components/Coupons/CouponModal';
import { ConfirmDialog } from '../components/Common/ConfirmDialog';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import ErrorMessage from '../components/Common/ErrorMessage';
import { useAuth } from '../contexts/AuthContext';
import usePageTitle from '../hooks/usePageTitle';
import { canManageCoupons } from '../utils/roles';
import { formatPrice } from '../utils/formatters';

type State = { label: string; badge: string };

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const dmy = (ymd: string) => ymd.split('-').reverse().join('/');

export const couponState = (c: Coupon, now = today()): State => {
  if (!c.is_active) return { label: 'Tạm ngưng', badge: 'bg-gray-100 text-gray-700' };
  if (c.expires_on && now > c.expires_on) return { label: 'Hết hạn', badge: 'bg-red-100 text-red-700' };
  if (c.usage_limit !== null && c.used_count >= c.usage_limit) return { label: 'Hết lượt', badge: 'bg-amber-100 text-amber-800' };
  if (c.starts_on && now < c.starts_on) return { label: 'Chưa bắt đầu', badge: 'bg-blue-100 text-blue-700' };
  return { label: 'Đang chạy', badge: 'bg-green-100 text-green-700' };
};

const discountText = (c: Coupon) =>
  c.type === 'percentage' ? `${c.value}%${c.max_discount ? ` (tối đa ${formatPrice(c.max_discount)})` : ''}` : formatPrice(c.value);

const periodText = (c: Coupon) => {
  if (!c.starts_on && !c.expires_on) return 'Không giới hạn';
  if (c.starts_on && c.expires_on) return `${dmy(c.starts_on)} – ${dmy(c.expires_on)}`;
  return c.starts_on ? `Từ ${dmy(c.starts_on)}` : `Đến hết ${dmy(c.expires_on as string)}`;
};

const CouponsPage: React.FC = () => {
  usePageTitle('Mã giảm giá');
  const { user } = useAuth();
  const canManage = canManageCoupons(user?.role);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<Coupon | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Coupon | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      setError('');
      setCoupons(await couponService.getCoupons());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? coupons.filter((c) => c.code.toLowerCase().includes(q) || (c.description ?? '').toLowerCase().includes(q)) : coupons;
  }, [coupons, search]);
  const running = coupons.filter((c) => couponState(c).label === 'Đang chạy').length;

  const handleSave = async (data: CouponInput) => {
    if (saving) return;
    try {
      setSaving(true);
      if (selected) {
        await couponService.updateCoupon(selected.id, data);
        toast.success(`Đã cập nhật mã ${data.code}`);
      } else {
        await couponService.createCoupon(data);
        toast.success(`Đã tạo mã ${data.code}`);
      }
      setModalOpen(false);
      setSelected(null);
      await load();
    } catch (err: any) {
      toast.error(err.message); // giữ form mở để sửa lại
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (c: Coupon) => {
    try {
      await couponService.updateCoupon(c.id, { is_active: !c.is_active });
      toast.success(c.is_active ? `Đã tạm ngưng mã ${c.code}` : `Đã bật lại mã ${c.code}`);
      await load();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await couponService.deleteCoupon(deleteTarget.id);
      toast.success(`Đã xóa mã ${deleteTarget.code}`);
      setDeleteTarget(null);
      await load();
    } catch (err: any) {
      toast.error(err.message);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error && coupons.length === 0) return <ErrorMessage message={error} onRetry={() => { setLoading(true); void load(); }} />;

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Mã giảm giá</h1>
          <p className="text-sm text-gray-500">{coupons.length} mã · {running} đang chạy</p>
        </div>
        {canManage && (
          <button
            onClick={() => {
              setSelected(null);
              setModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <PlusIcon className="h-5 w-5" />
            Tạo mã giảm giá
          </button>
        )}
      </div>

      {!canManage && (
        <p className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">Bạn chỉ xem được danh sách. Tạo, sửa hoặc xóa mã cần tài khoản quản trị viên.</p>
      )}
      {error && (
        <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Không làm mới được danh sách: {error}
        </div>
      )}

      {coupons.length === 0 ? (
        <div className="rounded-lg bg-white py-14 text-center text-sm text-gray-500 shadow">
          Chưa có mã giảm giá nào.{canManage && ' Bấm "Tạo mã giảm giá" để bắt đầu.'}
        </div>
      ) : (
        <div className="rounded-lg bg-white shadow">
          <div className="border-b p-4">
            <div className="relative max-w-sm">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                type="search"
                value={search}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                placeholder="Tìm theo mã hoặc mô tả"
                aria-label="Tìm mã giảm giá"
                className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Mã', 'Mức giảm', 'Đơn tối thiểu', 'Thời hạn', 'Đã dùng', 'Trạng thái', ...(canManage ? [''] : [])].map((h, i) => (
                    <th key={i} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {shown.map((c) => {
                  const st = couponState(c);
                  return (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-mono font-semibold text-gray-900">{c.code}</div>
                        {c.description && <div className="max-w-xs truncate text-xs text-gray-500" title={c.description}>{c.description}</div>}
                        {c.once_per_customer && <div className="text-xs text-gray-500">Mỗi khách 1 lần</div>}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">{discountText(c)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{c.min_order_value ? formatPrice(c.min_order_value) : '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{periodText(c)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{c.used_count}{c.usage_limit !== null ? ` / ${c.usage_limit}` : ''}</td>
                      <td className="px-4 py-3">
                        <span className={`whitespace-nowrap rounded-full px-2 py-1 text-xs ${st.badge}`}>{st.label}</span>
                      </td>
                      {canManage && (
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => void toggleActive(c)}
                              className="whitespace-nowrap rounded border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
                            >
                              {c.is_active ? 'Tạm ngưng' : 'Bật lại'}
                            </button>
                            <button onClick={() => { setSelected(c); setModalOpen(true); }} aria-label={`Sửa mã ${c.code}`} title="Sửa" className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                              <PencilIcon className="h-5 w-5" />
                            </button>
                            <button onClick={() => setDeleteTarget(c)} aria-label={`Xóa mã ${c.code}`} title="Xóa" className="p-1 text-red-600 hover:bg-red-50 rounded">
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
                {shown.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-500">Không có mã nào khớp "{search}".</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <CouponModal
        isOpen={modalOpen}
        coupon={selected}
        loading={saving}
        onClose={() => {
          setModalOpen(false);
          setSelected(null);
        }}
        onSave={(d) => void handleSave(d)}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        type="danger"
        title="Xóa mã giảm giá?"
        confirmText="Xóa"
        loading={deleting}
        message={
          deleteTarget && (
            <>
              Xóa mã <strong>{deleteTarget.code}</strong>? Các đơn đã dùng mã vẫn giữ nguyên số tiền đã giảm.
              {deleteTarget.used_count > 0 && ' Nếu chỉ muốn ngừng phát hành, hãy bấm "Tạm ngưng" thay vì xóa.'}
            </>
          )
        }
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
};

export default CouponsPage;
