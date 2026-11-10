import React, { useState } from 'react';
import { ArrowLeftIcon, ArrowRightIcon, StarIcon, TrashIcon } from '@heroicons/react/24/outline';
import FileUploadButton from './FileUploadButton';

interface Props {
  value: string[];
  onChange: (images: string[]) => void;
  disabled: boolean;
  onBusyChange: (busy: boolean) => void;
  error?: string;
}

const ProductImagesField: React.FC<Props> = ({ value, onChange, disabled, onBusyChange, error }) => {
  const [link, setLink] = useState('');
  const [linkError, setLinkError] = useState('');
  const addLink = () => {
    const url = link.trim();
    if (!url || url.length > 500 || !/^(https?:\/\/|\/(?!\/))/i.test(url)) {
      setLinkError('Nhập link ảnh http(s):// hoặc /, tối đa 500 ký tự');
      return;
    }
    if (value.length >= 20) { setLinkError('Tối đa 20 ảnh/sản phẩm'); return; }
    if (value.includes(url)) { setLinkError('Ảnh này đã có trong thư viện'); return; }
    onChange([...value, url]);
    setLink('');
    setLinkError('');
  };
  const move = (from: number, to: number) => {
    const next = [...value];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };
  return (
    <section aria-label="Thư viện ảnh sản phẩm" className="rounded-xl border border-slate-200 p-4">
      <div className="mb-1 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-800">Hình ảnh sản phẩm</h3>
        <span className="text-xs text-slate-500">{value.length}/20 ảnh</span>
      </div>
      <p className="text-xs text-slate-500">Ảnh đầu tiên là ảnh chính. Dùng nút ngôi sao để chọn ảnh chính; mũi tên để sắp xếp thứ tự.</p>
      <FileUploadButton kind="image" maxFiles={Math.max(1, 20 - value.length)} disabled={disabled || value.length >= 20}
        onBusyChange={onBusyChange} onUploaded={(files) => onChange([...new Set([...value, ...files.map((f) => f.url)])])} />
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input aria-label="Link ảnh bổ sung" value={link} disabled={disabled || value.length >= 20}
          onChange={(e) => { setLink(e.target.value); setLinkError(''); }}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addLink(); } }}
          placeholder="Hoặc dán link ảnh https://…"
          className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <button type="button" onClick={addLink} disabled={disabled || value.length >= 20} className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-40">Thêm link ảnh</button>
      </div>
      {(linkError || error) && <p role="alert" className="mt-2 text-xs text-red-600">{linkError || error}</p>}
      {value.length > 0 && (
        <ol className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {value.map((url, index) => (
            <li key={url} className={`min-w-0 overflow-hidden rounded-lg border bg-white ${index === 0 ? 'border-blue-500 ring-1 ring-blue-500' : 'border-slate-200'}`}>
              <div className="relative aspect-square bg-slate-50 p-2">
                <img src={url} alt={`Ảnh sản phẩm ${index + 1}`} className="h-full w-full object-contain" />
                <span className="absolute left-1 top-1 rounded bg-slate-900/70 px-1.5 py-0.5 text-[10px] text-white">{index === 0 ? 'Ảnh chính' : index + 1}</span>
              </div>
              <div className="flex items-center justify-between gap-1 p-1.5">
                <button type="button" title="Chọn làm ảnh chính" aria-label={`Chọn ảnh ${index + 1} làm ảnh chính`} disabled={disabled || index === 0} onClick={() => move(index, 0)} className="rounded p-1 text-blue-600 hover:bg-blue-50 disabled:opacity-40"><StarIcon className="h-4 w-4" /></button>
                <button type="button" aria-label={`Di chuyển ảnh ${index + 1} sang trái`} disabled={disabled || index === 0} onClick={() => move(index, index - 1)} className="rounded p-1 text-slate-600 hover:bg-slate-100 disabled:opacity-30"><ArrowLeftIcon className="h-4 w-4" /></button>
                <button type="button" aria-label={`Di chuyển ảnh ${index + 1} sang phải`} disabled={disabled || index === value.length - 1} onClick={() => move(index, index + 1)} className="rounded p-1 text-slate-600 hover:bg-slate-100 disabled:opacity-30"><ArrowRightIcon className="h-4 w-4" /></button>
                <button type="button" aria-label={`Xóa ảnh ${index + 1}`} disabled={disabled} onClick={() => onChange(value.filter((_, i) => i !== index))} className="rounded p-1 text-red-600 hover:bg-red-50 disabled:opacity-40"><TrashIcon className="h-4 w-4" /></button>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
};

export default ProductImagesField;
