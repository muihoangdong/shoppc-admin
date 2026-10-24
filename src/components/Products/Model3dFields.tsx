import React, { useEffect, useRef, useState } from 'react';
import { CubeIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { storefrontAsset } from '../../utils/storefront';

export interface Model3dValue {
  glb: string;
  usdz: string;
  poster: string;
  enabled: boolean;
}

export const EMPTY_MODEL3D: Model3dValue = { glb: '', usdz: '', poster: '', enabled: true };

const URL_RE = /^(https?:\/\/|\/(?!\/))/i;
const ext = (url: string) => url.split(/[?#]/)[0].toLowerCase();

/** Kiểm tra giống backend (src/config/product3d.js). Trả về thông báo lỗi hoặc ''. */
export const validateModel3d = (v: Model3dValue): string => {
  const glb = v.glb.trim();
  const usdz = v.usdz.trim();
  const poster = v.poster.trim();
  if (!glb) return usdz || poster ? 'Cần nhập link file GLB trước' : '';
  if (!URL_RE.test(glb)) return 'Link GLB phải bắt đầu bằng http://, https:// hoặc /';
  if (!/\.(glb|gltf)$/.test(ext(glb))) return 'Link GLB phải là file .glb hoặc .gltf';
  if (usdz && (!URL_RE.test(usdz) || !ext(usdz).endsWith('.usdz'))) return 'Link USDZ phải là file .usdz bắt đầu bằng http(s):// hoặc /';
  if (poster && !URL_RE.test(poster)) return 'Link ảnh chờ phải bắt đầu bằng http://, https:// hoặc /';
  return '';
};

export const toPayload = (v: Model3dValue) =>
  v.glb.trim()
    ? {
        glb_url: v.glb.trim(),
        ...(v.usdz.trim() ? { usdz_url: v.usdz.trim() } : {}),
        ...(v.poster.trim() ? { poster_url: v.poster.trim() } : {}),
        enabled: v.enabled,
      }
    : null;

interface Props {
  value: Model3dValue;
  onChange: (next: Model3dValue) => void;
  error?: string;
  /** Ảnh sản phẩm: dùng làm ảnh chờ khi xem thử */
  imageUrl?: string;
}

const inputClass = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

/**
 * Mô hình 3D / AR của sản phẩm: link file GLB (bắt buộc để bật 3D), USDZ cho iPhone (tùy chọn), ảnh chờ.
 * Có nút "Xem thử" dùng chính <model-viewer> như trang cửa hàng để kiểm tra file tải được và hiển thị đúng.
 */
const Model3dFields: React.FC<Props> = ({ value, onChange, error, imageUrl }) => {
  const [preview, setPreview] = useState(false);
  const set = (patch: Partial<Model3dValue>) => onChange({ ...value, ...patch });
  const hasGlb = !!value.glb.trim() && !validateModel3d(value);

  useEffect(() => {
    if (!hasGlb) setPreview(false);
  }, [hasGlb]);

  return (
    <fieldset className="rounded-xl border border-slate-200 p-4">
      <legend className="flex items-center gap-1.5 px-1 text-sm font-medium text-slate-700">
        <CubeIcon className="h-4 w-4 text-blue-600" /> Mô hình 3D / AR
      </legend>
      <p className="mb-3 text-xs text-slate-500">
        Sản phẩm có file GLB sẽ hiện nút <strong>Xem 3D · AR</strong> ở cửa hàng (xoay 360°, đặt vào không gian thật trên điện thoại). Bỏ trống nếu sản phẩm chưa có mô hình — trang
        sản phẩm vẫn hiện ảnh như bình thường. File đặt trong thư mục <code className="rounded bg-slate-100 px-1">public/models</code> của cửa hàng thì nhập dạng{' '}
        <code className="rounded bg-slate-100 px-1">/models/ten-file.glb</code>; file ở máy chủ khác cần cho phép CORS.
      </p>

      <div className="space-y-3">
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

      {preview && hasGlb && <ModelPreview src={storefrontAsset(value.glb.trim())} poster={value.poster.trim() || imageUrl} />}
    </fieldset>
  );
};

/** Xem thử file GLB bằng <model-viewer> (nạp thư viện khi cần) */
const ModelPreview: React.FC<{ src: string; poster?: string }> = ({ src, poster }) => {
  const [ready, setReady] = useState(false);
  const [state, setState] = useState<'loading' | 'ok' | 'error'>('loading');
  const [info, setInfo] = useState('');
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
      if (d) setInfo(`Kích thước trong file: ${(d.x * 100).toFixed(1)} × ${(d.y * 100).toFixed(1)} × ${(d.z * 100).toFixed(1)} cm (rộng × cao × sâu)`);
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
      <p className="mt-1 text-xs text-slate-500">{state === 'ok' ? info || 'Tải mô hình thành công.' : state === 'loading' ? 'Đang tải mô hình…' : ''}</p>
      {state === 'ok' && <p className="text-xs text-slate-400">AR dùng kích thước trong file: hãy đảm bảo mô hình được dựng đúng tỉ lệ thật (đơn vị mét).</p>}
    </div>
  );
};

export default Model3dFields;
