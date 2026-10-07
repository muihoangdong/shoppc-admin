import { useEffect, useState } from 'react';
import { aiService } from '../services/aiService';

let cached: boolean | null = null; // chỉ hỏi server một lần mỗi lần mở trang

/** AI có được bật ở server không (đã cấu hình GEMINI_API_KEY hoặc nhà cung cấp AI khác). null = đang kiểm tra. Dùng để ẩn nút AI khi chưa cấu hình. */
export default function useAiStatus(): boolean | null {
  const [enabled, setEnabled] = useState<boolean | null>(cached);
  useEffect(() => {
    if (cached !== null) return undefined;
    let alive = true;
    aiService
      .status()
      .then((s) => {
        cached = s.enabled;
        if (alive) setEnabled(s.enabled);
      })
      .catch(() => alive && setEnabled(false));
    return () => {
      alive = false;
    };
  }, []);
  return enabled;
}

export const resetAiStatusCache = (): void => {
  cached = null;
};
