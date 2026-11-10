import api, { API_BASE_URL, apiErrorMessage } from './api';

export interface UploadedFile {
  url: string;
  filename: string;
  size: number;
  type: string;
}

export const uploadFile = async (
  file: File,
  kind: 'image' | 'model',
  onProgress: (percent: number) => void,
  signal?: AbortSignal
): Promise<UploadedFile> => {
  const maxMb = kind === 'image' ? 10 : 50;
  const allowed = kind === 'image' ? /\.(png|jpe?g|webp)$/i : /\.(glb|gltf|usdz)$/i;
  if (!allowed.test(file.name)) throw new Error(kind === 'image' ? 'Chọn ảnh PNG, JPG, JPEG hoặc WEBP' : 'Chọn file GLB, GLTF hoặc USDZ');
  if (!file.size) throw new Error('File rỗng');
  if (file.size > maxMb * 1024 * 1024) throw new Error(`File tối đa ${maxMb} MB`);
  try {
    const response = await api.post<{ success: boolean; data: UploadedFile }>(`/uploads/${kind}`, file, {
      params: { filename: file.name },
      headers: { 'Content-Type': 'application/octet-stream' },
      timeout: 180000,
      signal,
      onUploadProgress: (event) => onProgress(Math.min(100, Math.round((event.loaded / (event.total || file.size)) * 100))),
    });
    const data = response.data.data;
    // Uploaded files live on the API server, not the admin/storefront domain.
    const base = new URL(API_BASE_URL, window.location.origin);
    return { ...data, url: new URL(data.url, base).href };
  } catch (error) {
    throw new Error(apiErrorMessage(error, 'Không tải được file. Vui lòng thử lại.'));
  }
};
