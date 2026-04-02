import api from './api';
import { ApiResponse, DashboardStats, Order } from '../types';

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    const response = await api.get<ApiResponse<DashboardStats>>('/orders/dashboard/stats');
    return response.data.data;
  },

  async getRecentOrders(): Promise<Order[]> {
    const response = await api.get<ApiResponse<Order[]>>('/orders');
    return response.data.data.slice(0, 5);
  },
};
