import api, { apiErrorMessage } from './api';
import { ApiResponse } from '../types';

const wrap = async <T>(fn: () => Promise<T>, fallback: string): Promise<T> => {
  try {
    return await fn();
  } catch (error: any) {
    throw new Error(apiErrorMessage(error, fallback));
  }
};

/** Các tính năng AI trên dashboard (cần GEMINI_API_KEY hoặc nhà cung cấp AI khác ở backend). */
export const aiService = {
  status: (): Promise<{ enabled: boolean }> =>
    wrap(async () => (await api.get<ApiResponse<{ enabled: boolean }>>('/ai/status')).data.data, 'Không kiểm tra được trạng thái AI'),

  suggestReply: (conversationId: number): Promise<string> =>
    wrap(async () => (await api.post<ApiResponse<{ suggestion: string }>>('/ai/suggest-reply', { conversation_id: conversationId }, { timeout: 60000 })).data.data.suggestion, 'AI chưa gợi ý được câu trả lời'),

  productDescription: (input: { name: string; category?: string; specs?: Record<string, string>; current?: string }): Promise<string> =>
    wrap(async () => (await api.post<ApiResponse<{ description: string }>>('/ai/product-description', input, { timeout: 60000 })).data.data.description, 'AI chưa viết được mô tả'),

  insights: (): Promise<string> =>
    wrap(async () => (await api.post<ApiResponse<{ insights: string }>>('/ai/insights', {}, { timeout: 60000 })).data.data.insights, 'AI chưa phân tích được số liệu'),
};
