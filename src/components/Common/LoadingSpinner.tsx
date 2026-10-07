import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'gray' | 'white';
  fullScreen?: boolean;
}

// Tên class viết đầy đủ (không ghép chuỗi) để Tailwind chắc chắn sinh ra CSS
const SIZES = {
  sm: 'h-6 w-6',
  md: 'h-12 w-12',
  lg: 'h-16 w-16',
};

const COLORS = {
  blue: 'border-blue-600',
  gray: 'border-gray-500',
  white: 'border-white',
};

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', color = 'blue', fullScreen = false }) => {
  const spinner = (
    <div className="flex justify-center items-center" role="status" aria-label="Đang tải">
      <div className={`animate-spin rounded-full border-b-2 ${COLORS[color]} ${SIZES[size]}`}></div>
    </div>
  );

  if (fullScreen) {
    return <div className="fixed inset-0 bg-white bg-opacity-90 z-50 flex items-center justify-center">{spinner}</div>;
  }

  return spinner;
};

export default LoadingSpinner;
