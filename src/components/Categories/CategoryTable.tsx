import React, { useState } from 'react';
import { Category } from '../../types';
import { ChevronDownIcon, ChevronRightIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

interface CategoryTableProps {
  categories: Category[];
  onEdit: (category: Category) => void;
  onDelete: (id: number) => void;
}

export const CategoryTable: React.FC<CategoryTableProps> = ({
  categories,
  onEdit,
  onDelete,
}) => {
  const [expandedCategories, setExpandedCategories] = useState<number[]>([]);

  const toggleExpand = (categoryId: number) => {
    setExpandedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const renderCategoryRow = (category: Category, level: number = 0) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedCategories.includes(category.id);

    return (
      <React.Fragment key={category.id}>
        <tr className="hover:bg-gray-50">
          <td className="px-6 py-4" style={{ paddingLeft: `${level * 24 + 24}px` }}>
            <div className="flex items-center gap-2">
              {hasChildren && (
                <button
                  onClick={() => toggleExpand(category.id)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  {isExpanded ? (
                    <ChevronDownIcon className="h-4 w-4" />
                  ) : (
                    <ChevronRightIcon className="h-4 w-4" />
                  )}
                </button>
              )}
              <span className="text-sm font-medium text-gray-900">
                {level > 0 && '↳ '}{category.name}
              </span>
            </div>
          </td>
          <td className="px-6 py-4">
            <span className={`px-2 py-1 text-xs rounded-full ${
              category.type === 'pc' ? 'bg-purple-100 text-purple-800' :
              category.type === 'component' ? 'bg-blue-100 text-blue-800' :
              'bg-green-100 text-green-800'
            }`}>
              {category.type === 'pc' ? 'Máy tính' :
               category.type === 'component' ? 'Linh kiện' : 'Phụ kiện'}
            </span>
          </td>
          {/* ĐÃ XÓA CỘT DANH MỤC CHA - KHÔNG CÓ <td> NÀO Ở ĐÂY */}
          <td className="px-6 py-4">
            <div className="flex gap-2">
              <button
                onClick={() => onEdit(category)}
                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                title="Chỉnh sửa"
              >
                <PencilIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => onDelete(category.id)}
                className="p-1 text-red-600 hover:bg-red-50 rounded"
                title="Xóa"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            </div>
          </td>
        </tr>
        {hasChildren && isExpanded && (
          category.children!.map(child => renderCategoryRow(child, level + 1))
        )}
      </React.Fragment>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên danh mục</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loại</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {categories.map(category => renderCategoryRow(category))}
          </tbody>
        </table>
      </div>
    </div>
  );
};