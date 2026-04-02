import api from './api';
import { Category, ApiResponse } from '../types';

export const categoryService = {
  // Lấy tất cả danh mục
  async getCategories(): Promise<Category[]> {
    const response = await api.get<ApiResponse<Category[]>>('/categories');
    return response.data.data;
  },

  // Lấy danh mục theo ID
  async getCategoryById(id: number): Promise<Category> {
    const response = await api.get<ApiResponse<Category>>(`/categories/${id}`);
    return response.data.data;
  },

  // Tạo danh mục mới
  async createCategory(category: Omit<Category, 'id' | 'created_at' | 'updated_at'>): Promise<Category> {
    const response = await api.post<ApiResponse<Category>>('/categories', category);
    return response.data.data;
  },

  // Cập nhật danh mục
  async updateCategory(id: number, category: Partial<Category>): Promise<Category> {
    const response = await api.put<ApiResponse<Category>>(`/categories/${id}`, category);
    return response.data.data;
  },

  // Xóa danh mục
  async deleteCategory(id: number): Promise<void> {
    await api.delete(`/categories/${id}`);
  },
};