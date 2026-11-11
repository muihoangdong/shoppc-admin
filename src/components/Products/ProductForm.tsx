import React, { useEffect, useMemo, useState } from 'react';
import { Product, Category } from '../../types';
import { PlusIcon, SparklesIcon, TrashIcon } from '@heroicons/react/24/outline';
import { aiService } from '../../services/aiService';
import useAiStatus from '../../hooks/useAiStatus';
import { formatPrice } from '../../utils/formatters';
import { buildTree, flattenForSelect } from '../../utils/categoryTree';
import { ProductFormErrors, ProductPayload, SpecRow, validateProductForm } from '../../utils/productValidation';
import BuildSpecsFields, { BuildSpecsValue, missingBuildFields, usePartTypes } from './BuildSpecsFields';
import Model3dFields, { EMPTY_MODEL3D, Model3dValue, toPayload, validateModel3d } from './Model3dFields';
import ProductImagesField from './ProductImagesField';
import { operationsService, OperationLookups } from '../../services/operationsService';

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
  const [tab, setTab] = useState(0);
  const tabs = ['Thông tin', 'Ảnh & 3D', 'Thông số', 'Kho & bảo hành'];
  const [name, setName] = useState(initialData?.name ?? '');
  const [sku, setSku] = useState(initialData?.sku || '');
  const [brandId, setBrandId] = useState(initialData?.brand_id ? String(initialData.brand_id) : '');
  const [templateId, setTemplateId] = useState(
    initialData?.spec_template_id ? String(initialData.spec_template_id) : '',
  );
  const [warrantyMonths, setWarrantyMonths] = useState(String(initialData?.warranty_months ?? 12));
  const [serialRequired, setSerialRequired] = useState(!!initialData?.serial_required);
  const [standards, setStandards] = useState<OperationLookups | null>(null);
  const [standardError, setStandardError] = useState('');
  const [standardsLoadError, setStandardsLoadError] = useState('');
  const [standardsRetry, setStandardsRetry] = useState(0);
  useEffect(() => {
    setStandardsLoadError('');
    let alive = true;
    operationsService
      .get<OperationLookups>('lookups')
      .then((value) => alive && setStandards(value))
      .catch((err) => alive && setStandardsLoadError(err.message));
    return () => {
      alive = false;
    };
  }, [standardsRetry]);

  const [categoryId, setCategoryId] = useState(initialData?.category_id ? String(initialData.category_id) : '');
  const [price, setPrice] = useState(initialData ? String(Math.round(Number(initialData.price))) : '');
  const [stock, setStock] = useState(initialData ? String(initialData.stock) : '0');
  const [originalPrice, setOriginalPrice] = useState(
    initialData?.original_price ? String(Math.round(Number(initialData.original_price))) : '',
  );
  const [originalError, setOriginalError] = useState('');
  const [model3d, setModel3d] = useState<Model3dValue>(() =>
    initialData?.model_3d?.glb_url
      ? {
          glb: initialData.model_3d.glb_url,
          usdz: initialData.model_3d.usdz_url ?? '',
          poster: initialData.model_3d.poster_url ?? '',
          enabled: initialData.model_3d.enabled !== false,
          dimensions: {
            length: String(initialData.model_3d.dimensions_cm?.length ?? ''),
            width: String(initialData.model_3d.dimensions_cm?.width ?? ''),
            height: String(initialData.model_3d.dimensions_cm?.height ?? ''),
          },
        }
      : EMPTY_MODEL3D,
  );
  const [model3dError, setModel3dError] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>(() => [
    ...new Set([initialData?.image_url, ...(initialData?.image_urls || [])].filter((url): url is string => !!url)),
  ]);
  const imageUrl = imageUrls[0] || '';
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
  const [uploadBusy, setUploadBusy] = useState(false);
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
    if (loading || uploadBusy) return;
    const result = validateProductForm({ name, categoryId, price, stock, imageUrl, description, specs });
    setErrors(result.errors);
    const missing = partType ? missingBuildFields(partDefs, partType, buildSpecs) : [];
    setBuildError(missing.length ? `Thiếu thông số Build PC: ${missing.join(', ')}` : '');
    // Giá gốc (tùy chọn): phải lớn hơn giá bán thì cửa hàng mới hiện % giảm
    const orig = originalPrice.trim();
    const origError = !orig
      ? ''
      : !/^\d+$/.test(orig)
        ? 'Giá gốc phải là số nguyên'
        : result.payload && Number(orig) <= result.payload.price
          ? 'Giá gốc phải lớn hơn giá bán'
          : '';
    setOriginalError(origError);
    const m3dError = validateModel3d(model3d);
    setModel3dError(m3dError);
    let metadataError = '';
    if (sku && !/^[A-Z0-9._-]+$/i.test(sku)) metadataError = 'SKU chỉ gồm chữ, số, dấu chấm, gạch ngang và gạch dưới';
    if (!/^\d+$/.test(warrantyMonths) || Number(warrantyMonths) > 120) metadataError = 'Bảo hành từ 0 đến 120 tháng';
    const fields = standards?.templates.find((t) => String(t.id) === templateId)?.fields || [];
    const values = result.payload?.specs || {};
    for (const field of fields) {
      const value = values[field.key];
      if (field.required && !String(value ?? '').trim()) metadataError = `Thiếu thông số: ${field.key}`;
      if (value && field.type === 'number' && (!Number.isFinite(Number(value)) || Number(value) < 0))
        metadataError = `${field.key} phải là số không âm`;
      if (value && field.type === 'select' && !field.options.includes(String(value)))
        metadataError = `${field.key} không thuộc danh sách cho phép`;
    }
    setStandardError(metadataError);
    if (!result.payload || missing.length || origError || m3dError || metadataError) {
      setTab(
        result.errors.name ||
          result.errors.categoryId ||
          result.errors.price ||
          result.errors.description ||
          origError ||
          metadataError.startsWith('SKU')
          ? 0
          : result.errors.imageUrl || m3dError
            ? 1
            : result.errors.specs || missing.length || (metadataError && !metadataError.startsWith('Bảo hành'))
              ? 2
              : 3,
      );
      return;
    }
    // Sản phẩm cũ chưa từng là linh kiện mà vẫn để trống: không gửi gì để khỏi đụng tới (backend cũ/chưa nâng cấp vẫn chạy)
    const touchBuild = !!partType || !!initialData?.part_type;
    onSubmit({
      ...result.payload,
      image_urls: imageUrls,
      sku: sku.trim().toUpperCase() || null,
      brand_id: brandId ? Number(brandId) : null,
      spec_template_id: templateId ? Number(templateId) : null,
      warranty_months: Number(warrantyMonths),
      serial_required: serialRequired,
      original_price: orig ? Number(orig) : null,
      model_3d: toPayload(model3d),
      ...(touchBuild ? { part_type: partType || null, build_specs: partType ? buildSpecs : null } : {}),
    });
  };

  const priceNumber = /^\d+$/.test(price.trim()) ? Number(price) : null;
  const border = (field: keyof ProductFormErrors) => (errors[field] ? 'border-red-400' : 'border-gray-300');

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <fieldset disabled={loading || uploadBusy} className="min-w-0 space-y-6">
        <div
          className="mb-5 flex gap-1 overflow-x-auto border-b border-slate-200"
          role="tablist"
          aria-label="Thông tin sản phẩm"
        >
          {tabs.map((label, index) => (
            <button
              key={label}
              id={`product-tab-${index}`}
              type="button"
              role="tab"
              aria-selected={tab === index}
              aria-controls={`product-panel-${index}`}
              tabIndex={tab === index ? 0 : -1}
              onClick={() => setTab(index)}
              onKeyDown={(e) => {
                if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) {
                  e.preventDefault();
                  const next =
                    e.key === 'Home' ? 0 : e.key === 'End' ? 3 : (index + (e.key === 'ArrowRight' ? 1 : 3)) % 4;
                  setTab(next);
                  document.getElementById(`product-tab-${next}`)?.focus();
                }
              }}
              className={`shrink-0 border-b-2 px-3 py-3 text-sm font-medium ${tab === index ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
            >
              {label}
            </button>
          ))}
        </div>
        {(standardError || standardsLoadError) && (
          <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {standardError || standardsLoadError}
            {standardsLoadError && (
              <button type="button" onClick={() => setStandardsRetry((value) => value + 1)} className="ml-2 underline">
                Thử lại
              </button>
            )}
          </p>
        )}
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_220px]">
          <div className="min-w-0">
            <section
              id="product-panel-0"
              role="tabpanel"
              aria-labelledby="product-tab-0"
              hidden={tab !== 0}
              className="space-y-6"
            >
              <div>
                <label htmlFor="pf-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Tên sản phẩm <span className="text-red-500">*</span>
                </label>
                <input
                  id="pf-name"
                  type="text"
                  value={name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setName(e.target.value);
                    clear('name');
                  }}
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
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                    setCategoryId(e.target.value);
                    setTemplateId('');
                    clear('categoryId');
                  }}
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

              <div className="grid gap-3 sm:grid-cols-2">
                {' '}
                <label className="block text-xs text-slate-600">
                  SKU (duy nhất)
                  <input
                    className={inputClass}
                    value={sku}
                    maxLength={100}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="CPU-AMD-9800X3D"
                  />
                </label>{' '}
                <label className="block text-xs text-slate-600">
                  Thương hiệu
                  <select className={inputClass} value={brandId} onChange={(e) => setBrandId(e.target.value)}>
                    <option value="">Chưa chọn</option>
                    {standards?.brands
                      .filter((b) => Number(b.is_active) || String(b.id) === brandId)
                      .map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                  </select>
                </label>
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
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setPrice(e.target.value);
                      clear('price');
                    }}
                    className={`${inputClass} ${border('price')}`}
                    placeholder="15000000"
                    aria-invalid={!!errors.price}
                    aria-describedby="pf-price-err"
                  />
                  {priceNumber !== null && priceNumber > 0 && !errors.price && (
                    <p className="mt-1 text-xs text-gray-500">= {formatPrice(priceNumber)}</p>
                  )}
                  <FieldError id="pf-price-err" message={errors.price} />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="pf-original" className="block text-sm font-medium text-gray-700 mb-1">
                    Giá gốc / giá niêm yết{' '}
                    <span className="text-gray-400">(tùy chọn — để hiện giá gạch ngang và % giảm)</span>
                  </label>
                  <input
                    id="pf-original"
                    type="text"
                    inputMode="numeric"
                    value={originalPrice}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setOriginalPrice(e.target.value);
                      setOriginalError('');
                    }}
                    className={`${inputClass} ${originalError ? 'border-red-400' : 'border-gray-300'}`}
                    placeholder="Để trống nếu không giảm giá"
                    aria-invalid={!!originalError}
                    aria-describedby="pf-original-err"
                  />
                  {!originalError &&
                    priceNumber &&
                    /^\d+$/.test(originalPrice.trim()) &&
                    Number(originalPrice) > priceNumber && (
                      <p className="mt-1 text-xs text-green-600">
                        Giảm {Math.round(((Number(originalPrice) - priceNumber) / Number(originalPrice)) * 100)}% (={' '}
                        {formatPrice(Number(originalPrice))})
                      </p>
                    )}
                  <FieldError id="pf-original-err" message={originalError} />
                </div>
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label htmlFor="pf-desc" className="block text-sm font-medium text-gray-700">
                    Mô tả sản phẩm
                  </label>
                  {aiEnabled && (
                    <div className="flex items-center gap-3 text-xs">
                      {descBackup !== null && (
                        <button
                          type="button"
                          onClick={() => {
                            setDescription(descBackup);
                            setDescBackup(null);
                          }}
                          className="text-gray-500 underline hover:text-gray-700"
                        >
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
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                    setDescription(e.target.value);
                    clear('description');
                  }}
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
            </section>
            <section
              id="product-panel-1"
              role="tabpanel"
              aria-labelledby="product-tab-1"
              hidden={tab !== 1}
              className="space-y-6"
            >
              <ProductImagesField
                value={imageUrls}
                onChange={(images) => {
                  setImageUrls(images);
                  clear('imageUrl');
                }}
                disabled={loading || uploadBusy}
                onBusyChange={setUploadBusy}
                error={errors.imageUrl}
              />

              <Model3dFields
                value={model3d}
                onChange={(next) => {
                  setModel3d(next);
                  setModel3dError('');
                }}
                error={model3dError}
                imageUrl={imageUrl.trim() || undefined}
                disabled={loading || uploadBusy}
                onBusyChange={setUploadBusy}
              />
            </section>
            <section
              id="product-panel-2"
              role="tabpanel"
              aria-labelledby="product-tab-2"
              hidden={tab !== 2}
              className="space-y-6"
            >
              <label className="block text-xs text-slate-600">
                Mẫu thông số
                <select
                  className={inputClass}
                  value={templateId}
                  onChange={(e) => {
                    setTemplateId(e.target.value);
                    const fields = standards?.templates.find((t) => String(t.id) === e.target.value)?.fields || [];
                    setSpecs((current) => {
                      const filled = current.filter((r) => r.key.trim());
                      return [
                        ...filled,
                        ...fields
                          .filter((f: { key: string }) => !filled.some((r) => r.key === f.key))
                          .map((f: { key: string }) => ({ key: f.key, value: '' })),
                      ];
                    });
                  }}
                >
                  <option value="">Không dùng mẫu</option>
                  {standards?.templates
                    .filter((t) => String(t.category_id) === categoryId)
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                </select>
              </label>
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="block text-sm font-medium text-gray-700">Thông số kỹ thuật</span>
                  <button
                    type="button"
                    onClick={() => setSpecs((rows) => [...rows, { key: '', value: '' }])}
                    className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                  >
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
                      {standards?.templates
                        .find((t) => String(t.id) === templateId)
                        ?.fields.find((f: { key: string }) => f.key === row.key)?.type === 'select' ? (
                        <select
                          aria-label={`Giá trị thông số ${index + 1}`}
                          value={row.value}
                          onChange={(e) => updateSpec(index, 'value', e.target.value)}
                          className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        >
                          <option value="">Chọn {row.key}</option>
                          {standards.templates
                            .find((t) => String(t.id) === templateId)
                            ?.fields.find((f: { key: string }) => f.key === row.key)
                            ?.options.map((v: string) => (
                              <option key={v} value={v}>
                                {v}
                              </option>
                            ))}
                        </select>
                      ) : (
                        <input
                          type={
                            standards?.templates
                              .find((t) => String(t.id) === templateId)
                              ?.fields.find((f: { key: string }) => f.key === row.key)?.type === 'number'
                              ? 'number'
                              : 'text'
                          }
                          min={0}
                          step="any"
                          aria-label={`Giá trị thông số ${index + 1}`}
                          placeholder={`Giá trị ${row.key || 'thông số'}`}
                          value={row.value}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            updateSpec(index, 'value', e.target.value)
                          }
                          className="min-w-0 flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          setSpecs((rows) =>
                            rows.length > 1 ? rows.filter((_, i) => i !== index) : [{ key: '', value: '' }],
                          )
                        }
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
            </section>
            <section
              id="product-panel-3"
              role="tabpanel"
              aria-labelledby="product-tab-3"
              hidden={tab !== 3}
              className="space-y-6"
            >
              <fieldset className="space-y-3 rounded-xl border border-slate-200 p-4">
                <legend className="px-1 text-sm font-medium text-slate-700">Bảo hành & serial</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-xs text-slate-600">
                    Bảo hành (tháng)
                    <input
                      className={inputClass}
                      type="number"
                      min={0}
                      max={120}
                      value={warrantyMonths}
                      onChange={(e) => setWarrantyMonths(e.target.value)}
                    />
                  </label>
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={serialRequired}
                    onChange={(e) => setSerialRequired(e.target.checked)}
                  />
                  Quản lý từng sản phẩm bằng serial
                </label>
                <p className="text-xs text-slate-500">
                  Hàng theo serial phải tạo với tồn 0 rồi nhập kho kèm serial. Không đổi chế độ sau khi đã đăng ký
                  serial.
                </p>
              </fieldset>

              <div>
                <label htmlFor="pf-stock" className="block text-sm font-medium text-gray-700 mb-1">
                  Số lượng tồn kho <span className="text-red-500">*</span>
                </label>
                <input
                  id="pf-stock"
                  type="text"
                  inputMode="numeric"
                  value={stock}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setStock(e.target.value);
                    clear('stock');
                  }}
                  className={`${inputClass} ${border('stock')}`}
                  placeholder="0"
                  aria-invalid={!!errors.stock}
                  aria-describedby="pf-stock-err"
                />
                <FieldError id="pf-stock-err" message={errors.stock} />
              </div>
            </section>
          </div>
          <aside className="hidden rounded-xl bg-slate-50 p-4 lg:block">
            <p className="mb-3 text-xs font-medium text-slate-500">Xem trước thẻ sản phẩm</p>
            <div className="rounded-xl bg-white p-3">
              <div className="flex aspect-[4/3] items-center justify-center rounded-lg bg-slate-50 p-2">
                {imageUrl ? (
                  <img src={imageUrl} alt="Ảnh xem trước" className="max-h-32 max-w-full object-contain" />
                ) : (
                  <span className="text-xs text-slate-400">Chưa có ảnh</span>
                )}
              </div>
              <p className="mt-3 text-xs text-slate-500">
                {categories.find((c) => String(c.id) === categoryId)?.name || 'Danh mục'}
              </p>
              <h3 className="mt-1 line-clamp-2 min-h-10 text-sm font-semibold">{name || 'Tên sản phẩm'}</h3>
              <p className="my-3 font-semibold text-blue-600">{formatPrice(priceNumber || 0)}</p>
              <p className="text-xs text-slate-500">{Number(stock) > 0 ? `Còn ${stock} sản phẩm` : 'Tạm hết hàng'}</p>
              <div className="mt-3 rounded-lg bg-blue-600 p-2 text-center text-xs font-medium text-white">
                Thêm giỏ hàng
              </div>
            </div>
          </aside>
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
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
      </fieldset>
    </form>
  );
};
