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
    return {
      dark,
      primary: v('--c-indigo-600', '#313acd'),
      primarySoft: v('--c-indigo-400', '#6f7df2'),
      grid: v('--c-slate-200', '#dee7f4'),
      muted: v('--c-slate-500', '#5f708a'),
      surface: v('--surface', '#ffffff'),
      series: [v('--c-indigo-600', '#313acd'), '#1aa3f5', v('--c-purple-400', '#c084fc'), v('--c-orange-400', '#fb923c'), v('--c-teal-500', '#14b8a6'), v('--c-slate-400', '#8091aa')],
    };
  }, [dark]);
}
