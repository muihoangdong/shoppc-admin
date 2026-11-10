import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { OperationRow } from '../../services/operationsService';

export const inputClass = 'w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50';
export const buttonClass = 'inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 transition hover:border-blue-300 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40';
export const primaryClass = 'inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-40';
export const labels: Record<string, string> = {
  draft: 'Nháp', received: 'Đã tiếp nhận', cancelled: 'Đã hủy', in_stock: 'Trong kho', sold: 'Đã bán', returned: 'Đã nhận trả', repair: 'Đang bảo hành', retired: 'Đã thu hồi',
  diagnosing: 'Đang kiểm tra', repairing: 'Đang sửa chữa', resolved: 'Đã xử lý', rejected: 'Từ chối', requested: 'Chờ duyệt', approved: 'Đã duyệt', refunded: 'Đã ghi hoàn tiền',
  created: 'Đã tạo', picked_up: 'Đã bàn giao', in_transit: 'Đang vận chuyển', delivered: 'Giao thành công', failed: 'Giao thất bại',
  receipt: 'Nhập hàng', sale: 'Xuất/giữ đơn bán', cancel: 'Hoàn do hủy đơn', return: 'Nhận hàng trả', adjustment: 'Điều chỉnh', import: 'Nhập CSV', opening: 'Tồn ban đầu',
  pending: 'Chờ xử lý', processing: 'Đang xử lý', shipped: 'Đang giao', completed: 'Hoàn tất', paid: 'Đã thanh toán',
  closed: 'Kết thúc (không hoàn tiền)',
};
export const money = (v: any) => Number(v || 0).toLocaleString('vi-VN') + ' ₫';
export const dateTime = (v: any) => v ? new Date(v).toLocaleString('vi-VN') : '—';
export const Status: React.FC<{ value: any }> = ({ value }) => {
  const color = ['received', 'resolved', 'delivered', 'refunded', 'in_stock', 'paid'].includes(value) ? 'bg-green-50 text-green-700 border-green-200'
    : ['cancelled', 'rejected', 'failed', 'retired'].includes(value) ? 'bg-red-50 text-red-700 border-red-200' : 'bg-blue-50 text-blue-700 border-blue-200';
  return <span className={`inline-flex whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium ${color}`}>{labels[value] || value || '—'}</span>;
};

export const Field: React.FC<{ label: string; children: React.ReactNode; hint?: string }> = ({ label, children, hint }) => (
  <label className="block min-w-0 space-y-1"><span className="text-xs font-medium text-slate-600">{label}</span>{children}{hint && <span className="block text-xs text-slate-400">{hint}</span>}</label>
);

export const TextField: React.FC<{ label: string; value: any; onChange: (value: string) => void; required?: boolean; type?: string; min?: number; max?: number; textarea?: boolean; hint?: string }> = ({ label, value, onChange, textarea, hint, ...props }) => (
  <Field label={label} hint={hint}>{textarea ? <textarea aria-label={label} rows={3} className={inputClass} value={value ?? ''} onChange={(e) => onChange(e.target.value)} required={props.required} />
    : <input aria-label={label} className={inputClass} value={value ?? ''} onChange={(e) => onChange(e.target.value)} {...props} />}</Field>
);

export const SelectField: React.FC<{ label: string; value: any; onChange: (value: string) => void; items: OperationRow[]; text?: (row: OperationRow) => string; required?: boolean }> = ({ label, value, onChange, items, text, required = true }) => (
  <Field label={label}><select aria-label={label} required={required} className={inputClass} value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
    <option value="">— Chọn —</option>{items.map((i) => <option key={i.id} value={i.id}>{text ? text(i) : i.name}</option>)}
  </select></Field>
);

export const OperationModal: React.FC<{ title: string; busy: boolean; onClose: () => void; onSubmit: () => void; children: React.ReactNode; error?: string; submitLabel?: string; readOnly?: boolean }> = ({ title, busy, onClose, onSubmit, children, error, submitLabel = 'Lưu', readOnly }) => {
  const root = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    root.current?.querySelector<HTMLElement>('input, select, textarea, button')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) close.current();
      if (e.key === 'Tab') {
        const elements = root.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled)');
        if (!elements?.length) return;
        const first = elements[0], last = elements[elements.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = overflow; window.removeEventListener('keydown', onKey); previous?.focus(); };
  }, [busy]);
  return createPortal(<div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-3 backdrop-blur-sm" onClick={() => !busy && onClose()}>
    <div ref={root} role="dialog" aria-modal="true" aria-label={title} className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between border-b border-slate-200 p-5"><h2 className="text-lg font-bold text-slate-900">{title}</h2><button type="button" disabled={busy} aria-label="Đóng" onClick={onClose} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"><XMarkIcon className="h-5 w-5" /></button></div>
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-4 p-5">
        <fieldset disabled={busy || readOnly} className="min-w-0 space-y-4">{children}</fieldset>
        {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <div className="flex justify-end gap-2 border-t border-slate-200 pt-4"><button type="button" disabled={busy} onClick={onClose} className={buttonClass}>Đóng</button>{!readOnly && <button type="submit" disabled={busy} className={primaryClass}>{busy ? 'Đang xử lý…' : submitLabel}</button>}</div>
      </form>
    </div>
  </div>, document.body);
};
