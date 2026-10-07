import React, { useMemo, useState } from 'react';
import { Category } from '../../types';
import { buildTree, flattenForSelect, selfAndDescendants } from '../../utils/categoryTree';

interface CategoryFormProps {
  initialData?: Category | null;
  categories: Category[];
  onSubmit: (data: { name: string; type: Category['type']; parent_id: number | null }) => void;
  onCancel: () => void;
  loading?: boolean;
}

const TYPES: { value: Category['type']; label: string }[] = [
  { value: 'pc', label: 'Máy tính' },
  { value: 'component', label: 'Linh kiện' },
  { value: 'peripheral', label: 'Phụ kiện' },
];

const inputClass = 'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none';

export const CategoryForm: React.FC<CategoryFormProps> = ({ initialData, categories, onSubmit, onCancel, loading = false }) => {
  const [name, setName] = useState(initialData?.name ?? '');
  const [type, setType] = useState<Category['type']>(initialData?.type ?? 'component');
  const [parentId, setParentId] = useState(initialData?.parent_id ? String(initialData.parent_id) : '');
  const [error, setError] = useState('');

  // Không cho chọn chính nó hoặc con cháu của nó làm danh mục cha (sẽ tạo vòng lặp)
  const parentOptions = useMemo(() => {
    const excluded = initialData ? selfAndDescendants(categories, initialData.id) : new Set<number>();
    return flattenForSelect(buildTree(categories), excluded);
  }, [categories, initialData]);

  const handleParentChange = (value: string) => {
    setParentId(value);
    // Tạo mới: gợi ý loại theo danh mục cha cho tiện
    const parent = categories.find((c) => String(c.id) === value);
    if (parent && !initialData) setType(parent.type);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    const trimmed = name.trim();
    if (trimmed.length < 2) return setError('Tên danh mục phải có ít nhất 2 ký tự');
    if (trimmed.length > 100) return setError('Tên danh mục tối đa 100 ký tự');
    setError('');
    onSubmit({ name: trimmed, type, parent_id: parentId ? Number(parentId) : null });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div>
        <label htmlFor="cf-name" className="block text-sm font-medium text-gray-700 mb-1">
          Tên danh mục <span className="text-red-500">*</span>
        </label>
        <input
          id="cf-name"
          type="text"
          value={name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setName(e.target.value); setError(''); }}
          className={`${inputClass} ${error ? 'border-red-400' : 'border-gray-300'}`}
          placeholder="Nhập tên danh mục"
          aria-invalid={!!error}
          aria-describedby="cf-name-err"
          maxLength={100}
        />
        {error && (
          <p id="cf-name-err" role="alert" className="mt-1 text-xs text-red-600">
            {error}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="cf-parent" className="block text-sm font-medium text-gray-700 mb-1">
          Danh mục cha
        </label>
        <select id="cf-parent" value={parentId} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleParentChange(e.target.value)} className={`${inputClass} border-gray-300`}>
          <option value="">Không có (danh mục gốc)</option>
          {parentOptions.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="cf-type" className="block text-sm font-medium text-gray-700 mb-1">
          Loại danh mục <span className="text-red-500">*</span>
        </label>
        <select id="cf-type" value={type} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setType(e.target.value as Category['type'])} className={`${inputClass} border-gray-300`}>
          {TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button type="button" onClick={onCancel} disabled={loading} className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition disabled:opacity-50">
          Hủy
        </button>
        <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
          {loading ? 'Đang lưu...' : initialData ? 'Cập nhật' : 'Thêm mới'}
        </button>
      </div>
    </form>
  );
};
