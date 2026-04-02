import React, { useState, useEffect } from 'react';
import { Product, Category } from '../../types';
import { categoryService } from '../../services/categoryService';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

interface ProductFormProps {
  initialData?: Product | null;
  onSubmit: (data: Partial<Product>) => void;
  onCancel: () => void;
  loading?: boolean;
}

interface SpecField {
  key: string;
  value: string;
}

export const ProductForm: React.FC<ProductFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    description: '',
    price: 0,
    stock: 0,
    category_id: 0,
    image_url: '',
    specs: {},
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [specFields, setSpecFields] = useState<SpecField[]>([{ key: '', value: '' }]);

  useEffect(() => {
    const fetchCategories = async () => {
      const data = await categoryService.getCategories();
      setCategories(data);
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      if (initialData.specs && Object.keys(initialData.specs).length > 0) {
        const fields = Object.entries(initialData.specs).map(([key, value]) => ({
          key,
          value: String(value),
        }));
        setSpecFields(fields);
      }
    }
  }, [initialData]);

  // Thêm field specs mới
  const addSpecField = () => {
    setSpecFields([...specFields, { key: '', value: '' }]);
  };

  // Xóa field specs
  const removeSpecField = (index: number) => {
    const newFields = specFields.filter((_, i) => i !== index);
    setSpecFields(newFields);
  };

  // Cập nhật field specs
  const updateSpecField = (index: number, field: 'key' | 'value', value: string) => {
    const newFields = [...specFields];
    newFields[index][field] = value;
    setSpecFields(newFields);
  };

  // Chuyển đổi specs fields thành object
  const buildSpecsObject = () => {
    const specs: Record<string, string> = {};
    specFields.forEach(({ key, value }) => {
      if (key.trim() && value.trim()) {
        specs[key.trim()] = value.trim();
      }
    });
    return specs;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.name?.trim()) {
      alert('Vui lòng nhập tên sản phẩm');
      return;
    }
    if (!formData.category_id || formData.category_id === 0) {
      alert('Vui lòng chọn danh mục');
      return;
    }
    if (!formData.price || formData.price <= 0) {
      alert('Vui lòng nhập giá hợp lệ');
      return;
    }

    const specs = buildSpecsObject();
    onSubmit({ ...formData, specs });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Tên sản phẩm */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tên sản phẩm <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="Nhập tên sản phẩm"
          required
        />
      </div>

      {/* Danh mục */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Danh mục <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.category_id}
          onChange={(e) => setFormData({ ...formData, category_id: Number(e.target.value) })}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value={0}>-- Chọn danh mục --</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Giá và tồn kho */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Giá (VNĐ) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="0"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Số lượng tồn kho <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={formData.stock}
            onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="0"
            required
          />
        </div>
      </div>

      {/* URL hình ảnh */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          URL hình ảnh
        </label>
        <input
          type="url"
          value={formData.image_url}
          onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="https://example.com/image.jpg"
        />
        {formData.image_url && (
          <div className="mt-2">
            <img
              src={formData.image_url}
              alt="Preview"
              className="h-20 w-20 object-cover rounded border"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}
      </div>

      {/* Mô tả sản phẩm */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Mô tả sản phẩm
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={4}
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="Nhập mô tả chi tiết về sản phẩm..."
        />
      </div>

      {/* Thông số kỹ thuật - Dynamic Form */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <label className="block text-sm font-medium text-gray-700">
            Thông số kỹ thuật
          </label>
          <button
            type="button"
            onClick={addSpecField}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
          >
            <PlusIcon className="h-4 w-4" />
            Thêm thông số
          </button>
        </div>

        <div className="space-y-2">
          {specFields.map((field, index) => (
            <div key={index} className="flex gap-2 items-start">
              <input
                type="text"
                placeholder="Tên thông số (VD: CPU)"
                value={field.key}
                onChange={(e) => updateSpecField(index, 'key', e.target.value)}
                className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <input
                type="text"
                placeholder="Giá trị (VD: Intel i7)"
                value={field.value}
                onChange={(e) => updateSpecField(index, 'value', e.target.value)}
                className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              />
              {specFields.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeSpecField(index)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              )}
            </div>
          ))}
        </div>

        {specFields.length === 0 && (
          <p className="text-sm text-gray-500 mt-2">
            Chưa có thông số kỹ thuật. Nhấn "Thêm thông số" để thêm.
          </p>
        )}
      </div>

      {/* Nút hành động */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition"
        >
          Hủy
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
        >
          {loading ? 'Đang lưu...' : initialData ? 'Cập nhật' : 'Thêm mới'}
        </button>
      </div>
    </form>
  );
};