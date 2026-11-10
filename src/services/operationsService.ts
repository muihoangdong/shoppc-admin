import api, { apiErrorMessage } from './api';

export type OperationRow = Record<string, any>;
export interface OperationList { items: OperationRow[]; total: number; page: number; limit: number }
export interface OperationLookups { products: OperationRow[]; suppliers: OperationRow[]; brands: OperationRow[]; templates: OperationRow[]; categories: OperationRow[]; orders: OperationRow[] }

export const operationsService = {
  async get<T = OperationRow>(path: string, params: Record<string, any> = {}): Promise<T> {
    try { return (await api.get<{ data: T }>(`/operations/${path}`, { params })).data.data; }
    catch (err) { throw new Error(apiErrorMessage(err, 'Không tải được dữ liệu nghiệp vụ')); }
  },
  async save(path: string, data: OperationRow = {}, method: 'post' | 'put' | 'patch' = 'post'): Promise<OperationRow> {
    try { return (await api[method]<{ data: OperationRow }>(`/operations/${path}`, data, { timeout: 120000 })).data.data; }
    catch (err) { throw new Error(apiErrorMessage(err, 'Không lưu được dữ liệu nghiệp vụ')); }
  },
  async exportProducts(): Promise<Blob> {
    try { return (await api.get('/operations/bulk/products.csv', { responseType: 'blob', timeout: 60000 })).data; }
    catch (err) { throw new Error(apiErrorMessage(err, 'Không xuất được dữ liệu sản phẩm')); }
  },
};
