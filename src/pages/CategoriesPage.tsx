import React, { useEffect, useState } from 'react';
import { Category } from '../types';
import { categoryService } from '../services/categoryService';
import { CategoryTable } from '../components/Categories/CategoryTable';
import { CategoryModal } from '../components/Categories/CategoryModal';
import { PlusIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/Common/LoadingSpinner';

const CategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await categoryService.getCategories();
      // Sắp xếp danh mục theo cấp bậc
      const sortedData = sortCategories(data);
      setCategories(sortedData);
    } catch (error) {
      toast.error('Không thể tải danh sách danh mục');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const sortCategories = (categories: Category[]): Category[] => {
    // Lấy danh mục cha
    const parentCategories = categories.filter(cat => !cat.parent_id);
    const childCategories = categories.filter(cat => cat.parent_id);
    
    // Gắn danh mục con vào danh mục cha
    return parentCategories.map(parent => ({
      ...parent,
      children: childCategories.filter(child => child.parent_id === parent.id)
    }));
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Bạn có chắc muốn xóa danh mục này? Các sản phẩm thuộc danh mục sẽ bị ảnh hưởng.')) {
      try {
        await categoryService.deleteCategory(id);
        toast.success('Xóa danh mục thành công');
        fetchCategories();
      } catch (error) {
        toast.error('Không thể xóa danh mục');
      }
    }
  };

  const handleSave = async (category: Partial<Category>) => {
    try {
      if (selectedCategory) {
        await categoryService.updateCategory(selectedCategory.id, category);
        toast.success('Cập nhật danh mục thành công');
      } else {
        await categoryService.createCategory(category as any);
        toast.success('Thêm danh mục thành công');
      }
      setIsModalOpen(false);
      setSelectedCategory(null);
      fetchCategories();
    } catch (error) {
      toast.error('Không thể lưu danh mục');
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý danh mục</h1>
        <button
          onClick={() => {
            setSelectedCategory(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <PlusIcon className="h-5 w-5" />
          Thêm danh mục
        </button>
      </div>

      <CategoryTable
        categories={categories}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedCategory(null);
        }}
        onSave={handleSave}
        category={selectedCategory}
        categories={categories}
      />
    </div>
  );
};

export default CategoriesPage;