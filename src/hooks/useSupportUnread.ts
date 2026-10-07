import { useCallback, useEffect, useState } from 'react';
import { supportService } from '../services/supportService';
import { useRealtime } from '../contexts/RealtimeContext';
import useDebouncedCallback from './useDebouncedCallback';

/** Tổng số tin khách chưa được nhân viên đọc (huy hiệu ở menu "Hỗ trợ"); tự cập nhật theo realtime. */
export default function useSupportUnread(): number {
  const [unread, setUnread] = useState(0);

  const load = useCallback(async () => {
    try {
      setUnread(await supportService.unread());
    } catch {
      /* im lặng: huy hiệu không quan trọng bằng trang chính */
    }
  }, []);

  const refresh = useDebouncedCallback(() => void load(), 300);

  useEffect(() => {
    void load();
  }, [load]);

  useRealtime('chat:message', refresh);
  useRealtime('chat:read', refresh);
  useRealtime('chat:conversation', refresh);
  useRealtime('resync', refresh);

  return unread;
}
