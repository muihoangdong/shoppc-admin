import React, { useId } from 'react';

interface LogoProps {
  /** "light": chữ trắng (sidebar luôn tối). "default": chữ đậm theo giao diện sáng/tối (trang đăng nhập). */
  variant?: 'light' | 'default';
  /** Chỉ hiện biểu tượng (sidebar thu gọn) */
  markOnly?: boolean;
  /** Kích thước biểu tượng (class Tailwind) */
  markClassName?: string;
  className?: string;
}

/** Biểu tượng Shoppc Admin: màn hình có biểu đồ cột trên nền tối viền indigo (cùng hình với public/favicon.svg). */
export const LogoMark: React.FC<{ className?: string }> = ({ className = 'h-10 w-10' }) => {
  const id = useId();
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1e293b" />
          <stop offset="1" stopColor="#0f172a" />
        </linearGradient>
      </defs>
      <rect x="1.5" y="1.5" width="61" height="61" rx="13" fill={`url(#${id})`} stroke="#6366f1" strokeWidth="3" />
      <rect x="12" y="14" width="40" height="27" rx="4" fill="none" stroke="#a5b4fc" strokeWidth="3.5" />
      <rect x="19" y="28" width="5" height="8" rx="1.5" fill="#818cf8" />
      <rect x="29.5" y="22" width="5" height="14" rx="1.5" fill="#6366f1" />
      <rect x="40" y="25" width="5" height="11" rx="1.5" fill="#34d399" />
      <path d="M32 42v6M23 49.5h18" stroke="#a5b4fc" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  );
};

const Logo: React.FC<LogoProps> = ({ variant = 'default', markOnly = false, markClassName = 'h-9 w-9', className = '' }) => (
  <span className={`inline-flex items-center gap-2.5 ${className}`}>
    <LogoMark className={`${markClassName} shrink-0`} />
    {!markOnly && (
      <span className="inline-flex items-center gap-2">
        <span
          className={`text-xl font-extrabold tracking-wide leading-none ${variant === 'light' ? 'text-white' : 'text-gray-900'}`}
        >
          SHOPPC
        </span>
        <span className="rounded-md bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold tracking-widest text-white">ADMIN</span>
      </span>
    )}
  </span>
);

export default Logo;