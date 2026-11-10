import { Dispatch, SetStateAction, useEffect, useState } from 'react';

/** Remember non-sensitive list controls when navigating away and back in this tab. */
export function useListState<T>(key: string, fallback: T): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(`admin.view.${key}`) || 'null');
      return saved != null && typeof saved === typeof fallback ? (saved as T) : fallback;
    } catch {
      return fallback;
    }
  });
  useEffect(() => {
    try {
      sessionStorage.setItem(`admin.view.${key}`, JSON.stringify(value));
    } catch {
      /* optional preference */
    }
  }, [key, value]);
  return [value, setValue];
}
