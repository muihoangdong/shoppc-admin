import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import api, { API_BASE_URL } from '../services/api';
import { useAuth } from './AuthContext';
import { canAccessAdmin } from '../utils/roles';

export type RealtimeStatus = 'idle' | 'connecting' | 'live' | 'offline';
type Handler = (data: any) => void;

/** Các sự kiện backend phát cho nhân viên (xem shoppc-be/src/realtime/events.js và supportService). */
const SERVER_EVENTS = [
  'order:new',
  'order:updated',
  'payment:claimed',
  'payment:received',
  'product:changed',
  'category:changed',
  'review:changed',
  'stats:dirty',
  'chat:message',
  'chat:read',
  'chat:typing',
  'chat:conversation',
  'chat:handoff',
] as const;

interface RealtimeContextType {
  status: RealtimeStatus;
  subscribe: (event: string, handler: Handler) => () => void;
}

const RealtimeContext = createContext<RealtimeContextType>({ status: 'idle', subscribe: () => () => undefined });

const MAX_BACKOFF_MS = 30000;

/**
 * Giữ MỘT kết nối SSE cho cả dashboard.
 *  - Xin "vé" dùng một lần rồi mở EventSource (vì EventSource không gửi được header Authorization).
 *  - Mất kết nối: tự kết nối lại với thời gian chờ tăng dần (1s, 2s, 4s… tối đa 30s), mỗi lần dùng vé MỚI.
 *  - Sau khi kết nối lại phát sự kiện giả "resync" để các trang tải lại dữ liệu đã lỡ trong lúc mất kết nối.
 *  - Quay lại tab / có mạng trở lại: kết nối lại ngay thay vì chờ.
 */
export const RealtimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const enabled = !!user && canAccessAdmin(user.role);
  const [status, setStatus] = useState<RealtimeStatus>('idle');
  const handlers = useRef(new Map<string, Set<Handler>>());

  const subscribe = useCallback((event: string, handler: Handler) => {
    const set = handlers.current.get(event) || new Set<Handler>();
    set.add(handler);
    handlers.current.set(event, set);
    return () => {
      set.delete(handler);
    };
  }, []);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined' || typeof EventSource === 'undefined') {
      setStatus('idle');
      return undefined;
    }

    let closed = false;
    let source: EventSource | null = null;
    let timer: number | undefined;
    let attempt = 0;
    let hasBeenLive = false;
    let connecting = false;

    const emit = (event: string, data: any) => {
      handlers.current.get(event)?.forEach((fn) => {
        try {
          fn(data);
        } catch (error) {
          console.error('[realtime] Lỗi xử lý sự kiện', event, error);
        }
      });
    };

    const scheduleReconnect = (delay?: number) => {
      if (closed) return;
      window.clearTimeout(timer);
      const wait = delay ?? Math.min(1000 * 2 ** attempt, MAX_BACKOFF_MS);
      attempt += 1;
      timer = window.setTimeout(() => void connect(), wait);
    };

    const connect = async () => {
      if (closed || connecting) return;
      connecting = true;
      setStatus((s) => (s === 'live' ? s : 'connecting'));
      try {
        const res = await api.post('/realtime/ticket');
        if (closed) return;
        const ticket: string = res.data.data.ticket;
        const es = new EventSource(`${API_BASE_URL}/realtime/stream?ticket=${encodeURIComponent(ticket)}`);
        source = es;

        es.addEventListener('ready', () => {
          attempt = 0;
          setStatus('live');
          if (hasBeenLive) emit('resync', {}); // vừa kết nối lại: tải lại dữ liệu đã lỡ
          hasBeenLive = true;
        });
        SERVER_EVENTS.forEach((name) =>
          es.addEventListener(name, (e: Event) => {
            try {
              emit(name, JSON.parse((e as MessageEvent).data));
            } catch {
              /* bỏ qua gói tin hỏng */
            }
          })
        );
        es.addEventListener('shutdown', () => {
          es.close();
          if (source === es) source = null;
          setStatus('offline');
          scheduleReconnect(3000);
        });
        es.onerror = () => {
          // Không để EventSource tự kết nối lại: vé đã dùng rồi nên phải xin vé mới
          es.close();
          if (source === es) source = null;
          setStatus('offline');
          scheduleReconnect();
        };
      } catch {
        setStatus('offline');
        scheduleReconnect();
      } finally {
        connecting = false;
      }
    };

    const reconnectNow = () => {
      if (!closed && !source && !connecting) {
        attempt = 0;
        window.clearTimeout(timer);
        void connect();
      }
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') reconnectNow();
    };

    window.addEventListener('online', reconnectNow);
    document.addEventListener('visibilitychange', onVisible);
    void connect();

    return () => {
      closed = true;
      window.clearTimeout(timer);
      window.removeEventListener('online', reconnectNow);
      document.removeEventListener('visibilitychange', onVisible);
      source?.close();
      source = null;
      setStatus('idle');
    };
  }, [enabled]);

  return <RealtimeContext.Provider value={{ status, subscribe }}>{children}</RealtimeContext.Provider>;
};

/** Đăng ký nhận một sự kiện realtime trong suốt vòng đời component. `resync` = vừa kết nối lại sau khi mất kết nối. */
export function useRealtime(event: string, handler: Handler): void {
  const { subscribe } = useContext(RealtimeContext);
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => subscribe(event, (data) => ref.current(data)), [event, subscribe]);
}

export const useRealtimeStatus = (): RealtimeStatus => useContext(RealtimeContext).status;
