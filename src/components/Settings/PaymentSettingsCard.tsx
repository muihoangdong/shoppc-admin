import React, { useEffect, useState } from 'react';
import { BanknotesIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { apiErrorMessage } from '../../services/api';
import { PaymentSettings, paymentSettingsService } from '../../services/paymentSettingsService';

const inputClass = 'w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-500';

/** Giống backend: bỏ dấu, viết hoa, chỉ giữ chữ cái và khoảng trắng (đúng dạng tên trên app ngân hàng) */
const normalizeAccountName = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toUpperCase()
    .replace(/[^A-Z ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

/** Tài khoản ngân hàng nhận tiền chuyển khoản (chỉ admin): lưu vào database, dùng ngay cho mã VietQR của khách. */
const PaymentSettingsCard: React.FC = () => {
  const [data, setData] = useState<PaymentSettings | null>(null);
  const [form, setForm] = useState({ bank_code: 'VCB', account_no: '', account_name: '' });
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState('');

  const apply = (d: PaymentSettings) => {
    setData(d);
    setForm({ bank_code: d.bank_code || 'VCB', account_no: d.account_no, account_name: d.account_name });
  };

  useEffect(() => {
    paymentSettingsService
      .get()
      .then(apply)
      .catch((error) => setLoadError(apiErrorMessage(error, 'Không thể tải cài đặt thanh toán')));
  }, []);

  const save = async (values: typeof form) => {
    setSaving(true);
    try {
      const { message, data: d } = await paymentSettingsService.save(values);
      apply(d);
      toast.success(message);
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Không thể lưu'));
    } finally {
      setSaving(false);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const values = { bank_code: form.bank_code, account_no: form.account_no.replace(/\s+/g, ''), account_name: normalizeAccountName(form.account_name) };
    if (!/^[0-9]{6,19}$/.test(values.account_no)) return toast.error('Số tài khoản chỉ gồm 6–19 chữ số');
    if (values.account_name.length < 3) return toast.error('Nhập tên chủ tài khoản');
    void save(values);
  };

  const changed = !!data && (form.bank_code !== (data.bank_code || 'VCB') || form.account_no !== data.account_no || form.account_name !== data.account_name);
  const namePreview = normalizeAccountName(form.account_name);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm" data-testid="payment-settings">
      <div className="mb-5 flex items-start gap-4">
        <div className="rounded-2xl bg-green-100 p-3 text-green-700">
          <BanknotesIcon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Thanh toán chuyển khoản (VietQR)</h2>
          <p className="mt-1 text-sm text-slate-500">
            Tài khoản ngân hàng nhận tiền. Khách đặt đơn chọn “Chuyển khoản” sẽ thấy mã QR có sẵn số tiền và nội dung; chuyển xong bấm “Tôi đã chuyển khoản” thì
            trang quản trị báo ngay (kèm tiếng ting và email về hộp thư cửa hàng).
          </p>
        </div>
      </div>

      {loadError && <p role="alert" className="mb-4 rounded-2xl bg-red-50 p-4 text-sm text-red-700">{loadError}</p>}

      {data && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_240px]">
          <form onSubmit={onSubmit} noValidate className="space-y-4">
            <div>
              <label htmlFor="pay-bank" className="mb-2 block text-sm font-medium text-slate-700">Ngân hàng</label>
              <select id="pay-bank" value={form.bank_code} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm((f) => ({ ...f, bank_code: e.target.value }))} className={inputClass}>
                {data.banks.map((b) => (
                  <option key={b.code} value={b.code}>{b.name} ({b.code})</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="pay-no" className="mb-2 block text-sm font-medium text-slate-700">Số tài khoản</label>
              <input
                id="pay-no"
                inputMode="numeric"
                value={form.account_no}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, account_no: e.target.value.replace(/[^0-9 ]/g, '') }))}
                placeholder="Ví dụ: 1234567890"
                maxLength={25}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="pay-name" className="mb-2 block text-sm font-medium text-slate-700">Tên chủ tài khoản</label>
              <input
                id="pay-name"
                value={form.account_name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, account_name: e.target.value }))}
                placeholder="Ví dụ: NGUYEN VAN A"
                maxLength={60}
                className={inputClass}
              />
              {form.account_name && namePreview !== form.account_name && (
                <p className="mt-1 text-xs text-slate-500">Sẽ lưu là: <b>{namePreview}</b> (viết hoa không dấu như trên app ngân hàng)</p>
              )}
            </div>
            <div className="flex flex-wrap justify-end gap-3">
              {(data.bank_code || data.account_no) && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void save({ bank_code: '', account_no: '', account_name: '' })}
                  className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  Xóa (dùng tài khoản trong .env)
                </button>
              )}
              <button
                type="submit"
                disabled={saving || !changed}
                className="rounded-2xl bg-blue-600 px-5 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? 'Đang lưu...' : 'Lưu tài khoản'}
              </button>
            </div>
          </form>

          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-center text-sm">
            {data.active ? (
              <>
                <p className="font-semibold text-slate-900">Đang dùng</p>
                {data.sample_qr && <img src={data.sample_qr} alt="Mã QR thử 10.000đ" className="mx-auto mt-2 w-48 rounded-xl border bg-white p-1" />}
                <p className="mt-2 font-medium text-slate-800">{data.active.bank_name}</p>
                <p className="font-mono text-slate-800">{data.active.account_no}</p>
                <p className="text-slate-800">{data.active.account_name}</p>
                <p className="mt-2 text-xs text-slate-500">
                  {data.active.source === 'settings' ? 'Lấy từ trang này.' : 'Lấy từ file shoppc-be/.env (BANK_...).'} Quét thử bằng app ngân hàng (10.000đ, nội dung SHOPPC TEST) để kiểm tra đúng tên.
                </p>
              </>
            ) : (
              <p className="py-8 text-amber-700">Chưa có tài khoản nhận tiền — khách chọn chuyển khoản sẽ không thấy mã QR. Nhập số tài khoản bên cạnh rồi bấm Lưu.</p>
            )}
            <p className="mt-3 border-t pt-3 text-xs text-slate-500">
              {data.auto_confirm ? '✅ Đã bật SePay: đơn tự xác nhận khi tiền về.' : 'Xác nhận thủ công: khách bấm “Tôi đã chuyển khoản” → bạn kiểm tra app ngân hàng → bấm “Xác nhận đã nhận tiền” trong đơn.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentSettingsCard;
