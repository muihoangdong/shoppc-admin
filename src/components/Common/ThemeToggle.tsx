import React from 'react';
import { useTheme } from '../../utils/theme';

interface ThemeToggleProps {
  /** Kiểu nút: "ghost" cho nền sáng/tối thường, "onBrand" khi đặt trên nền màu chủ đạo (header). */
  variant?: 'ghost' | 'onBrand';
  className?: string;
}

/** Nút chuyển giao diện sáng/tối (biểu tượng mặt trời/mặt trăng). */
const ThemeToggle: React.FC<ThemeToggleProps> = ({ variant = 'ghost', className = '' }) => {
  const { theme, toggle } = useTheme();
  const dark = theme === 'dark';
  const style = variant === 'onBrand' ? 'text-white hover:bg-white/15' : 'text-gray-600 hover:bg-gray-100';
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
      aria-pressed={dark}
      title={dark ? 'Giao diện sáng' : 'Giao diện tối'}
      data-testid="theme-toggle"
      className={`rounded-lg p-2 transition ${style} ${className}`}
    >
      {dark ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path strokeLinecap="round" d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32 1.41-1.41" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z" />
        </svg>
      )}
    </button>
  );
};

export default ThemeToggle;
