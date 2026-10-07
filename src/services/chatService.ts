import api, { API_BASE_URL } from './api';
import { ApiResponse } from '../types';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/** Thao tác ghi dữ liệu do AI đề xuất, đang chờ người dùng xác nhận. */
export interface PendingAction {
  id: string;
  tool: string;
  summary: string;
  danger: boolean;
}

export interface ClientAction {
  type: 'navigate';
  path: string;
}

export interface ChatReply {
  reply: string;
  pending_actions: PendingAction[];
  client_actions: ClientAction[];
}

export interface ActionResult {
  id: string;
  ok: boolean;
  message: string;
}

// AI có thể cần vài vòng gọi tool nên cho timeout dài hơn mặc định (10s)
const CHAT_TIMEOUT_MS = 60000;

const toError = (error: any, fallback: string): Error => {
  // Có phản hồi từ backend (kể cả lỗi AI như "Google từ chối key", "không kết nối được tới dịch vụ AI"): hiện nguyên văn
  if (error?.response?.data?.message) return new Error(error.response.data.message);
  if (error?.code === 'ECONNABORTED') return new Error('AI phản hồi quá lâu, vui lòng thử lại.');
  // Không có phản hồi nào: lỗi nằm ở đường tới BACKEND (backend chưa chạy/đã dừng, sai VITE_API_URL, bị chặn CORS), chưa phải lỗi AI
  if (error?.request && !error?.response) {
    return new Error(`Không kết nối được tới máy chủ backend (${API_BASE_URL}). Hãy kiểm tra backend đang chạy, rồi mở tab Network của trình duyệt để xem chi tiết.`);
  }
  return new Error(fallback);
};

export const chatService = {
  /** `context` cho AI biết người dùng đang xem trang nào (ví dụ đang mở chi tiết đơn #25) để hiểu "đơn này". */
  async send(messages: ChatMessage[], context?: { page: string; search: string }): Promise<ChatReply> {
    try {
      const res = await api.post<ApiResponse<ChatReply>>('/chat', { messages, context }, { timeout: CHAT_TIMEOUT_MS });
      return res.data.data;
    } catch (error: any) {
      throw toError(error, 'Không gửi được tin nhắn tới chatbot.');
    }
  },

  async confirm(actionIds: string[]): Promise<ActionResult[]> {
    try {
      const res = await api.post<ApiResponse<{ results: ActionResult[] }>>(
        '/chat/confirm',
        { action_ids: actionIds },
        { timeout: CHAT_TIMEOUT_MS }
      );
      return res.data.data.results;
    } catch (error: any) {
      throw toError(error, 'Không thực hiện được thao tác.');
    }
  },

  async cancel(actionIds: string[]): Promise<void> {
    try {
      await api.post('/chat/cancel', { action_ids: actionIds });
    } catch {
      // Hủy thất bại không quan trọng: thao tác sẽ tự hết hạn sau vài phút
    }
  },
};
