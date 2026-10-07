import { useCallback, useEffect, useRef } from 'react';

/** Gộp nhiều lần gọi liên tiếp (ví dụ nhiều sự kiện realtime dồn dập) thành một lần sau `delay` ms. */
export default function useDebouncedCallback(fn: () => void, delay = 600): () => void {
  const ref = useRef(fn);
  ref.current = fn;
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  return useCallback(() => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => ref.current(), delay);
  }, [delay]);
}
