import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { ArrowDownTrayIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { operationsService, OperationRow } from '../services/operationsService';
import { parseProductCsv, PRODUCT_CSV_TEMPLATE, downloadBlob } from '../utils/productCsv';
import { buttonClass, primaryClass, inputClass, OperationModal, TextField } from '../components/Operations/OperationUI';
import usePageTitle from '../hooks/usePageTitle';

interface Preview { valid: boolean; fingerprint: string; items: OperationRow[]; creates: number; updates: number }

const BulkDataPage: React.FC = () => {
  usePageTitle('Nhập / xuất dữ liệu');
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [filename, setFilename] = useState('');
  const [preview, setPreview] = useState<Preview | null>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState(false);
  const check = async (input = rows) => {
    if (!input.length) return;
    setBusy(true); setError(''); setPreview(null);
    try { setPreview(await operationsService.save('bulk/preview', { rows: input }) as unknown as Preview); }
    catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  };
  const choose = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; event.target.value = '';
    if (!file) return;
    setPreview(null); setRows([]); setError(''); setFilename('');
    if (!file.name.toLowerCase().endsWith('.csv') || file.size > 2 * 1024 * 1024) { setError('Chọn file CSV UTF-8 tối đa 2 MB'); return; }
    try { const parsed = parseProductCsv(await file.text()); setRows(parsed); setFilename(file.name); await check(parsed); }
    catch (err) { setError((err as Error).message); }
  };
  const apply = async () => {
    if (!preview?.valid || !reason.trim()) return;
    setBusy(true); setError('');
    try {
      const result = await operationsService.save('bulk/apply', { rows, fingerprint: preview.fingerprint, reason });
      toast.success(result.summary || 'Nhập dữ liệu thành công'); setConfirm(false); setPreview(null); setRows([]); setFilename('');
    } catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  };
  const exportData = async () => {
    setBusy(true); setError('');
    try { downloadBlob(await operationsService.exportProducts(), `san-pham-${new Date().toISOString().slice(0, 10)}.csv`); }
    catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  };
  return <div className="space-y-5">
    <div><h1 className="text-2xl font-bold text-slate-900">Nhập / xuất dữ liệu hàng loạt</h1><p className="mt-1 text-sm text-slate-500">CSV UTF-8 mở được bằng Excel. Xem trước lỗi từng dòng trước khi nhập; nếu một dòng lỗi, toàn bộ giao dịch được hủy.</p></div>
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="frost-card space-y-3 p-5"><h2 className="font-semibold text-slate-800">Xuất dữ liệu</h2><p className="text-sm text-slate-500">Xuất sản phẩm, SKU, danh mục, thương hiệu, giá, tồn kho và thông số. Tối đa 10.000 sản phẩm/lần.</p><button className={buttonClass} disabled={busy} onClick={() => void exportData()}><ArrowDownTrayIcon className="h-4 w-4" />Xuất sản phẩm CSV</button><button className={`${buttonClass} ml-2`} onClick={() => downloadBlob(new Blob([PRODUCT_CSV_TEMPLATE], { type: 'text/csv;charset=utf-8' }), 'mau-nhap-san-pham.csv')}>Tải file mẫu</button></section>
      <section className="frost-card space-y-3 p-5"><h2 className="font-semibold text-slate-800">Nhập sản phẩm</h2><p className="text-sm text-slate-500">Tối đa 500 dòng, file 2 MB. Có ID thì cập nhật theo ID; thiếu ID thì tìm theo SKU, chưa có SKU sẽ tạo mới.</p><label className={`${buttonClass} cursor-pointer`}><ArrowUpTrayIcon className="h-4 w-4" />Chọn file CSV<input type="file" accept=".csv,text/csv" aria-label="Chọn file CSV sản phẩm" className="hidden" disabled={busy} onChange={(e) => void choose(e)} /></label><p className="text-xs text-slate-400">{filename || 'Chưa chọn file'}</p></section>
    </div>
    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">Cột bắt buộc: <code>sku, name, category_id, price, stock</code>. Dùng ID danh mục/hãng/mẫu thông số trong admin. Trường <code>specs</code> là JSON. Hàng theo serial phải nhập với tồn 0 rồi lập phiếu nhập; không tăng/giảm tồn hàng theo serial bằng CSV. Khi cập nhật, các cột trong file sẽ thay thế giá trị hiện có; nên xuất dữ liệu trước khi chỉnh hàng loạt.</div>
    {error && !confirm && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {busy && !confirm && <p className="text-sm text-slate-500">Đang xử lý…</p>}
    {preview && <section className="frost-card overflow-hidden"><div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 p-4"><span className="text-sm text-slate-700">{rows.length} dòng · {preview.creates} tạo mới · {preview.updates} cập nhật · {preview.items.filter((i) => i.error).length} lỗi</span><button className={buttonClass} disabled={busy} onClick={() => void check()}>Xem trước lại</button></div>
      <div className="max-h-[28rem] overflow-auto"><table className="w-full text-left text-sm"><thead className="sticky top-0 bg-slate-50 text-xs text-slate-500"><tr>{['Dòng', 'Thao tác', 'SKU', 'Sản phẩm', 'Tồn kho', 'Kết quả'].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{preview.items.map((i) => <tr key={i.row} className={i.error ? 'bg-red-50 text-red-700' : 'text-slate-700'}><td className="px-4 py-2">{i.row}</td><td className="px-4 py-2">{i.action === 'create' ? 'Tạo mới' : i.action === 'update' ? 'Cập nhật' : 'Lỗi'}</td><td className="px-4 py-2">{i.data?.sku || rows[i.row - 2]?.sku}</td><td className="px-4 py-2">{i.data?.name || rows[i.row - 2]?.name}</td><td className="px-4 py-2">{i.data ? `${i.before_stock} → ${i.data.stock}` : '—'}</td><td className="px-4 py-2">{i.error || 'Hợp lệ'}</td></tr>)}</tbody></table></div>
      <div className="space-y-3 border-t border-slate-200 p-4"><TextField label="Lý do nhập / cập nhật dữ liệu" value={reason} onChange={setReason} required /><button className={primaryClass} disabled={busy || !preview.valid || !reason.trim()} onClick={() => { setError(''); setConfirm(true); }}>Xác nhận nhập {rows.length} dòng</button></div>
    </section>}
    {confirm && <OperationModal title="Xác nhận nhập dữ liệu" busy={busy} onClose={() => setConfirm(false)} onSubmit={() => void apply()} error={error} submitLabel="Nhập dữ liệu"><p className="text-sm text-slate-600">Tạo mới {preview?.creates} và cập nhật {preview?.updates} sản phẩm từ <b>{filename}</b>. Giá, tồn và thông số có thể thay đổi. Hệ thống sẽ ghi nhật ký và lịch sử tồn kho.</p><textarea aria-label="Lý do nhập" className={inputClass} required value={reason} onChange={(e) => setReason(e.target.value)} /></OperationModal>}
  </div>;
};

export default BulkDataPage;
