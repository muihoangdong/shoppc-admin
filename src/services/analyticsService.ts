import api, { apiErrorMessage } from './api';
import { Analytics, AnalyticsPeriod, ApiResponse } from '../types';

export type AnalyticsQuery = { period: AnalyticsPeriod } | { from: string; to: string };

export const analyticsService = {
  async getAnalytics(query: AnalyticsQuery): Promise<Analytics> {
    try {
      const response = await api.get<ApiResponse<Analytics>>('/orders/analytics', { params: query });
      return response.data.data;
    } catch (error: any) {
      throw new Error(apiErrorMessage(error, 'Không thể tải số liệu thống kê'));
    }
  },
};
