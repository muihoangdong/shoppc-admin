import { useEffect, useMemo, useState } from 'react';

const isDark = () => typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

/**
 * Màu biểu đồ lấy từ biến CSS của giao diện (theme.css) để đổi theo sáng/tối.
 * Thuộc tính SVG của recharts (stroke, fill) không hiểu var(--...), nên phải đọc ra mã màu thật.
 * Theo dõi class "dark" trên <html> để vẽ lại ngay khi người dùng đổi giao diện.
 */
export default function useThemeColors() {
  const [dark, setDark] = useState(isDark);
  useEffect(() => {
    const observer = new MutationObserver(() => setDark(isDark()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return useMemo(() => {
    const css = getComputedStyle(document.documentElement);
    const v = (name: string, fallback: string) => {
      const raw = css.getPropertyValue(name).trim();
      return raw ? `rgb(${raw.split(/\s+/).join(', ')})` : fallback;
    };
    const primary = dark ? v('--c-indigo-400-light', '#8bdbca') : v('--c-indigo-600', '#0f766e');
    return {
      dark,
      primary,
      primarySoft: v('--c-indigo-400', '#458e80'),
      grid: v('--c-slate-200', '#d7e7e1'),
      muted: v('--c-slate-500', '#516a65'),
      surface: v('--surface', '#ffffff'),
      series: [primary, '#1aa3f5', v('--c-purple-400', '#c084fc'), v('--c-orange-400', '#fb923c'), v('--c-teal-500', '#14b8a6'), v('--c-slate-400', '#607871')],
    };
  }, [dark]);
}
