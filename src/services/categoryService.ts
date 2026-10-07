import api, { apiErrorMessage } from './api';
import { Category, ApiResponse } from '../types';

const wrap = async <T>(fn: () => Promise<T>, fallback: string): Promise<T> => {
  try {
    return await fn();
  } catch (error: any) {
    throw new Error(apiErrorMessage(error, fallback));
  }
};

export type CategoryInput = Pick<Category, 'name' | 'type'> & { parent_id?: number | null };

export const categoryService = {
  // Lấy tất cả danh mục (kèm product_count)
  getCategories: (): Promise<Category[]> =>
    wrap(async () => (await api.get<ApiResponse<Category[]>>('/categories')).data.data, 'Không thể tải danh sách danh mục'),

  // Lấy danh mục theo ID
  getCategoryById: (id: number): Promise<Category> =>
    wrap(async () => (await api.get<ApiResponse<Category>>(`/categories/${id}`)).data.data, 'Không thể tải danh mục'),

  // Tạo danh mục mới
  createCategory: (category: CategoryInput): Promise<Category> =>
    wrap(async () => (await api.post<ApiResponse<Category>>('/categories', category)).data.data, 'Không thể thêm danh mục'),

  // Cập nhật danh mục
  updateCategory: (id: number, category: Partial<CategoryInput>): Promise<Category> =>
    wrap(async () => (await api.put<ApiResponse<Category>>(`/categories/${id}`, category)).data.data, 'Không thể cập nhật danh mục'),

  // Xóa danh mục
  deleteCategory: (id: number): Promise<void> =>
    wrap(async () => {
      await api.delete(`/categories/${id}`);
    }, 'Không thể xóa danh mục'),
};
