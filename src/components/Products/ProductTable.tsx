import React, { useState } from 'react';
import { Product } from '../../types';
import { formatPrice } from '../../utils/formatters';
import { STOCK_BADGE, STOCK_LABEL, stockLevel } from '../../utils/stock';
import { CheckIcon, PencilIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface ProductTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  /** Lưu tồn kho mới; ném lỗi nếu thất bại (bảng giữ ô nhập để thử lại). */
  onUpdateStock?: (product: Product, quantity: number) => Promise<void>;
  /** Chỉ admin được xóa sản phẩm. Mặc định true để giữ hành vi cũ nếu không truyền. */
  canDelete?: boolean;
}

const ProductImage: React.FC<{ src?: string; alt: string }> = ({ src, alt }) => {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return <div aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-gray-100 text-xs text-gray-400">N/A</div>;
  }
  return <img src={src} alt={alt} onError={() => setFailed(true)} className="h-10 w-10 shrink-0 rounded object-cover" />;
};

export const ProductTable: React.FC<ProductTableProps> = ({ products, onEdit, onDelete, onUpdateStock, canDelete = true }) => {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);

  const startEdit = (p: Product) => {
    setEditingId(p.id);
    setDraft(String(p.stock));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft('');
  };

  const draftValid = /^\d+$/.test(draft.trim()) && Number(draft) <= 1e7;

  const commit = async (p: Product) => {
    if (!onUpdateStock || !draftValid || saving) return;
    if (Number(draft) === p.stock) return cancelEdit();
    try {
      setSaving(true);
      await onUpdateStock(p, Number(draft));
      cancelEdit();
    } catch {
      /* trang cha đã báo lỗi; giữ ô nhập để người dùng sửa lại */
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {['Sản phẩm', 'Danh mục', 'Giá', 'Tồn kho', 'Thao tác'].map((h) => (
                <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {products.map((product) => {
              const level = stockLevel(product.stock);
              const editing = editingId === product.id;
              return (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <ProductImage src={product.image_url} alt={product.name} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate max-w-[18rem]">{product.name}</p>
                        <p className="text-xs text-gray-400">#{product.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{product.category_name || '-'}</td>
                  <td className="px-6 py-4 text-sm font-medium text-red-600 whitespace-nowrap">{formatPrice(product.price)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editing ? (
                      <div className="flex items-center gap-1">
                        <input
                          autoFocus
                          inputMode="numeric"
                          aria-label={`Tồn kho mới của ${product.name}`}
                          value={draft}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDraft(e.target.value)}
                          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                            if (e.key === 'Enter') void commit(product);
                            if (e.key === 'Escape') cancelEdit();
                          }}
                          className={`w-20 rounded border px-2 py-1 text-sm ${draftValid ? 'border-gray-300' : 'border-red-400'}`}
                        />
                        <button
                          onClick={() => void commit(product)}
                          disabled={!draftValid || saving}
                          aria-label="Lưu tồn kho"
                          className="rounded p-1 text-green-600 hover:bg-green-50 disabled:opacity-40"
                        >
                          <CheckIcon className="h-5 w-5" />
                        </button>
                        <button onClick={cancelEdit} disabled={saving} aria-label="Hủy sửa tồn kho" className="rounded p-1 text-gray-500 hover:bg-gray-100">
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${STOCK_BADGE[level]}`} title={STOCK_LABEL[level]}>
                          {product.stock}
                        </span>
                        {level !== 'ok' && <span className="text-xs text-gray-400">{STOCK_LABEL[level]}</span>}
                        {onUpdateStock && (
                          <button
                            onClick={() => startEdit(product)}
                            aria-label={`Sửa nhanh tồn kho ${product.name}`}
                            title="Sửa nhanh tồn kho"
                            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-blue-600"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button onClick={() => onEdit(product)} aria-label={`Chỉnh sửa ${product.name}`} title="Chỉnh sửa" className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      {canDelete && (
                        <button onClick={() => onDelete(product)} aria-label={`Xóa ${product.name}`} title="Xóa" className="p-1 text-red-600 hover:bg-red-50 rounded">
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
