import { useCallback, useEffect, useState } from 'react';

/** Giao diện sáng/tối. Lưu lựa chọn trong trình duyệt; chưa chọn thì theo cài đặt của hệ điều hành. */
export type Theme = 'light' | 'dark';
export const THEME_KEY = 'shoppc_theme';

const stored = (): Theme | null => {
  try {
    const t = localStorage.getItem(THEME_KEY);
    return t === 'light' || t === 'dark' ? t : null;
  } catch {
    return null;
  }
};

const systemTheme = (): Theme =>
  typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

export const currentTheme = (): Theme => stored() ?? systemTheme();

/** Gắn/bỏ class "dark" trên <html> — toàn bộ màu đổi theo biến CSS trong theme.css. */
export const applyTheme = (theme: Theme): void => {
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  root.style.colorScheme = theme;
};

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => (typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? 'dark' : currentTheme()));

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Đổi ở tab khác -> tab này đổi theo; chưa tự chọn thì theo hệ điều hành khi người dùng đổi chế độ máy
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === THEME_KEY) setThemeState(currentTheme());
    };
    const media = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    const onSystem = () => {
      if (!stored()) setThemeState(systemTheme());
    };
    window.addEventListener('storage', onStorage);
    media?.addEventListener?.('change', onSystem);
    return () => {
      window.removeEventListener('storage', onStorage);
      media?.removeEventListener?.('change', onSystem);
    };
  }, []);

  const setTheme = useCallback((t: Theme) => {
    try {
      localStorage.setItem(THEME_KEY, t);
    } catch {
      /* chế độ ẩn danh: vẫn đổi được trong phiên này */
    }
    setThemeState(t);
  }, []);

  const toggle = useCallback(() => setTheme(theme === 'dark' ? 'light' : 'dark'), [theme, setTheme]);

  return { theme, setTheme, toggle };
}
