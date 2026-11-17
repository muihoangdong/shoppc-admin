import React from 'react';

interface LogoProps {
  /** "light": chữ trắng (đặt trên nền tối/màu). "default": chữ đậm theo giao diện sáng/tối. */
  variant?: 'light' | 'default';
  /** Chỉ hiện biểu tượng (sidebar thu gọn) */
  markOnly?: boolean;
  /** Kích thước biểu tượng (class Tailwind) */
  markClassName?: string;
  className?: string;
}

export const LogoMark: React.FC<{ className?: string }> = ({ className = 'h-10 w-10' }) => (
  <img src={`${import.meta.env.BASE_URL}favicon.svg?v=teal`} alt="" className={className} />
);

const Logo: React.FC<LogoProps> = ({ variant = 'default', markOnly = false, markClassName = 'h-9 w-9', className = '' }) => (
  <span className={`inline-flex items-center gap-2 ${className}`}>
    <LogoMark className={`${markClassName} shrink-0`} />
    {markOnly ? (
      <span className="sr-only">Shoppc Admin</span>
    ) : (
      <span className={`flex flex-col gap-1 leading-none ${variant === 'light' ? 'text-white' : 'text-primary-600'}`}>
        <span className="text-base font-extrabold tracking-[0.1em]">SHOPPC</span>
        <span className="text-[10px] font-bold tracking-[0.25em]">ADMIN</span>
      </span>
    )}
  </span>
);

export default Logo;
