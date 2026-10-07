import { useEffect, useState } from 'react';

/** Trì hoãn giá trị thay đổi nhanh (ví dụ ô tìm kiếm) để không gọi API sau mỗi phím gõ. */
function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export default useDebounce;
