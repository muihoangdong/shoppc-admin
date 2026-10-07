import api, { apiErrorMessage } from './api';
import { ApiResponse, DashboardStats } from '../types';

export const dashboardService = {
  /** Một lần gọi trả về toàn bộ số liệu tổng quan (số liệu, doanh thu tháng, top bán chạy, tồn kho thấp, đơn gần đây). */
  async getStats(): Promise<DashboardStats> {
    try {
      const response = await api.get<ApiResponse<DashboardStats>>('/orders/dashboard/stats');
      return response.data.data;
    } catch (error: any) {
      throw new Error(apiErrorMessage(error, 'Không thể tải số liệu tổng quan'));
    }
  },
};
