import React, { useId } from 'react';

interface LogoProps {
  /** "light": chữ trắng (đặt trên nền tối/màu). "default": chữ đậm theo giao diện sáng/tối. */
  variant?: 'light' | 'default';
  /** Chỉ hiện biểu tượng (sidebar thu gọn) */
  markOnly?: boolean;
  /** Kích thước biểu tượng (class Tailwind) */
  markClassName?: string;
  className?: string;
}

/** Biểu tượng Shoppc Admin "Arctic Frost": tinh thể băng trên nền xanh băng (cùng hình với public/favicon.svg). */
export const LogoMark: React.FC<{ className?: string }> = ({ className = 'h-10 w-10' }) => {
  const id = useId();
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1aa3f5" />
          <stop offset="1" stopColor="#2f3ad0" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14" fill={`url(#${id})`} />
      <g stroke="#fff" strokeWidth="3.4" strokeLinecap="round" fill="none">
        <path d="M32 14v36M16.4 23l31.2 18M16.4 41l31.2-18" />
        <path d="M27 17l5 5 5-5M27 47l5-5 5 5" strokeWidth="2.6" />
      </g>
      <circle cx="32" cy="32" r="4" fill="#fff" />
    </svg>
  );
};

const Logo: React.FC<LogoProps> = ({ variant = 'default', markOnly = false, markClassName = 'h-9 w-9', className = '' }) => (
  <span className={`inline-flex items-center gap-2.5 ${className}`}>
    <LogoMark className={`${markClassName} shrink-0 rounded-[12px] shadow-sm`} />
    {!markOnly && (
      <span className="flex flex-col leading-none">
        <span className={`text-lg font-bold tracking-tight ${variant === 'light' ? 'text-white' : 'text-slate-900'}`}>ShopPC</span>
        <span className={`mt-1 text-[9px] font-semibold tracking-[0.2em] ${variant === 'light' ? 'text-white/70' : 'text-blue-600'}`}>ADMIN HUB</span>
      </span>
    )}
  </span>
);

export default Logo;
