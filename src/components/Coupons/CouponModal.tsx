import React, { useEffect, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Coupon, CouponType } from '../../types';
import { CouponInput } from '../../services/couponService';
import { formatPrice } from '../../utils/formatters';

interface CouponModalProps {
  isOpen: boolean;
  coupon: Coupon | null;
  loading?: boolean;
  onClose: () => void;
  onSave: (data: CouponInput) => void;
}

const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none';
const labelClass = 'block text-sm font-medium text-gray-700 mb-1';

/** Gợi ý mã ngẫu nhiên dễ đọc (không có 0/O, 1/I). */
const randomCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return `SALE${Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')}`;
};
const numOrNull = (s: string) => (s.trim() === '' ? null : Number(s));
const digitsOnly = (s: string) => s.replace(/[^\d]/g, '');

const empty = {
  code: '',
  description: '',
  type: 'percentage' as CouponType,
  value: '',
  min_order_value: '',
  max_discount: '',
  usage_limit: '',
  once_per_customer: false,
  starts_on: '',
  expires_on: '',
  is_active: true,
};

export const CouponModal: React.FC<CouponModalProps> = ({ isOpen, coupon, loading = false, onClose, onSave }) => {
  const [f, setF] = useState(empty);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setError('');
    setF(
      coupon
        ? {
            code: coupon.code,
            description: coupon.description ?? '',
            type: coupon.type,
            value: String(coupon.value),
            min_order_value: coupon.min_order_value ? String(coupon.min_order_value) : '',
            max_discount: coupon.max_discount ? String(coupon.max_discount) : '',
            usage_limit: coupon.usage_limit ? String(coupon.usage_limit) : '',
            once_per_customer: coupon.once_per_customer,
            starts_on: coupon.starts_on ?? '',
            expires_on: coupon.expires_on ?? '',
            is_active: coupon.is_active,
          }
        : { ...empty, code: randomCode() }
    );
  }, [isOpen, coupon]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => {
    setF((prev) => ({ ...prev, [k]: v }));
    setError('');
  };
  const percent = f.type === 'percentage';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    const code = f.code.replace(/\s+/g, '').toUpperCase();
    const value = Number(f.value);
    const min = numOrNull(f.min_order_value) ?? 0;
    if (!/^[A-Z0-9_-]{3,30}$/.test(code)) return setError('Mã phải dài 3–30 ký tự, chỉ gồm chữ không dấu, số, "-" hoặc "_"');
    if (!value || value <= 0) return setError('Nhập mức giảm');
    if (percent && value > 100) return setError('Giảm theo % chỉ được từ 1 đến 100');
    if (!percent && min > 0 && value > min) return setError('Mức giảm không được lớn hơn giá trị đơn tối thiểu');
    if (f.starts_on && f.expires_on && f.starts_on > f.expires_on) return setError('Ngày hết hạn phải sau ngày bắt đầu');
    const limit = numOrNull(f.usage_limit);
    if (coupon && limit !== null && limit < coupon.used_count) return setError(`Số lượt không được nhỏ hơn số lượt đã dùng (${coupon.used_count})`);
    onSave({
      code,
      description: f.description.trim() || null,
      type: f.type,
      value,
      min_order_value: min,
      max_discount: percent ? numOrNull(f.max_discount) : null,
      usage_limit: limit,
      once_per_customer: f.once_per_customer,
      starts_on: f.starts_on || null,
      expires_on: f.expires_on || null,
      is_active: f.is_active,
    });
  };

  // Ví dụ minh họa ngay trong form để tránh nhập nhầm % với số tiền
  const sample = Math.max(Number(f.min_order_value) || 0, 10000000);
  const sampleDiscount = (() => {
    const v = Number(f.value) || 0;
    if (!v) return 0;
    let d = percent ? Math.floor((sample * v) / 100) : v;
    if (percent && Number(f.max_discount) > 0) d = Math.min(d, Number(f.max_discount));
    return Math.min(d, sample);
  })();

  const title = coupon ? `Sửa mã ${coupon.code}` : 'Tạo mã giảm giá';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div role="dialog" aria-modal="true" aria-label={title} className="bg-white rounded-lg w-full max-w-lg max-h-[92vh] flex flex-col">
        <div className="flex justify-between items-center px-6 py-4 border-b">
          <h2 className="text-xl font-bold">{title}</h2>
          <button onClick={onClose} disabled={loading} aria-label="Đóng" className="p-1 hover:bg-gray-100 rounded disabled:opacity-50">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div>
            <label htmlFor="cp-code" className={labelClass}>Mã <span className="text-red-500">*</span></label>
            <div className="flex gap-2">
              <input
                id="cp-code"
                value={f.code}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => set('code', e.target.value.toUpperCase())}
                className={`${inputClass} font-mono uppercase`}
                maxLength={30}
                placeholder="VD: TET2027"
                autoComplete="off"
              />
              {!coupon && (
                <button type="button" onClick={() => set('code', randomCode())} className="shrink-0 rounded-lg border border-gray-300 px-3 text-sm text-gray-700 hover:bg-gray-50">
                  Tạo ngẫu nhiên
                </button>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="cp-desc" className={labelClass}>Mô tả (khách sẽ thấy)</label>
            <input id="cp-desc" value={f.description} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set('description', e.target.value)} className={inputClass} maxLength={255} placeholder="VD: Ưu đãi Tết cho khách hàng thân thiết" />
          </div>

          <fieldset>
            <legend className={labelClass}>Loại giảm giá</legend>
            <div className="grid grid-cols-2 gap-2">
              {([['percentage', 'Theo %'], ['fixed', 'Số tiền cố định']] as const).map(([t, label]) => (
                <label key={t} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${f.type === t ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-300 text-gray-700'}`}>
                  <input type="radio" name="cp-type" value={t} checked={f.type === t} onChange={() => set('type', t)} className="text-blue-600" />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="cp-value" className={labelClass}>{percent ? 'Giảm (%)' : 'Giảm (₫)'} <span className="text-red-500">*</span></label>
              <input id="cp-value" inputMode="numeric" value={f.value} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set('value', digitsOnly(e.target.value))} className={inputClass} placeholder={percent ? '10' : '200000'} />
            </div>
            {percent && (
              <div>
                <label htmlFor="cp-max" className={labelClass}>Giảm tối đa (₫)</label>
                <input id="cp-max" inputMode="numeric" value={f.max_discount} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set('max_discount', digitsOnly(e.target.value))} className={inputClass} placeholder="Để trống = không giới hạn" />
              </div>
            )}
            <div>
              <label htmlFor="cp-min" className={labelClass}>Đơn tối thiểu (₫)</label>
              <input id="cp-min" inputMode="numeric" value={f.min_order_value} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set('min_order_value', digitsOnly(e.target.value))} className={inputClass} placeholder="Để trống = không yêu cầu" />
            </div>
            <div>
              <label htmlFor="cp-limit" className={labelClass}>Tổng số lượt dùng</label>
              <input id="cp-limit" inputMode="numeric" value={f.usage_limit} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set('usage_limit', digitsOnly(e.target.value))} className={inputClass} placeholder="Để trống = không giới hạn" />
            </div>
            <div>
              <label htmlFor="cp-start" className={labelClass}>Bắt đầu từ ngày</label>
              <input id="cp-start" type="date" value={f.starts_on} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set('starts_on', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label htmlFor="cp-end" className={labelClass}>Hết hạn sau ngày</label>
              <input id="cp-end" type="date" value={f.expires_on} min={f.starts_on || undefined} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set('expires_on', e.target.value)} className={inputClass} />
            </div>
          </div>
          <p className="-mt-2 text-xs text-gray-500">Để trống ngày = không giới hạn. Mã dùng được cả trong ngày hết hạn.</p>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={f.once_per_customer} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set('once_per_customer', e.target.checked)} className="rounded text-blue-600" />
              Mỗi khách chỉ dùng 1 lần (theo số điện thoại hoặc email)
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={f.is_active} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set('is_active', e.target.checked)} className="rounded text-blue-600" />
              Đang áp dụng
            </label>
          </div>

          {Number(f.value) > 0 && (
            <p className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-800">
              Ví dụ: đơn {formatPrice(sample)} tiền hàng được giảm <b>{formatPrice(sampleDiscount)}</b>.
            </p>
          )}

          {error && (
            <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} disabled={loading} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50">
              Hủy
            </button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {loading ? 'Đang lưu…' : coupon ? 'Lưu thay đổi' : 'Tạo mã'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
