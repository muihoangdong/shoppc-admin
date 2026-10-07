import React, { useEffect } from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'danger' | 'warning' | 'info';
  /** Đang xử lý: khóa nút, chặn đóng hộp thoại. */
  loading?: boolean;
}

// Tên class viết đầy đủ để Tailwind sinh CSS (trước đây ghép chuỗi `bg-${màu}-100` nên icon bị mất nền)
const STYLES = {
  danger: { button: 'bg-red-600 hover:bg-red-700', icon: 'text-red-600', ring: 'bg-red-100' },
  warning: { button: 'bg-yellow-600 hover:bg-yellow-700', icon: 'text-yellow-600', ring: 'bg-yellow-100' },
  info: { button: 'bg-blue-600 hover:bg-blue-700', icon: 'text-blue-600', ring: 'bg-blue-100' },
};

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  onConfirm,
  onCancel,
  type = 'warning',
  loading = false,
}) => {
  // Nhấn Esc để hủy
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, loading, onCancel]);

  if (!isOpen) return null;

  const style = STYLES[type];

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4"
      onMouseDown={(e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget && !loading) onCancel();
      }}
    >
      <div role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" className="bg-white rounded-lg w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-center mb-4">
            <div className={`p-3 rounded-full ${style.ring}`}>
              <ExclamationTriangleIcon className={`h-6 w-6 ${style.icon}`} />
            </div>
          </div>
          <h3 id="confirm-title" className="text-lg font-semibold text-center mb-2">
            {title}
          </h3>
          <div className="text-gray-600 text-center mb-6 text-sm">{message}</div>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              disabled={loading}
              className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className={`flex-1 px-4 py-2 text-white rounded-lg transition disabled:opacity-50 ${style.button}`}
            >
              {loading ? 'Đang xử lý…' : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
