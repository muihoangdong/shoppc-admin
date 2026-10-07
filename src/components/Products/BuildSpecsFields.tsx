import React, { useEffect, useState } from 'react';
import { CpuChipIcon } from '@heroicons/react/24/outline';
import api from '../../services/api';

/** Định nghĩa từ server (GET /api/builder/config) — nguồn duy nhất, khớp với kiểm tra ở backend. */
export interface BuildField {
  key: string;
  label: string;
  type: 'text' | 'int' | 'bool' | 'enum' | 'multi';
  required?: boolean;
  options?: string[];
  example?: string;
  min?: number;
  max?: number;
}
export interface PartTypeDef {
  key: string;
  label: string;
  fields: BuildField[];
}

let cached: PartTypeDef[] | null = null;

export type BuildSpecsValue = Record<string, unknown>;

interface Props {
  partType: string;
  specs: BuildSpecsValue;
  onChange: (partType: string, specs: BuildSpecsValue) => void;
  error?: string;
}

const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm';

/** Thông số còn thiếu (bắt buộc) — kiểm tra nhanh trước khi gửi, server vẫn kiểm tra lại đầy đủ. */
export function missingBuildFields(defs: PartTypeDef[] | null, partType: string, specs: BuildSpecsValue): string[] {
  const def = defs?.find((d) => d.key === partType);
  if (!def) return [];
  return def.fields
    .filter((f) => f.required)
    .filter((f) => {
      const v = specs[f.key];
      return v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0);
    })
    .map((f) => f.label);
}

export const usePartTypes = () => {
  const [defs, setDefs] = useState<PartTypeDef[] | null>(cached);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (cached) return;
    api
      .get('/builder/config')
      .then((r) => {
        cached = r.data.data.part_types;
        setDefs(cached);
      })
      .catch(() => setFailed(true));
  }, []);
  return { defs, failed };
};

/** Chọn loại linh kiện + nhập thông số để trang Build PC kiểm tra tương thích (socket, loại RAM, công suất...). */
const BuildSpecsFields: React.FC<Props> = ({ partType, specs, onChange, error }) => {
  const { defs, failed } = usePartTypes();
  const def = defs?.find((d) => d.key === partType);
  const set = (key: string, value: unknown) => onChange(partType, { ...specs, [key]: value });

  return (
    <div className="rounded-lg border border-indigo-200 bg-indigo-50/40 p-4">
      <div className="mb-3 flex items-center gap-2">
        <CpuChipIcon className="h-5 w-5 text-indigo-600" />
        <span className="text-sm font-semibold text-gray-800">Build PC (linh kiện)</span>
      </div>
      {failed && <p className="mb-2 text-xs text-red-600">Không tải được danh sách loại linh kiện từ máy chủ.</p>}
      <label htmlFor="pf-part-type" className="block text-sm font-medium text-gray-700 mb-1">
        Loại linh kiện
      </label>
      <select
        id="pf-part-type"
        value={partType}
        onChange={(e) => onChange(e.target.value, {})}
        className={inputClass}
        disabled={!defs}
      >
        <option value="">Không phải linh kiện (không hiện ở trang Build PC)</option>
        {defs?.map((d) => (
          <option key={d.key} value={d.key}>
            {d.label}
          </option>
        ))}
      </select>

      {def && (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {def.fields.map((f) => {
            const id = `pf-bs-${f.key}`;
            const label = (
              <label htmlFor={id} className="block text-xs font-medium text-gray-700 mb-1">
                {f.label} {f.required && <span className="text-red-500">*</span>}
              </label>
            );
            const val = specs[f.key];
            if (f.type === 'bool') {
              return (
                <div key={f.key}>
                  {label}
                  <select id={id} className={inputClass} value={val === true ? 'true' : val === false ? 'false' : ''} onChange={(e) => set(f.key, e.target.value === '' ? '' : e.target.value === 'true')}>
                    <option value="">— Chọn —</option>
                    <option value="true">Có</option>
                    <option value="false">Không</option>
                  </select>
                </div>
              );
            }
            if (f.type === 'enum') {
              return (
                <div key={f.key}>
                  {label}
                  <select id={id} className={inputClass} value={String(val ?? '')} onChange={(e) => set(f.key, e.target.value)}>
                    <option value="">— Chọn —</option>
                    {f.options?.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              );
            }
            if (f.type === 'multi' && f.options) {
              const list = Array.isArray(val) ? (val as string[]) : [];
              return (
                <div key={f.key}>
                  <span className="block text-xs font-medium text-gray-700 mb-1">
                    {f.label} {f.required && <span className="text-red-500">*</span>}
                  </span>
                  <div className="flex flex-wrap gap-3 py-2">
                    {f.options.map((o) => (
                      <label key={o} className="flex items-center gap-1 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={list.includes(o)}
                          onChange={(e) => set(f.key, e.target.checked ? [...list, o] : list.filter((x) => x !== o))}
                        />
                        {o}
                      </label>
                    ))}
                  </div>
                </div>
              );
            }
            const shown = f.type === 'multi' && Array.isArray(val) ? (val as string[]).join(', ') : String(val ?? '');
            return (
              <div key={f.key}>
                {label}
                <input
                  id={id}
                  type={f.type === 'int' ? 'number' : 'text'}
                  inputMode={f.type === 'int' ? 'numeric' : undefined}
                  min={f.min}
                  max={f.max}
                  placeholder={f.example ? `VD: ${f.example}` : ''}
                  className={inputClass}
                  value={shown}
                  onChange={(e) => set(f.key, f.type === 'int' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value)}
                />
              </div>
            );
          })}
        </div>
      )}
      {error && (
        <p role="alert" className="mt-2 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
};

export default BuildSpecsFields;
