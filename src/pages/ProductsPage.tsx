import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { Category, Product } from '../types';
import { productService } from '../services/productService';
import { categoryService } from '../services/categoryService';
import { ProductTable } from '../components/Products/ProductTable';
import { ProductModal } from '../components/Products/ProductModal';
import { ConfirmDialog } from '../components/Common/ConfirmDialog';
import Pagination from '../components/Common/Pagination';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import ErrorMessage from '../components/Common/ErrorMessage';
import { useAuth } from '../contexts/AuthContext';
import usePageTitle from '../hooks/usePageTitle';
import useDebounce from '../hooks/useDebounce';
import useDebouncedCallback from '../hooks/useDebouncedCallback';
import { useRealtime } from '../contexts/RealtimeContext';
import { canDeleteCatalog } from '../utils/roles';
import { buildTree, flattenForSelect, selfAndDescendants } from '../utils/categoryTree';
import { LOW_STOCK_THRESHOLD } from '../utils/stock';
import { ProductPayload } from '../utils/productValidation';

const PAGE_SIZE = 10;

type StockFilter = '' | 'low' | 'out' | 'ok';
type SortKey = 'newest' | 'name' | 'price_asc' | 'price_desc' | 'stock_asc';

const SORTS: { value: SortKey; label: string }[] = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'name', label: 'Tên A → Z' },
  { value: 'price_asc', label: 'Giá thấp → cao' },
  { value: 'price_desc', label: 'Giá cao → thấp' },
  { value: 'stock_asc', label: 'Tồn kho ít → nhiều' },
];

const normalize = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();

const matchesStock = (p: Product, f: StockFilter) =>
  f === '' ||
  (f === 'low' && p.stock <= LOW_STOCK_THRESHOLD) ||
  (f === 'out' && p.stock <= 0) ||
  (f === 'ok' && p.stock > LOW_STOCK_THRESHOLD);

const sortProducts = (list: Product[], key: SortKey): Product[] => {
  const copy = [...list];
  switch (key) {
    case 'name':
      return copy.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
    case 'price_asc':
      return copy.sort((a, b) => Number(a.price) - Number(b.price));
    case 'price_desc':
      return copy.sort((a, b) => Number(b.price) - Number(a.price));
    case 'stock_asc':
      return copy.sort((a, b) => a.stock - b.stock || a.id - b.id);
    default:
      return copy.sort((a, b) => b.id - a.id);
  }
};

const inputClass =
  'rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';

const ProductsPage: React.FC = () => {
  usePageTitle('Sản phẩm');
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const urlStock = params.get('stock');
  const stockFilter: StockFilter = urlStock === 'low' || urlStock === 'out' || urlStock === 'ok' ? urlStock : '';

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesError, setCategoriesError] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput, 250);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sort, setSort] = useState<SortKey>('newest');
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadProducts = useCallback(async () => {
    try {
      setError('');
      setProducts(await productService.getProducts());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      setCategoriesError('');
      setCategories(await categoryService.getCategories());
    } catch (err: any) {
      setCategoriesError(err.message);
    }
  }, []);

  useEffect(() => {
    void loadProducts();
    void loadCategories();
  }, [loadProducts, loadCategories]);

  // Realtime: sản phẩm/tồn kho đổi (đơn mới trừ kho, hủy đơn hoàn kho, nhân viên khác sửa...) → cập nhật danh sách tại chỗ
  const refreshProducts = useDebouncedCallback(() => void loadProducts(), 500);
  const refreshCategories = useDebouncedCallback(() => void loadCategories(), 500);
  useRealtime('product:changed', refreshProducts);
  useRealtime('category:changed', () => { refreshCategories(); refreshProducts(); });
  useRealtime('resync', () => { refreshProducts(); refreshCategories(); });

  useEffect(() => {
    setPage(1);
  }, [search, categoryFilter, stockFilter, sort]);

  const categoryOptions = useMemo(() => flattenForSelect(buildTree(categories)), [categories]);

  const filtered = useMemo(() => {
    const q = normalize(search.trim());
    const ids = categoryFilter ? selfAndDescendants(categories, Number(categoryFilter)) : null; // gồm cả danh mục con
    return sortProducts(
      products.filter(
        (p) =>
          (!ids || ids.has(p.category_id)) &&
          matchesStock(p, stockFilter) &&
          (!q || normalize(p.name).includes(q) || String(p.id) === q || normalize(p.category_name || '').includes(q))
      ),
      sort
    );
  }, [products, categories, search, categoryFilter, stockFilter, sort]);

  const pages = Math.max(Math.ceil(filtered.length / PAGE_SIZE), 1);
  const currentPage = Math.min(page, pages);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const hasFilters = !!(searchInput || categoryFilter || stockFilter);

  const setStockFilter = (value: StockFilter) => {
    const next = new URLSearchParams(params);
    if (value) next.set('stock', value);
    else next.delete('stock');
    setParams(next, { replace: true });
  };

  const clearFilters = () => {
    setSearchInput('');
    setCategoryFilter('');
    setStockFilter('');
  };

  const handleSave = async (payload: ProductPayload) => {
    if (saving) return;
    try {
      setSaving(true);
      if (selected) {
        await productService.updateProduct(selected.id, payload);
        toast.success('Cập nhật sản phẩm thành công');
      } else {
        await productService.createProduct(payload as any);
        toast.success('Thêm sản phẩm thành công');
      }
      setModalOpen(false);
      setSelected(null);
      await loadProducts();
    } catch (err: any) {
      toast.error(err.message); // giữ form mở để người dùng sửa lại theo thông báo của server
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStock = async (product: Product, quantity: number) => {
    try {
      const updated = await productService.updateStock(product.id, quantity);
      setProducts((list) => list.map((p) => (p.id === product.id ? { ...p, stock: updated?.stock ?? quantity } : p)));
      toast.success(`Đã cập nhật tồn kho "${product.name}": ${quantity}`);
    } catch (err: any) {
      toast.error(err.message);
      throw err;
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await productService.deleteProduct(deleteTarget.id);
      toast.success('Xóa sản phẩm thành công');
      setDeleteTarget(null);
      await loadProducts();
    } catch (err: any) {
      toast.error(err.message);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error && products.length === 0) return <ErrorMessage message={error} onRetry={() => { setLoading(true); void loadProducts(); }} />;

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Quản lý sản phẩm</h1>
          <p className="text-sm text-gray-500">{products.length} sản phẩm</p>
        </div>
        <button
          onClick={() => {
            setSelected(null);
            setModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <PlusIcon className="h-5 w-5" />
          Thêm sản phẩm
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg bg-white p-4 shadow">
        <div className="relative min-w-[14rem] flex-1">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            value={searchInput}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchInput(e.target.value)}
            placeholder="Tìm theo tên, danh mục hoặc mã #…"
            aria-label="Tìm sản phẩm"
            className={`${inputClass} w-full pl-9`}
          />
        </div>
        <select value={categoryFilter} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCategoryFilter(e.target.value)} aria-label="Lọc theo danh mục" className={inputClass}>
          <option value="">Tất cả danh mục</option>
          {categoryOptions.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
        <select value={stockFilter} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStockFilter(e.target.value as StockFilter)} aria-label="Lọc theo tồn kho" className={inputClass}>
          <option value="">Mọi tồn kho</option>
          <option value="low">Sắp hết & hết hàng (≤ {LOW_STOCK_THRESHOLD})</option>
          <option value="out">Hết hàng</option>
          <option value="ok">Còn hàng</option>
        </select>
        <select value={sort} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSort(e.target.value as SortKey)} aria-label="Sắp xếp" className={inputClass}>
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        {hasFilters && (
          <button onClick={clearFilters} className="rounded-lg border px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">
            Xóa bộ lọc
          </button>
        )}
      </div>

      {error && (
        <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Không làm mới được danh sách: {error}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-lg bg-white py-14 text-center text-sm text-gray-500 shadow">
          {products.length === 0 ? (
            'Chưa có sản phẩm nào. Bấm "Thêm sản phẩm" để bắt đầu.'
          ) : (
            <>
              Không có sản phẩm nào phù hợp.{' '}
              <button onClick={clearFilters} className="text-blue-600 underline">
                Xóa bộ lọc
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg shadow">
          <ProductTable
            products={visible}
            onEdit={(p) => {
              setSelected(p);
              setModalOpen(true);
            }}
            onDelete={setDeleteTarget}
            onUpdateStock={handleUpdateStock}
            canDelete={canDeleteCatalog(user?.role)}
          />
          <Pagination page={currentPage} pages={pages} total={filtered.length} pageSize={PAGE_SIZE} onChange={setPage} unit="sản phẩm" />
        </div>
      )}

      <ProductModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelected(null);
        }}
        onSave={handleSave}
        product={selected}
        categories={categories}
        categoriesError={categoriesError}
        onRetryCategories={() => void loadCategories()}
        loading={saving}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        type="danger"
        title="Xóa sản phẩm?"
        confirmText="Xóa"
        loading={deleting}
        message={
          deleteTarget && (
            <>
              Xóa vĩnh viễn <strong>{deleteTarget.name}</strong>? Không thể hoàn tác. Nếu sản phẩm đã có trong đơn hàng, hệ thống sẽ từ chối xóa (hãy đặt tồn kho về 0 thay thế).
            </>
          )
        }
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
};

export default ProductsPage;
