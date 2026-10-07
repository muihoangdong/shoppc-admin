import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon,
  PaperAirplaneIcon,
  SparklesIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { chatService, ChatMessage, PendingAction } from '../../services/chatService';
import RichText from './RichText';

type CardState = 'waiting' | 'running' | 'done' | 'cancelled';

interface UIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isError?: boolean;
  actions?: PendingAction[];
  cardState?: CardState;
}

interface ChatWidgetProps {
  /** Gọi sau khi AI đã thay đổi dữ liệu thành công, để trang đang mở tải lại dữ liệu. */
  onDataChanged?: () => void;
}

const DEFAULT_SUGGESTIONS = [
  'Tình hình cửa hàng hôm nay thế nào?',
  'Sản phẩm nào sắp hết hàng?',
  'Có bao nhiêu đơn đang chờ xử lý?',
  'Doanh thu tháng này là bao nhiêu?',
];

/** Gợi ý câu hỏi theo trang người dùng đang xem. */
const suggestionsFor = (pathname: string, search: string): string[] => {
  const q = new URLSearchParams(search);
  if (pathname === '/admin/orders') {
    return q.get('open')
      ? ['Tóm tắt đơn này', 'Đơn này đang ở trạng thái nào?', 'Có bao nhiêu đơn đang chờ xử lý?']
      : ['Đơn nào đang chờ xử lý?', 'Đơn hôm nay có bao nhiêu?', 'Có đơn chuyển khoản nào chưa thanh toán không?'];
  }
  if (pathname === '/admin/products') return ['Sản phẩm nào sắp hết hàng?', 'Sản phẩm nào đã hết hàng?', 'Sản phẩm nào đắt nhất?'];
  if (pathname === '/admin/categories') return ['Danh mục nào đang trống?', 'Mỗi danh mục có bao nhiêu sản phẩm?'];
  if (pathname === '/admin/analytics') return ['Doanh thu tháng này so với tháng trước?', 'Sản phẩm bán chạy nhất 30 ngày qua?', 'Tỷ lệ hủy đơn tháng này?'];
  if (pathname === '/admin/support') {
    return q.get('c') ? ['Tóm tắt hội thoại này', 'Khách này đang hỏi gì?'] : ['Hội thoại nào đang cần nhân viên?', 'Có bao nhiêu tin chưa đọc?'];
  }
  return DEFAULT_SUGGESTIONS;
};

const MAX_SAVED = 40;

/** Khôi phục hội thoại sau khi tải lại trang. Thẻ xác nhận KHÔNG được lưu (đã hết hạn ở server) nên không bao giờ thực thi lại được. */
const loadSaved = (key: string): UIMessage[] => {
  try {
    const raw = JSON.parse(sessionStorage.getItem(key) || '[]');
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((m: any) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      .map((m: any) => ({ id: String(m.id), role: m.role, content: m.content }) as UIMessage);
  } catch {
    return [];
  }
};

const WELCOME =
  'Xin chào! Mình có thể tra cứu và quản lý sản phẩm, danh mục, đơn hàng, xem thống kê và mở các trang trong dashboard. ' +
  'Mọi thay đổi dữ liệu đều cần bạn bấm **Xác nhận** trước khi thực hiện.';

const MAX_HISTORY = 20;
let counter = 0;
const newId = () => `m${Date.now()}-${counter++}`;

const ChatWidget: React.FC<ChatWidgetProps> = ({ onDataChanged }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const storageKey = `admin_chat_v1_${user?.id ?? 'anon'}`;
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<UIMessage[]>(() => loadSaved(`admin_chat_v1_${user?.id ?? 'anon'}`));
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Lưu hội thoại (chỉ văn bản) để không mất khi tải lại trang
  useEffect(() => {
    try {
      const keep = messages.filter((m) => !m.isError).slice(-MAX_SAVED).map(({ id, role, content }) => ({ id, role, content }));
      sessionStorage.setItem(storageKey, JSON.stringify(keep));
    } catch {
      /* bỏ qua */
    }
  }, [messages, storageKey]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, loading, open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const addMessage = (msg: Omit<UIMessage, 'id'>) =>
    setMessages((prev) => [...prev, { ...msg, id: newId() }]);

  const setCardState = (id: string, cardState: CardState) =>
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, cardState } : m)));

  /** Lịch sử gửi lên server: chỉ văn bản user/assistant, bỏ tin báo lỗi. */
  const toHistory = (list: UIMessage[]): ChatMessage[] =>
    list
      .filter((m) => !m.isError)
      .map((m) => ({ role: m.role, content: m.content }))
      .slice(-MAX_HISTORY);

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || loading) return;

    const next: UIMessage[] = [...messages, { id: newId(), role: 'user', content }];
    setMessages(next);
    setInput('');
    setLoading(true);

    try {
      const res = await chatService.send(toHistory(next), { page: location.pathname, search: location.search });
      const hasActions = res.pending_actions.length > 0;
      addMessage({
        role: 'assistant',
        content: res.reply || (hasActions ? 'Mình đã chuẩn bị thao tác bên dưới, bạn kiểm tra và xác nhận nhé.' : 'Mình chưa có câu trả lời.'),
        actions: hasActions ? res.pending_actions : undefined,
        cardState: hasActions ? 'waiting' : undefined,
      });
      res.client_actions.forEach((action) => {
        if (action.type === 'navigate') navigate(action.path);
      });
    } catch (error: any) {
      addMessage({ role: 'assistant', content: error.message || 'Có lỗi xảy ra, vui lòng thử lại.', isError: true });
    } finally {
      setLoading(false);
    }
  };

  const confirm = async (msg: UIMessage) => {
    if (!msg.actions) return;
    setCardState(msg.id, 'running');
    try {
      const results = await chatService.confirm(msg.actions.map((a) => a.id));
      setCardState(msg.id, 'done');
      addMessage({
        role: 'assistant',
        content: results.map((r) => `${r.ok ? '✅' : '❌'} ${r.message}`).join('\n'),
      });
      if (results.some((r) => r.ok)) onDataChanged?.();
    } catch (error: any) {
      setCardState(msg.id, 'waiting');
      addMessage({ role: 'assistant', content: error.message || 'Không thực hiện được thao tác.', isError: true });
    }
  };

  const cancel = (msg: UIMessage) => {
    if (!msg.actions) return;
    void chatService.cancel(msg.actions.map((a) => a.id));
    setCardState(msg.id, 'cancelled');
    addMessage({ role: 'assistant', content: 'Đã hủy các thay đổi đang chờ xác nhận.' });
  };

  const clearChat = () => {
    const waiting = messages.filter((m) => m.cardState === 'waiting' && m.actions).flatMap((m) => m.actions!.map((a) => a.id));
    if (waiting.length) void chatService.cancel(waiting);
    setMessages([]);
    try {
      sessionStorage.removeItem(storageKey);
    } catch {
      /* bỏ qua */
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void send(input);
    }
  };

  return (
    <>
      {open && (
        <div
          role="dialog"
          aria-label="Trợ lý AI"
          className="fixed bottom-24 right-6 z-50 flex h-[34rem] max-h-[calc(100vh-8rem)] w-[26rem] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
        >
          <div className="flex items-center justify-between bg-blue-600 px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <SparklesIcon className="h-5 w-5" />
              <div>
                <p className="text-sm font-semibold leading-tight">Trợ lý AI Shoppc</p>
                <p className="text-xs text-blue-100">Biết bạn đang xem trang nào để trả lời đúng ngữ cảnh</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={clearChat} title="Xóa cuộc trò chuyện" className="rounded-lg p-1.5 hover:bg-blue-500">
                <TrashIcon className="h-4 w-4" />
              </button>
              <button onClick={() => setOpen(false)} title="Đóng" className="rounded-lg p-1.5 hover:bg-blue-500">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4 text-sm">
            <div className="max-w-[90%] rounded-2xl rounded-tl-sm bg-white px-3 py-2 text-slate-800 shadow-sm">
              <RichText text={WELCOME} />
            </div>

            {messages.length === 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {suggestionsFor(location.pathname, location.search).map((s) => (
                  <button
                    key={s}
                    onClick={() => void send(s)}
                    className="rounded-full border border-blue-200 bg-white px-3 py-1.5 text-xs text-blue-700 transition hover:bg-blue-50"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {messages.map((m) => (
              <div key={m.id} className={m.role === 'user' ? 'flex justify-end' : 'flex flex-col items-start gap-2'}>
                <div
                  className={
                    m.role === 'user'
                      ? 'max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-tr-sm bg-blue-600 px-3 py-2 text-white'
                      : `max-w-[90%] rounded-2xl rounded-tl-sm px-3 py-2 shadow-sm ${
                          m.isError ? 'border border-red-200 bg-red-50 text-red-700' : 'bg-white text-slate-800'
                        }`
                  }
                >
                  {m.role === 'user' ? m.content : <RichText text={m.content} />}
                </div>

                {m.actions && m.cardState && (
                  <ActionCard
                    actions={m.actions}
                    state={m.cardState}
                    onConfirm={() => void confirm(m)}
                    onCancel={() => cancel(m)}
                  />
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-1 px-1 text-slate-400" aria-live="polite">
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />
                <span className="ml-2 text-xs">Đang xử lý…</span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="border-t border-slate-200 bg-white p-3">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                maxLength={2000}
                placeholder="Nhập yêu cầu… (Enter để gửi)"
                className="max-h-28 min-h-[2.5rem] flex-1 resize-none rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <button
                onClick={() => void send(input)}
                disabled={loading || !input.trim()}
                title="Gửi"
                className="rounded-xl bg-blue-600 p-2.5 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <PaperAirplaneIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        title={open ? 'Đóng trợ lý AI' : 'Mở trợ lý AI'}
        aria-label={open ? 'Đóng trợ lý AI' : 'Mở trợ lý AI'}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition hover:bg-blue-700 hover:shadow-xl"
      >
        {open ? <XMarkIcon className="h-6 w-6" /> : <ChatBubbleLeftRightIcon className="h-6 w-6" />}
      </button>
    </>
  );
};

interface ActionCardProps {
  actions: PendingAction[];
  state: CardState;
  onConfirm: () => void;
  onCancel: () => void;
}

const ActionCard: React.FC<ActionCardProps> = ({ actions, state, onConfirm, onCancel }) => {
  const dangerous = actions.some((a) => a.danger);
  const finished = state === 'done' || state === 'cancelled';

  return (
    <div
      className={`w-full max-w-[95%] rounded-xl border p-3 shadow-sm ${
        dangerous ? 'border-red-300 bg-red-50' : 'border-amber-300 bg-amber-50'
      } ${finished ? 'opacity-60' : ''}`}
    >
      <p className={`mb-2 flex items-center gap-1.5 text-xs font-semibold ${dangerous ? 'text-red-700' : 'text-amber-800'}`}>
        <ExclamationTriangleIcon className="h-4 w-4" />
        {state === 'done'
          ? 'Đã xử lý'
          : state === 'cancelled'
          ? 'Đã hủy'
          : `Cần xác nhận (${actions.length} thao tác)`}
      </p>

      <ul className="max-h-48 space-y-2 overflow-y-auto">
        {actions.map((a) => (
          <li key={a.id} className="whitespace-pre-line rounded-lg bg-white/70 px-2.5 py-1.5 text-xs text-slate-800">
            {a.summary}
          </li>
        ))}
      </ul>

      {!finished && (
        <div className="mt-3 flex gap-2">
          <button
            onClick={onConfirm}
            disabled={state === 'running'}
            className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-medium text-white transition disabled:opacity-50 ${
              dangerous ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {state === 'running' ? 'Đang thực hiện…' : actions.length > 1 ? `Xác nhận tất cả (${actions.length})` : dangerous ? 'Xác nhận xóa' : 'Xác nhận'}
          </button>
          <button
            onClick={onCancel}
            disabled={state === 'running'}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
          >
            Hủy
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatWidget;
