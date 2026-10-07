import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ArrowLeftIcon, PaperAirplaneIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { SupportConversation, SupportMessage } from '../../types';
import { formatDateTime, formatPhone } from '../../utils/formatters';
import { QUICK_REPLIES } from '../../utils/quickReplies';

interface Props {
  conversation: SupportConversation;
  messages: SupportMessage[];
  customerTyping: boolean;
  loading: boolean;
  error: string;
  onRetry: () => void;
  onSend: (text: string) => Promise<void>;
  onTypingChange: (typing: boolean) => void;
  onUpdate: (patch: { status?: 'open' | 'closed'; assign_to_me?: boolean; ai_enabled?: boolean }) => Promise<void>;
  aiAvailable: boolean;
  onSuggest: () => Promise<string>;
  hasOlder: boolean;
  onLoadOlder: () => Promise<void>;
  onBack: () => void;
  myId?: number;
}

const STYLE: Record<SupportMessage['sender_type'], string> = {
  customer: 'bg-white border text-gray-800 self-start rounded-bl-sm',
  staff: 'bg-blue-600 text-white self-end rounded-br-sm',
  ai: 'bg-purple-100 text-purple-900 self-end rounded-br-sm',
  system: 'bg-transparent text-gray-500 italic self-center text-xs',
};

const LABEL: Record<SupportMessage['sender_type'], (m: SupportMessage, customer: string) => string> = {
  customer: (_m, customer) => customer,
  staff: (m) => m.sender_name || 'Nhân viên',
  ai: () => 'Trợ lý AI',
  system: () => '',
};

export const ThreadView: React.FC<Props> = ({
  conversation, messages, customerTyping, loading, error, onRetry, onSend, onTypingChange, onUpdate, aiAvailable, onSuggest, hasOlder, onLoadOlder, onBack, myId,
}) => {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [suggestionNote, setSuggestionNote] = useState(false);
  const [suggestError, setSuggestError] = useState('');
  const [loadingOlder, setLoadingOlder] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);
  const lastTypingSent = useRef(0);
  const idleTimer = useRef<number | undefined>(undefined);
  const customer = conversation.customer_name || 'Khách ẩn danh';

  // Đổi hội thoại: xóa nháp, cuộn xuống cuối
  useEffect(() => {
    setText('');
    setSuggestionNote(false);
    setSuggestError('');
    stickToBottom.current = true;
  }, [conversation.id]);

  // Có tin mới: chỉ tự cuộn xuống khi đang ở gần cuối (không giật khi nhân viên đang đọc tin cũ)
  useLayoutEffect(() => {
    const el = listRef.current;
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight;
  }, [messages.length, customerTyping, conversation.id]);

  useEffect(() => () => window.clearTimeout(idleTimer.current), []);

  const onScroll = () => {
    const el = listRef.current;
    if (el) stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  };

  const notifyTyping = (value: string) => {
    if (!value.trim()) {
      window.clearTimeout(idleTimer.current);
      onTypingChange(false);
      return;
    }
    const now = Date.now();
    if (now - lastTypingSent.current > 2000) {
      lastTypingSent.current = now;
      onTypingChange(true);
    }
    window.clearTimeout(idleTimer.current);
    idleTimer.current = window.setTimeout(() => onTypingChange(false), 3000);
  };

  const send = async () => {
    const value = text.trim();
    if (!value || sending) return;
    setSending(true);
    window.clearTimeout(idleTimer.current);
    onTypingChange(false);
    stickToBottom.current = true;
    try {
      await onSend(value);
      setText('');
      setSuggestionNote(false);
    } catch {
      /* trang cha đã báo lỗi; giữ nguyên nội dung để gửi lại */
    } finally {
      setSending(false);
    }
  };

  const suggest = async () => {
    if (text.trim() && !window.confirm('Ô soạn tin đang có nội dung. Thay bằng gợi ý của AI?')) return;
    setSuggesting(true);
    setSuggestError('');
    try {
      setText(await onSuggest());
      setSuggestionNote(true);
    } catch (err: any) {
      setSuggestError(err.message || 'AI chưa gợi ý được');
    } finally {
      setSuggesting(false);
    }
  };

  const loadOlder = async () => {
    setLoadingOlder(true);
    const el = listRef.current;
    const before = el ? el.scrollHeight : 0;
    stickToBottom.current = false;
    try {
      await onLoadOlder();
    } finally {
      setLoadingOlder(false);
      requestAnimationFrame(() => {
        if (el) el.scrollTop = el.scrollHeight - before; // giữ nguyên vị trí đang đọc
      });
    }
  };

  const closed = conversation.status === 'closed';
  const mine = myId !== undefined && conversation.assigned_to === myId;

  return (
    <div className="flex h-full flex-col bg-gray-50">
      <div className="flex flex-wrap items-center gap-3 border-b bg-white px-4 py-3">
        <button onClick={onBack} aria-label="Về danh sách" className="rounded p-1 hover:bg-gray-100 lg:hidden">
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-gray-900" data-testid="thread-title">{customer}</p>
          <p className="truncate text-xs text-gray-500">
            {conversation.customer_phone ? `${formatPhone(conversation.customer_phone)} · ` : ''}
            {conversation.user_id ? 'Khách có tài khoản' : 'Khách vãng lai'}
            {closed ? ' · Đã đóng' : ''}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {aiAvailable && !closed && (
            <button
              onClick={() => void onUpdate({ ai_enabled: !conversation.ai_enabled })}
              aria-pressed={conversation.ai_enabled}
              className={`rounded-full border px-3 py-1 ${conversation.ai_enabled ? 'border-purple-300 bg-purple-50 text-purple-700' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              {conversation.ai_enabled ? 'AI đang tự trả lời · Tắt' : 'Bật AI tự trả lời'}
            </button>
          )}
          {!closed && !mine && (
            <button onClick={() => void onUpdate({ assign_to_me: true })} className="rounded-full border px-3 py-1 text-gray-600 hover:bg-gray-50">
              Nhận hội thoại
            </button>
          )}
          <button
            onClick={() => void onUpdate({ status: closed ? 'open' : 'closed' })}
            className={`rounded-full border px-3 py-1 ${closed ? 'border-green-300 text-green-700 hover:bg-green-50' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            {closed ? 'Mở lại' : 'Kết thúc'}
          </button>
        </div>
      </div>

      {conversation.needs_human && !closed && (
        <div role="status" className="border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          Khách đang chờ nhân viên trả lời. AI đã dừng tự trả lời cho hội thoại này.
        </div>
      )}

      <div ref={listRef} onScroll={onScroll} className="flex flex-1 flex-col gap-2 overflow-y-auto p-4" data-testid="message-list">
        {error && (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}{' '}
            <button onClick={onRetry} className="underline">
              Thử lại
            </button>
          </div>
        )}
        {loading && messages.length === 0 && <p className="text-center text-sm text-gray-500">Đang tải tin nhắn…</p>}
        {hasOlder && (
          <button onClick={() => void loadOlder()} disabled={loadingOlder} className="self-center rounded-full border bg-white px-3 py-1 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-50">
            {loadingOlder ? 'Đang tải…' : 'Tải tin cũ hơn'}
          </button>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`flex max-w-[80%] flex-col ${m.sender_type === 'customer' ? 'self-start' : m.sender_type === 'system' ? 'self-center' : 'self-end'}`} data-testid={`msg-${m.id}`} data-sender={m.sender_type}>
            {m.sender_type !== 'system' && <span className={`mb-0.5 text-[11px] text-gray-400 ${m.sender_type === 'customer' ? '' : 'text-right'}`}>{LABEL[m.sender_type](m, customer)}</span>}
            <div className={`whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-sm shadow-sm ${STYLE[m.sender_type]}`}>{m.content}</div>
            {m.sender_type !== 'system' && <span className={`mt-0.5 text-[10px] text-gray-400 ${m.sender_type === 'customer' ? '' : 'text-right'}`}>{formatDateTime(m.created_at)}</span>}
          </div>
        ))}
        {customerTyping && (
          <div data-testid="customer-typing" className="self-start rounded-2xl border bg-white px-3 py-2 text-xs text-gray-500 shadow-sm">
            {customer} đang nhập…
          </div>
        )}
      </div>

      <div className="border-t bg-white p-3">
        {suggestionNote && <p className="mb-2 text-xs text-purple-700">✨ Gợi ý từ AI — hãy kiểm tra và chỉnh sửa trước khi gửi.</p>}
        {suggestError && (
          <p role="alert" className="mb-2 text-xs text-red-600">
            {suggestError}
          </p>
        )}
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <select
            aria-label="Trả lời nhanh"
            value=""
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
              const picked = QUICK_REPLIES.find((q) => q.label === e.target.value);
              if (picked) setText((t) => (t.trim() ? `${t.trim()}\n${picked.text}` : picked.text));
            }}
            className="rounded-lg border border-gray-300 px-2 py-1 text-xs text-gray-600"
          >
            <option value="">Trả lời nhanh…</option>
            {QUICK_REPLIES.map((q) => (
              <option key={q.label} value={q.label}>
                {q.label}
              </option>
            ))}
          </select>
          {aiAvailable && (
            <button onClick={() => void suggest()} disabled={suggesting} className="flex items-center gap-1 rounded-lg border border-purple-300 px-2 py-1 text-xs text-purple-700 hover:bg-purple-50 disabled:opacity-50">
              <SparklesIcon className="h-4 w-4" />
              {suggesting ? 'AI đang soạn…' : 'Gợi ý trả lời bằng AI'}
            </button>
          )}
        </div>
        <div className="flex items-end gap-2">
          <textarea
            value={text}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
              setText(e.target.value);
              notifyTyping(e.target.value);
            }}
            onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                void send();
              }
            }}
            rows={2}
            maxLength={2000}
            placeholder={closed ? 'Hội thoại đã đóng — gửi tin sẽ không mở lại, hãy bấm "Mở lại"' : 'Nhập tin nhắn… (Enter để gửi, Shift+Enter xuống dòng)'}
            aria-label="Soạn tin nhắn"
            className="max-h-32 min-h-[2.75rem] flex-1 resize-none rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button onClick={() => void send()} disabled={sending || !text.trim()} aria-label="Gửi" className="rounded-xl bg-blue-600 p-3 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40">
            <PaperAirplaneIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
