import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { Category } from '../types';
import { categoryService } from '../services/categoryService';
import { CategoryTable } from '../components/Categories/CategoryTable';
import { CategoryModal } from '../components/Categories/CategoryModal';
import { ConfirmDialog } from '../components/Common/ConfirmDialog';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import ErrorMessage from '../components/Common/ErrorMessage';
import { useAuth } from '../contexts/AuthContext';
import usePageTitle from '../hooks/usePageTitle';
import useDebouncedCallback from '../hooks/useDebouncedCallback';
import { useRealtime } from '../contexts/RealtimeContext';
import { canDeleteCatalog } from '../utils/roles';
import { buildTree } from '../utils/categoryTree';

const CategoriesPage: React.FC = () => {
  usePageTitle('Danh mục');
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      setError('');
      setCategories(await categoryService.getCategories());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Realtime: danh mục đổi hoặc số sản phẩm đổi → làm mới
  const refreshSoon = useDebouncedCallback(() => void load(), 500);
  useRealtime('category:changed', refreshSoon);
  useRealtime('product:changed', refreshSoon);
  useRealtime('resync', refreshSoon);

  const tree = useMemo(() => buildTree(categories), [categories]);

  const handleSave = async (data: { name: string; type: Category['type']; parent_id: number | null }) => {
    if (saving) return;
    try {
      setSaving(true);
      if (selected) {
        await categoryService.updateCategory(selected.id, data);
        toast.success('Cập nhật danh mục thành công');
      } else {
        await categoryService.createCategory(data);
        toast.success('Thêm danh mục thành công');
      }
      setModalOpen(false);
      setSelected(null);
      await load();
    } catch (err: any) {
      toast.error(err.message); // giữ form mở để sửa lại
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await categoryService.deleteCategory(deleteTarget.id);
      toast.success('Xóa danh mục thành công');
      setDeleteTarget(null);
      await load();
    } catch (err: any) {
      toast.error(err.message);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error && categories.length === 0) return <ErrorMessage message={error} onRetry={() => { setLoading(true); void load(); }} />;

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Quản lý danh mục</h1>
          <p className="text-sm text-gray-500">{categories.length} danh mục</p>
        </div>
        <button
          onClick={() => {
            setSelected(null);
            setModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <PlusIcon className="h-5 w-5" />
          Thêm danh mục
        </button>
      </div>

      {error && (
        <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Không làm mới được danh sách: {error}
        </div>
      )}

      {categories.length === 0 ? (
        <div className="rounded-lg bg-white py-14 text-center text-sm text-gray-500 shadow">Chưa có danh mục nào.</div>
      ) : (
        <CategoryTable
          categories={tree}
          onEdit={(c) => {
            setSelected(c);
            setModalOpen(true);
          }}
          onDelete={setDeleteTarget}
          canDelete={canDeleteCatalog(user?.role)}
        />
      )}

      <CategoryModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelected(null);
        }}
        onSave={handleSave}
        category={selected}
        categories={categories}
        loading={saving}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        type="danger"
        title="Xóa danh mục?"
        confirmText="Xóa"
        loading={deleting}
        message={deleteTarget && <>Xóa danh mục <strong>{deleteTarget.name}</strong>? Chỉ xóa được khi danh mục không còn danh mục con và không còn sản phẩm.</>}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
};

export default CategoriesPage;
