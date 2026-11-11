import React, { useEffect, useRef, useState } from 'react';
import { CubeIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { storefrontAsset } from '../../utils/storefront';
import FileUploadButton from './FileUploadButton';

const dimensionFields = [
  { key: 'length', label: 'Dài' },
  { key: 'width', label: 'Rộng' },
  { key: 'height', label: 'Cao' },
] as const;
type Dimension = (typeof dimensionFields)[number]['key'];

export interface Model3dValue {
  glb: string;
  usdz: string;
  poster: string;
  enabled: boolean;
  dimensions: Record<Dimension, string>;
}

export const EMPTY_MODEL3D: Model3dValue = { glb: '', usdz: '', poster: '', enabled: true, dimensions: { length: '', width: '', height: '' } };

const URL_RE = /^(https?:\/\/|\/(?!\/))/i;
const ext = (url: string) => url.split(/[?#]/)[0].toLowerCase();

const validateModelLinks = (v: Model3dValue): string => {
  const glb = v.glb.trim();
  const usdz = v.usdz.trim();
  const poster = v.poster.trim();
  if (!glb) return usdz || poster ? 'Cần tải lên hoặc nhập link GLB/GLTF để bật xem 3D' : '';
  if (!URL_RE.test(glb)) return 'Link GLB phải bắt đầu bằng http://, https:// hoặc /';
  if (!/\.(glb|gltf)$/.test(ext(glb))) return 'Link GLB phải là file .glb hoặc .gltf';
  if (usdz && (!URL_RE.test(usdz) || !ext(usdz).endsWith('.usdz'))) return 'Link USDZ phải là file .usdz bắt đầu bằng http(s):// hoặc /';
  if (poster && !URL_RE.test(poster)) return 'Link ảnh chờ phải bắt đầu bằng http://, https:// hoặc /';
  return '';
};

const parseDimension = (text: string) => {
  const value = text.trim().replace(',', '.');
  if (!/^(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(value)) return undefined;
  const cm = Number(value);
  return Number.isFinite(cm) && cm > 0 ? cm : undefined;
};

export const validateModel3d = (v: Model3dValue): string => {
  const linkError = validateModelLinks(v);
  if (linkError) return linkError;
  for (const { key, label } of dimensionFields) {
    if (!v.dimensions[key].trim()) continue;
    if (!v.glb.trim()) return 'Cần tải lên hoặc nhập link GLB/GLTF để lưu kích thước 3D';
    if (parseDimension(v.dimensions[key]) === undefined) return `${label} phải là số lớn hơn 0 (cm)`;
  }
  return '';
};

export const toPayload = (v: Model3dValue) => {
  if (!v.glb.trim()) return null;
  const dimensions: Partial<Record<Dimension, number>> = {};
  for (const { key } of dimensionFields) {
    const value = parseDimension(v.dimensions[key]);
    if (value !== undefined) dimensions[key] = value;
  }
  return {
    glb_url: v.glb.trim(),
    ...(v.usdz.trim() ? { usdz_url: v.usdz.trim() } : {}),
    ...(v.poster.trim() ? { poster_url: v.poster.trim() } : {}),
    ...(Object.keys(dimensions).length ? { dimensions_cm: dimensions } : {}),
    enabled: v.enabled,
  };
};

interface Props {
  value: Model3dValue;
  onChange: (next: Model3dValue) => void;
  error?: string;
  /** Ảnh sản phẩm: dùng làm ảnh chờ khi xem thử */
  imageUrl?: string;
  disabled?: boolean;
  onBusyChange: (busy: boolean) => void;
}

const inputClass = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

/**
 * Mô hình 3D / AR của sản phẩm: link file GLB (bắt buộc để bật 3D), USDZ cho iPhone (tùy chọn), ảnh chờ.
 * Có nút "Xem thử" dùng chính <model-viewer> như trang cửa hàng để kiểm tra file tải được và hiển thị đúng.
 */
const Model3dFields: React.FC<Props> = ({ value, onChange, error, imageUrl, disabled, onBusyChange }) => {
  const [preview, setPreview] = useState(false);
  const set = (patch: Partial<Model3dValue>) => onChange({ ...value, ...patch });
  const hasGlb = !!value.glb.trim() && !validateModelLinks(value);

  useEffect(() => {
    if (!hasGlb) setPreview(false);
  }, [hasGlb]);

  return (
    <fieldset className="rounded-xl border border-slate-200 p-4">
      <legend className="flex items-center gap-1.5 px-1 text-sm font-medium text-slate-700">
        <CubeIcon className="h-4 w-4 text-blue-600" /> Mô hình 3D / AR
      </legend>
      <FileUploadButton kind="model" disabled={disabled} onBusyChange={onBusyChange} onUploaded={(files) => {
        const patch: Partial<Model3dValue> = {};
        for (const file of files) {
          if (file.type === 'usdz') patch.usdz = file.url;
          else { patch.glb = file.url; patch.enabled = true; }
        }
        set(patch);
        if (patch.glb) setPreview(true);
      }} />

      <div className="mt-3 space-y-3">
        <div>
          <label htmlFor="pf-glb" className="mb-1 block text-xs font-medium text-slate-600">
            Link file GLB / GLTF
          </label>
          <div className="flex gap-2">
            <input id="pf-glb" type="text" value={value.glb} onChange={(e) => set({ glb: e.target.value })} placeholder="/models/ryzen-7-9800x3d.glb" className={inputClass} />
            <button
              type="button"
              disabled={!hasGlb}
              onClick={() => setPreview((v) => !v)}
              className="shrink-0 rounded-lg border border-blue-300 px-3 py-2 text-sm text-blue-700 hover:bg-blue-50 disabled:opacity-40"
            >
              {preview ? 'Ẩn xem thử' : 'Xem thử'}
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="pf-usdz" className="mb-1 block text-xs font-medium text-slate-600">
              Link USDZ cho iPhone/iPad <span className="text-slate-400">(tùy chọn)</span>
            </label>
            <input id="pf-usdz" type="text" value={value.usdz} onChange={(e) => set({ usdz: e.target.value })} placeholder="Trống: tự chuyển từ GLB" className={inputClass} />
          </div>
          <div>
            <label htmlFor="pf-poster" className="mb-1 block text-xs font-medium text-slate-600">
              Ảnh chờ khi tải <span className="text-slate-400">(tùy chọn)</span>
            </label>
            <input id="pf-poster" type="text" value={value.poster} onChange={(e) => set({ poster: e.target.value })} placeholder="Trống: dùng ảnh sản phẩm" className={inputClass} />
          </div>
        </div>
        <fieldset>
          <legend className="mb-1 text-sm font-medium text-slate-700">Kích thước hiển thị (cm)</legend>
          <div className="grid grid-cols-3 gap-3">
            {dimensionFields.map(({ key, label }) => (
              <label key={key} className="block text-xs font-medium text-slate-600">
                <span className="mb-1 block">{label}</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={value.dimensions[key]}
                  onChange={(e) => set({ dimensions: { ...value.dimensions, [key]: e.target.value } })}
                  aria-describedby="pf-dimensions-hint"
                  className={inputClass}
                />
              </label>
            ))}
          </div>
          <p id="pf-dimensions-hint" className="mt-1 text-xs text-slate-500">Ô để trống và chế độ AR dùng kích thước trong file mô hình.</p>
        </fieldset>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={value.enabled} onChange={(e) => set({ enabled: e.target.checked })} className="h-4 w-4 rounded border-slate-300 text-blue-600" />
          Hiện nút xem 3D trên cửa hàng
        </label>
      </div>

      {error && (
        <p role="alert" className="mt-2 text-xs text-red-600">
          {error}
        </p>
      )}

      {preview && hasGlb && (
        <ModelPreview src={storefrontAsset(value.glb.trim())} poster={value.poster.trim() || imageUrl} dimensions={value.dimensions} />
      )}
    </fieldset>
  );
};

/** Xem thử file GLB bằng <model-viewer> (nạp thư viện khi cần) */
const ModelPreview: React.FC<{ src: string; poster?: string; dimensions: Model3dValue['dimensions'] }> = ({ src, poster, dimensions }) => {
  const [ready, setReady] = useState(false);
  const [state, setState] = useState<'loading' | 'ok' | 'error'>('loading');
  const [fileDimensions, setFileDimensions] = useState<Record<Dimension, number> | null>(null);
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    let alive = true;
    import('@google/model-viewer').then(() => alive && setReady(true)).catch(() => alive && setState('error'));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const mv = ref.current as (HTMLElement & { loaded?: boolean; getDimensions?: () => { x: number; y: number; z: number } }) | null;
    if (!mv || !ready) return undefined;
    setState('loading');
    const onLoad = () => {
      setState('ok');
      const d = mv.getDimensions?.();
      setFileDimensions(d ? { length: d.z * 100, width: d.x * 100, height: d.y * 100 } : null);
    };
    const onError = () => setState('error');
    mv.addEventListener('load', onLoad);
    mv.addEventListener('error', onError);
    if (mv.loaded) onLoad();
    return () => {
      mv.removeEventListener('load', onLoad);
      mv.removeEventListener('error', onError);
    };
  }, [ready, src]);

  return (
    <div className="mt-3">
      <div className="relative h-64 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
        {ready && (
          <model-viewer
            ref={ref as React.Ref<HTMLElement>}
            src={src}
            {...(poster ? { poster } : {})}
            camera-controls=""
            auto-rotate=""
            shadow-intensity="1"
            environment-image="neutral"
            style={{ width: '100%', height: '100%' }}
          />
        )}
        {state === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-white/90 p-4 text-center text-sm text-red-600">
            <ExclamationTriangleIcon className="h-6 w-6" />
            Không tải được file 3D. Kiểm tra link, định dạng GLB và quyền CORS của máy chủ chứa file.
          </div>
        )}
      </div>
      {state === 'loading' && <p className="mt-1 text-xs text-slate-500">Đang tải mô hình…</p>}
      {state === 'ok' && fileDimensions && (
        <p className="mt-1 text-xs text-slate-500">
          {dimensionFields.map(({ key, label }) => {
            const manual = parseDimension(dimensions[key]);
            const cm = manual ?? fileDimensions[key];
            return `${label} ${cm.toLocaleString('vi-VN', manual === undefined ? { maximumFractionDigits: 1 } : { maximumSignificantDigits: 21 })} cm`;
          }).join(' · ')}
        </p>
      )}
    </div>
  );
};

export default Model3dFields;
