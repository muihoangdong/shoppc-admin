import api, { apiErrorMessage } from './api';
import { ApiResponse, SupportConversation, SupportMessage } from '../types';

const wrap = async <T>(fn: () => Promise<T>, fallback: string): Promise<T> => {
  try {
    return await fn();
  } catch (error: any) {
    throw new Error(apiErrorMessage(error, fallback));
  }
};

export interface ConversationFilters {
  status?: 'open' | 'closed' | '';
  needs_human?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ConversationPage {
  conversations: SupportConversation[];
  meta: { total: number; page: number; limit: number; pages: number; unread_total: number };
}

/** API chat hỗ trợ dành cho nhân viên (cần đăng nhập). */
export const supportService = {
  list: (f: ConversationFilters = {}): Promise<ConversationPage> =>
    wrap(async () => {
      const params: Record<string, unknown> = { page: f.page || 1, limit: f.limit || 20 };
      if (f.status) params.status = f.status;
      if (f.needs_human) params.needs_human = 1;
      if (f.search) params.search = f.search;
      const res = await api.get<ApiResponse<SupportConversation[]>>('/support/staff/conversations', { params });
      return { conversations: res.data.data, meta: res.data.meta };
    }, 'Không thể tải danh sách hội thoại'),

  get: (id: number): Promise<{ conversation: SupportConversation; messages: SupportMessage[] }> =>
    wrap(async () => (await api.get<ApiResponse<{ conversation: SupportConversation; messages: SupportMessage[] }>>(`/support/staff/conversations/${id}`)).data.data, 'Không thể tải hội thoại'),

  messagesAfter: (id: number, afterId: number): Promise<SupportMessage[]> =>
    wrap(async () => (await api.get<ApiResponse<SupportMessage[]>>(`/support/staff/conversations/${id}/messages`, { params: { after_id: afterId } })).data.data, 'Không thể đồng bộ tin nhắn'),

  messagesBefore: (id: number, beforeId: number): Promise<SupportMessage[]> =>
    wrap(async () => (await api.get<ApiResponse<SupportMessage[]>>(`/support/staff/conversations/${id}/messages`, { params: { before_id: beforeId } })).data.data, 'Không thể tải tin nhắn cũ hơn'),

  reply: (id: number, content: string): Promise<{ message: SupportMessage; conversation: SupportConversation }> =>
    wrap(async () => (await api.post<ApiResponse<{ message: SupportMessage; conversation: SupportConversation }>>(`/support/staff/conversations/${id}/messages`, { content })).data.data, 'Không gửi được tin nhắn'),

  markRead: (id: number): Promise<SupportConversation> =>
    wrap(async () => (await api.post<ApiResponse<SupportConversation>>(`/support/staff/conversations/${id}/read`)).data.data, 'Không thể đánh dấu đã đọc'),

  /** Báo "đang gõ": lỗi mạng bị bỏ qua vì không quan trọng. */
  typing: async (id: number, typing: boolean): Promise<void> => {
    try {
      await api.post(`/support/staff/conversations/${id}/typing`, { typing });
    } catch {
      /* bỏ qua */
    }
  },

  update: (id: number, patch: { status?: 'open' | 'closed'; assign_to_me?: boolean; ai_enabled?: boolean }): Promise<SupportConversation> =>
    wrap(async () => (await api.patch<ApiResponse<SupportConversation>>(`/support/staff/conversations/${id}`, patch)).data.data, 'Không thể cập nhật hội thoại'),

  unread: (): Promise<number> =>
    wrap(async () => (await api.get<ApiResponse<{ unread_total: number }>>('/support/staff/unread')).data.data.unread_total, 'Không thể tải số tin chưa đọc'),
};
