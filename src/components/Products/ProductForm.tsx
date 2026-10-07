import React, { useMemo, useState } from 'react';
import { Product, Category } from '../../types';
import { PlusIcon, SparklesIcon, TrashIcon } from '@heroicons/react/24/outline';
import { aiService } from '../../services/aiService';
import useAiStatus from '../../hooks/useAiStatus';
import { formatPrice } from '../../utils/formatters';
import { buildTree, flattenForSelect } from '../../utils/categoryTree';
import { ProductFormErrors, ProductPayload, SpecRow, validateProductForm } from '../../utils/productValidation';
import BuildSpecsFields, { BuildSpecsValue, missingBuildFields, usePartTypes } from './BuildSpecsFields';

interface ProductFormProps {
  initialData?: Product | null;
  categories: Category[];
  categoriesError?: string;
  onRetryCategories?: () => void;
  onSubmit: (data: ProductPayload) => void;
  onCancel: () => void;
  loading?: boolean;
}

const inputClass = 'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none';

const FieldError: React.FC<{ id: string; message?: string }> = ({ id, message }) =>
  message ? (
    <p id={id} role="alert" className="mt-1 text-xs text-red-600">
      {message}
    </p>
  ) : null;

export const ProductForm: React.FC<ProductFormProps> = ({
  initialData,
  categories,
  categoriesError,
  onRetryCategories,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const [name, setName] = useState(initialData?.name ?? '');
  const [categoryId, setCategoryId] = useState(initialData?.category_id ? String(initialData.category_id) : '');
  const [price, setPrice] = useState(initialData ? String(Math.round(Number(initialData.price))) : '');
  const [stock, setStock] = useState(initialData ? String(initialData.stock) : '0');
  const [imageUrl, setImageUrl] = useState(initialData?.image_url ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [specs, setSpecs] = useState<SpecRow[]>(() => {
    const rows = Object.entries(initialData?.specs ?? {}).map(([key, value]) => ({ key, value: String(value) }));
    return rows.length ? rows : [{ key: '', value: '' }];
  });
  const [errors, setErrors] = useState<ProductFormErrors>({});
  const [partType, setPartType] = useState(initialData?.part_type ?? '');
  const [buildSpecs, setBuildSpecs] = useState<BuildSpecsValue>(initialData?.build_specs ?? {});
  const [buildError, setBuildError] = useState('');
  const { defs: partDefs } = usePartTypes();
  const [imageFailed, setImageFailed] = useState(false);
  const aiEnabled = useAiStatus();
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState('');
  const [descBackup, setDescBackup] = useState<string | null>(null);

  const options = useMemo(() => flattenForSelect(buildTree(categories)), [categories]);

  const clear = (field: keyof ProductFormErrors) => setErrors((e) => (e[field] ? { ...e, [field]: undefined } : e));

  const updateSpec = (index: number, field: keyof SpecRow, value: string) => {
    setSpecs((rows) => rows.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
    clear('specs');
  };

  /** Nhờ AI viết mô tả từ tên + danh mục + thông số đã nhập. Có nút Hoàn tác để quay lại nội dung cũ. */
  const writeWithAi = async () => {
    setAiError('');
    if (name.trim().length < 3) {
      setAiError('Hãy nhập tên sản phẩm (ít nhất 3 ký tự) trước.');
      return;
    }
    const specObject: Record<string, string> = {};
    specs.forEach((r) => {
      if (r.key.trim() && r.value.trim()) specObject[r.key.trim()] = r.value.trim();
    });
    setAiBusy(true);
    try {
      const text = await aiService.productDescription({
        name: name.trim(),
        category: categories.find((c) => String(c.id) === categoryId)?.name,
        specs: specObject,
        current: description,
      });
      setDescBackup(description);
      setDescription(text);
      clear('description');
    } catch (err: any) {
      setAiError(err.message || 'AI chưa viết được mô tả');
    } finally {
      setAiBusy(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    const result = validateProductForm({ name, categoryId, price, stock, imageUrl, description, specs });
    setErrors(result.errors);
    const missing = partType ? missingBuildFields(partDefs, partType, buildSpecs) : [];
    setBuildError(missing.length ? `Thiếu thông số Build PC: ${missing.join(', ')}` : '');
    if (!result.payload || missing.length) return;
    // Sản phẩm cũ chưa từng là linh kiện mà vẫn để trống: không gửi gì để khỏi đụng tới (backend cũ/chưa nâng cấp vẫn chạy)
    const touchBuild = !!partType || !!initialData?.part_type;
    onSubmit({ ...result.payload, ...(touchBuild ? { part_type: partType || null, build_specs: partType ? buildSpecs : null } : {}) });
  };

  const priceNumber = /^\d+$/.test(price.trim()) ? Number(price) : null;
  const border = (field: keyof ProductFormErrors) => (errors[field] ? 'border-red-400' : 'border-gray-300');

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <div>
        <label htmlFor="pf-name" className="block text-sm font-medium text-gray-700 mb-1">
          Tên sản phẩm <span className="text-red-500">*</span>
        </label>
        <input
          id="pf-name"
          type="text"
          value={name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setName(e.target.value); clear('name'); }}
          className={`${inputClass} ${border('name')}`}
          placeholder="Nhập tên sản phẩm"
          aria-invalid={!!errors.name}
          aria-describedby="pf-name-err"
          maxLength={255}
        />
        <FieldError id="pf-name-err" message={errors.name} />
      </div>

      <div>
        <label htmlFor="pf-category" className="block text-sm font-medium text-gray-700 mb-1">
          Danh mục <span className="text-red-500">*</span>
        </label>
        <select
          id="pf-category"
          value={categoryId}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => { setCategoryId(e.target.value); clear('categoryId'); }}
          className={`${inputClass} ${border('categoryId')}`}
          aria-invalid={!!errors.categoryId}
          aria-describedby="pf-category-err"
        >
          <option value="">-- Chọn danh mục --</option>
          {options.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
        <FieldError id="pf-category-err" message={errors.categoryId} />
        {categoriesError && (
          <p role="alert" className="mt-1 text-xs text-red-600">
            {categoriesError}{' '}
            {onRetryCategories && (
              <button type="button" onClick={onRetryCategories} className="underline">
                Thử lại
              </button>
            )}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="pf-price" className="block text-sm font-medium text-gray-700 mb-1">
            Giá (VNĐ) <span className="text-red-500">*</span>
          </label>
          <input
            id="pf-price"
            type="text"
            inputMode="numeric"
            value={price}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setPrice(e.target.value); clear('price'); }}
            className={`${inputClass} ${border('price')}`}
            placeholder="15000000"
            aria-invalid={!!errors.price}
            aria-describedby="pf-price-err"
          />
          {priceNumber !== null && priceNumber > 0 && !errors.price && <p className="mt-1 text-xs text-gray-500">= {formatPrice(priceNumber)}</p>}
          <FieldError id="pf-price-err" message={errors.price} />
        </div>

        <div>
          <label htmlFor="pf-stock" className="block text-sm font-medium text-gray-700 mb-1">
            Số lượng tồn kho <span className="text-red-500">*</span>
          </label>
          <input
            id="pf-stock"
            type="text"
            inputMode="numeric"
            value={stock}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setStock(e.target.value); clear('stock'); }}
            className={`${inputClass} ${border('stock')}`}
            placeholder="0"
            aria-invalid={!!errors.stock}
            aria-describedby="pf-stock-err"
          />
          <FieldError id="pf-stock-err" message={errors.stock} />
        </div>
      </div>

      <div>
        <label htmlFor="pf-image" className="block text-sm font-medium text-gray-700 mb-1">
          Link hình ảnh
        </label>
        <input
          id="pf-image"
          type="text"
          value={imageUrl}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setImageUrl(e.target.value); setImageFailed(false); clear('imageUrl'); }}
          className={`${inputClass} ${border('imageUrl')}`}
          placeholder="https://example.com/image.jpg"
          aria-invalid={!!errors.imageUrl}
          aria-describedby="pf-image-err"
        />
        <FieldError id="pf-image-err" message={errors.imageUrl} />
        {imageUrl.trim() && !errors.imageUrl && (
          <div className="mt-2">
            {imageFailed ? (
              <p className="text-xs text-orange-600">Không tải được ảnh từ link này — hãy kiểm tra lại link.</p>
            ) : (
              <img src={imageUrl.trim()} alt="Xem trước" className="h-20 w-20 object-cover rounded border" onError={() => setImageFailed(true)} />
            )}
          </div>
        )}
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between">
          <label htmlFor="pf-desc" className="block text-sm font-medium text-gray-700">
            Mô tả sản phẩm
          </label>
          {aiEnabled && (
            <div className="flex items-center gap-3 text-xs">
              {descBackup !== null && (
                <button type="button" onClick={() => { setDescription(descBackup); setDescBackup(null); }} className="text-gray-500 underline hover:text-gray-700">
                  Hoàn tác
                </button>
              )}
              <button
                type="button"
                onClick={() => void writeWithAi()}
                disabled={aiBusy}
                className="flex items-center gap-1 rounded-lg border border-purple-300 px-2 py-1 text-purple-700 hover:bg-purple-50 disabled:opacity-50"
              >
                <SparklesIcon className="h-4 w-4" />
                {aiBusy ? 'AI đang viết…' : 'Viết mô tả bằng AI'}
              </button>
            </div>
          )}
        </div>
        <textarea
          id="pf-desc"
          value={description}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => { setDescription(e.target.value); clear('description'); }}
          rows={4}
          className={`${inputClass} ${border('description')}`}
          placeholder="Nhập mô tả chi tiết về sản phẩm..."
        />
        <FieldError id="pf-desc-err" message={errors.description} />
        {aiError && (
          <p role="alert" className="mt-1 text-xs text-red-600">
            {aiError}
          </p>
        )}
      </div>

      <div>
        <div className="flex justify-between items-center mb-3">
          <span className="block text-sm font-medium text-gray-700">Thông số kỹ thuật</span>
          <button type="button" onClick={() => setSpecs((rows) => [...rows, { key: '', value: '' }])} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700">
            <PlusIcon className="h-4 w-4" />
            Thêm thông số
          </button>
        </div>

        <div className="space-y-2">
          {specs.map((row, index) => (
            <div key={index} className="flex gap-2 items-start">
              <input
                type="text"
                aria-label={`Tên thông số ${index + 1}`}
                placeholder="Tên thông số (VD: CPU)"
                value={row.key}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateSpec(index, 'key', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <input
                type="text"
                aria-label={`Giá trị thông số ${index + 1}`}
                placeholder="Giá trị (VD: Intel i7)"
                value={row.value}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateSpec(index, 'value', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <button
                type="button"
                onClick={() => setSpecs((rows) => (rows.length > 1 ? rows.filter((_, i) => i !== index) : [{ key: '', value: '' }]))}
                aria-label={`Xóa thông số ${index + 1}`}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>
        <FieldError id="pf-specs-err" message={errors.specs} />
      </div>

      <BuildSpecsFields
        partType={partType}
        specs={buildSpecs}
        error={buildError}
        onChange={(type, next) => {
          setPartType(type);
          setBuildSpecs(next);
          setBuildError('');
        }}
      />

      <div className="flex justify-end gap-3 pt-4 border-t">
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
