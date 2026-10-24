import React, { useEffect } from 'react';
import { Product, Category } from '../../types';
import { ProductForm } from './ProductForm';
import { ProductPayload } from '../../utils/productValidation';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: ProductPayload) => void;
  product?: Product | null;
  categories: Category[];
  categoriesError?: string;
  onRetryCategories?: () => void;
  loading?: boolean;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  onSave,
  product,
  categories,
  categoriesError,
  onRetryCategories,
  loading = false,
}) => {
  // Nhấn Esc để đóng (không đóng khi đang lưu)
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div role="dialog" aria-modal="true" aria-label={product ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'} className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white p-6">
          <h2 className="text-xl font-bold">{product ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}</h2>
          <button onClick={onClose} disabled={loading} aria-label="Đóng" className="p-1 hover:bg-gray-100 rounded disabled:opacity-50">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          <ProductForm
            initialData={product}
            categories={categories}
            categoriesError={categoriesError}
            onRetryCategories={onRetryCategories}
            onSubmit={onSave}
            onCancel={onClose}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
};
