import React, { useState } from 'react';
import { Category } from '../../types';
import { CategoryNode } from '../../utils/categoryTree';
import { ChevronDownIcon, ChevronRightIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

interface CategoryTableProps {
  categories: CategoryNode[];
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
  /** Chỉ admin được xóa danh mục. Mặc định true để giữ hành vi cũ nếu không truyền. */
  canDelete?: boolean;
}

const TYPE_LABEL: Record<Category['type'], string> = { pc: 'Máy tính', component: 'Linh kiện', peripheral: 'Phụ kiện' };
const TYPE_BADGE: Record<Category['type'], string> = {
  pc: 'bg-purple-100 text-purple-800',
  component: 'bg-blue-100 text-blue-800',
  peripheral: 'bg-green-100 text-green-800',
};

export const CategoryTable: React.FC<CategoryTableProps> = ({ categories, onEdit, onDelete, canDelete = true }) => {
  // Mặc định mở hết cây; chỉ lưu những nhánh người dùng thu gọn
  const [collapsed, setCollapsed] = useState<number[]>([]);

  const toggle = (id: number) => setCollapsed((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const renderRow = (category: CategoryNode, level: number): React.ReactNode => {
    const hasChildren = category.children.length > 0;
    const isOpen = !collapsed.includes(category.id);
    const productCount = Number(category.product_count ?? 0);
    const blocked = hasChildren || productCount > 0;
    const blockedReason = hasChildren ? 'Danh mục còn danh mục con' : 'Danh mục còn sản phẩm';

    return (
      <React.Fragment key={category.id}>
        <tr className="hover:bg-gray-50">
          <td className="px-6 py-4" style={{ paddingLeft: `${level * 24 + 24}px` }}>
            <div className="flex items-center gap-2">
              {hasChildren ? (
                <button
                  onClick={() => toggle(category.id)}
                  aria-label={isOpen ? `Thu gọn ${category.name}` : `Mở rộng ${category.name}`}
                  aria-expanded={isOpen}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  {isOpen ? <ChevronDownIcon className="h-4 w-4" /> : <ChevronRightIcon className="h-4 w-4" />}
                </button>
              ) : (
                <span className="inline-block w-6" />
              )}
              <span className="text-sm font-medium text-gray-900">{category.name}</span>
            </div>
          </td>
          <td className="px-6 py-4">
            <span className={`px-2 py-1 text-xs rounded-full ${TYPE_BADGE[category.type]}`}>{TYPE_LABEL[category.type]}</span>
          </td>
          <td className="px-6 py-4 text-sm text-gray-600">{productCount}</td>
          <td className="px-6 py-4">
            <div className="flex gap-2">
              <button onClick={() => onEdit(category)} aria-label={`Chỉnh sửa ${category.name}`} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="Chỉnh sửa">
                <PencilIcon className="h-5 w-5" />
              </button>
              {canDelete && (
                <button
                  onClick={() => onDelete(category)}
                  disabled={blocked}
                  aria-label={`Xóa ${category.name}`}
                  className="p-1 text-red-600 hover:bg-red-50 rounded disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-transparent"
                  title={blocked ? `Không thể xóa: ${blockedReason}` : 'Xóa'}
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              )}
            </div>
          </td>
        </tr>
        {hasChildren && isOpen && category.children.map((child) => renderRow(child, level + 1))}
      </React.Fragment>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {['Tên danh mục', 'Loại', 'Sản phẩm', 'Thao tác'].map((h) => (
                <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">{categories.map((category) => renderRow(category, 0))}</tbody>
        </table>
      </div>
    </div>
  );
};
