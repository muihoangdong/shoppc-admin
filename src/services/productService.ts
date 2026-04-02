import api from './api';
import { Product, ApiResponse } from '../types';

export const productService = {
  // Lấy tất cả sản phẩm
  async getProducts(): Promise<Product[]> {
    const response = await api.get<ApiResponse<Product[]>>('/products');
    return response.data.data;
  },

  // Lấy sản phẩm theo ID
  async getProductById(id: number): Promise<Product> {
    const response = await api.get<ApiResponse<Product>>(`/products/${id}`);
    return response.data.data;
  },

  // Tạo sản phẩm mới
  async createProduct(product: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product> {
    const response = await api.post<ApiResponse<Product>>('/products', product);
    return response.data.data;
  },

  // Cập nhật sản phẩm
  async updateProduct(id: number, product: Partial<Product>): Promise<Product> {
    const response = await api.put<ApiResponse<Product>>(`/products/${id}`, product);
    return response.data.data;
  },

  // Xóa sản phẩm
  async deleteProduct(id: number): Promise<void> {
    await api.delete(`/products/${id}`);
  },

  // Cập nhật tồn kho
  async updateStock(id: number, quantity: number): Promise<void> {
    await api.patch(`/products/${id}/stock`, { quantity });
  },
};