import api, { apiErrorMessage } from './api';
import { Product, ApiResponse } from '../types';

const wrap = async <T>(fn: () => Promise<T>, fallback: string): Promise<T> => {
  try {
    return await fn();
  } catch (error: any) {
    // Giữ nguyên thông báo tiếng Việt của server (ví dụ "Giá phải là số nguyên…", "Không thể xóa vì…")
    throw new Error(apiErrorMessage(error, fallback));
  }
};

export type ProductInput = Omit<Product, 'id' | 'created_at' | 'updated_at' | 'category_name'>;

export const productService = {
  // Lấy tất cả sản phẩm
  getProducts: (): Promise<Product[]> =>
    wrap(async () => (await api.get<ApiResponse<Product[]>>('/products')).data.data, 'Không thể tải danh sách sản phẩm'),

  // Lấy sản phẩm theo ID
  getProductById: (id: number): Promise<Product> =>
    wrap(async () => (await api.get<ApiResponse<Product>>(`/products/${id}`)).data.data, 'Không thể tải sản phẩm'),

  // Tạo sản phẩm mới
  createProduct: (product: ProductInput): Promise<Product> =>
    wrap(async () => (await api.post<ApiResponse<Product>>('/products', product)).data.data, 'Không thể thêm sản phẩm'),

  // Cập nhật sản phẩm
  updateProduct: (id: number, product: Partial<ProductInput>): Promise<Product> =>
    wrap(async () => (await api.put<ApiResponse<Product>>(`/products/${id}`, product)).data.data, 'Không thể cập nhật sản phẩm'),

  // Xóa sản phẩm
  deleteProduct: (id: number): Promise<void> =>
    wrap(async () => {
      await api.delete(`/products/${id}`);
    }, 'Không thể xóa sản phẩm'),

  // Đặt lại tồn kho; trả về sản phẩm sau khi cập nhật
  updateStock: (id: number, quantity: number): Promise<Product> =>
    wrap(async () => (await api.patch<ApiResponse<Product>>(`/products/${id}/stock`, { quantity })).data.data, 'Không thể cập nhật tồn kho'),
};
