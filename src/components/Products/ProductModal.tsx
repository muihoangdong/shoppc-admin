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
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div role="dialog" aria-modal="true" aria-label={product ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'} className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white z-10">
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
