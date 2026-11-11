import React, { useEffect, useRef, useState } from 'react';
import { ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { GLB_UPLOAD_LIMIT_MB, IMAGE_UPLOAD_LIMIT_MB, MODEL_UPLOAD_LIMIT_MB, UploadedFile, uploadFile } from '../../services/uploadService';

interface Props {
  kind: 'image' | 'model';
  disabled?: boolean;
  onUploaded: (files: UploadedFile[]) => void;
  onBusyChange: (busy: boolean) => void;
  maxFiles?: number;
}

/** Upload first, then fill the existing product fields with persistent API URLs. */
const FileUploadButton: React.FC<Props> = ({ kind, disabled, onUploaded, onBusyChange, maxFiles = kind === 'model' ? 2 : 1 }) => {
  const input = useRef<HTMLInputElement>(null);
  const controller = useRef<AbortController | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  useEffect(() => () => controller.current?.abort(), []);

  const select = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (!files.length || busy) return;
    setError('');
    setMessage('');
    // One GLB/GLTF plus one optional USDZ per product.
    if (files.length > maxFiles) {
      setError(`Chỉ có thể chọn thêm tối đa ${maxFiles} file`);
      return;
    }
    if (kind === 'model' && (files.filter((f) => /\.(glb|gltf)$/i.test(f.name)).length > 1 || files.filter((f) => /\.usdz$/i.test(f.name)).length > 1)) {
      setError('Chọn một file GLB/GLTF và tối đa một file USDZ');
      return;
    }
    const completed: UploadedFile[] = [];
    controller.current = new AbortController();
    setBusy(true);
    onBusyChange(true);
    setProgress(0);
    try {
      for (let i = 0; i < files.length; i++) {
        const result = await uploadFile(files[i], kind,
          (p) => setProgress(Math.round((i * 100 + p) / files.length)), controller.current.signal);
        completed.push(result);
      }
      setMessage(`Đã tải: ${completed.map((f) => f.filename).join(', ')}. Bấm lưu sản phẩm để áp dụng.`);
    } catch (err) {
      if (!controller.current.signal.aborted) {
        const detail = err instanceof Error ? err.message : 'Không tải được file';
        setError(completed.length ? `${detail}. File đã tải thành công vẫn được giữ.` : detail);
      }
    } finally {
      if (!controller.current.signal.aborted) {
        if (completed.length) onUploaded(completed);
        setBusy(false);
        onBusyChange(false);
      }
    }
  };

  return (
    <div className="mt-2 space-y-1.5">
      <input
        ref={input}
        type="file"
        className="hidden"
        aria-label={kind === 'image' ? 'Chọn ảnh từ máy tính' : 'Chọn mô hình 3D từ máy tính'}
        accept={kind === 'image' ? '.png,.jpg,.jpeg,.webp' : '.glb,.gltf,.usdz'}
        multiple={maxFiles > 1}
        disabled={disabled || busy}
        onChange={(e) => void select(e)}
      />
      <button
        type="button"
        disabled={disabled || busy}
        onClick={() => input.current?.click()}
        className="inline-flex items-center gap-2 rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ArrowUpTrayIcon className="h-4 w-4" />
        {busy ? `Đang tải… ${progress}%` : kind === 'image' ? 'Tải ảnh từ máy tính' : 'Tải mô hình 3D từ máy tính'}
      </button>
      {busy && <progress value={progress} max={100} aria-label="Tiến độ tải file" className="block h-1.5 w-full accent-blue-600" />}
      <p className="text-xs text-slate-500">
        {kind === 'image'
          ? `PNG, JPG, WEBP · tối đa ${IMAGE_UPLOAD_LIMIT_MB} MB/ảnh${maxFiles > 1 ? ' · chọn được nhiều ảnh cùng lúc' : ''}`
          : `GLB tối đa ${GLB_UPLOAD_LIMIT_MB} MB · GLTF tự chứa texture và USDZ tối đa ${MODEL_UPLOAD_LIMIT_MB} MB/file. Có thể chọn GLB và USDZ cùng lúc.`}
      </p>
      {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
      {message && <p role="status" className="text-xs text-green-600">{message}</p>}
    </div>
  );
};

export default FileUploadButton;
