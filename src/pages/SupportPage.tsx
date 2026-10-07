import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { SupportConversation, SupportMessage } from '../types';
import { supportService } from '../services/supportService';
import { aiService } from '../services/aiService';
import { ConversationList, SupportTab } from '../components/Support/ConversationList';
import { ThreadView } from '../components/Support/ThreadView';
import { useRealtime } from '../contexts/RealtimeContext';
import { useAuth } from '../contexts/AuthContext';
import useAiStatus from '../hooks/useAiStatus';
import useDebounce from '../hooks/useDebounce';
import useDebouncedCallback from '../hooks/useDebouncedCallback';
import usePageTitle from '../hooks/usePageTitle';

const PAGE_SIZE = 20;
const THREAD_PAGE = 100;

const matchesTab = (c: SupportConversation, tab: SupportTab): boolean => {
  if (tab === 'closed') return c.status === 'closed';
  if (c.status !== 'open') return false;
  if (tab === 'unread') return c.unread_staff > 0;
  if (tab === 'needs_human') return c.needs_human;
  return true;
};

/** Chưa đọc lên trước, rồi mới nhất trước — cùng thứ tự với backend. */
const compare = (a: SupportConversation, b: SupportConversation) =>
  Number(b.unread_staff > 0) - Number(a.unread_staff > 0) ||
  String(b.last_message_at || b.created_at).localeCompare(String(a.last_message_at || a.created_at)) ||
  b.id - a.id;

const SupportPage: React.FC = () => {
  usePageTitle('Hỗ trợ khách hàng');
  const { user } = useAuth();
  const aiEnabled = useAiStatus();
  const [params, setParams] = useSearchParams();
  const selectedId = Number(params.get('c')) || null;
  const selectedRef = useRef<number | null>(selectedId);
  selectedRef.current = selectedId;

  const [tab, setTab] = useState<SupportTab>('all');
  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput.trim(), 350);
  const tabRef = useRef(tab);
  tabRef.current = tab;

  const [list, setList] = useState<SupportConversation[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState('');

  const [conversation, setConversation] = useState<SupportConversation | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [threadError, setThreadError] = useState('');
  const [hasOlder, setHasOlder] = useState(false);
  const [customerTyping, setCustomerTyping] = useState(false);
  const messagesRef = useRef<SupportMessage[]>([]);
  messagesRef.current = messages;
  const typingTimer = useRef<number | undefined>(undefined);
  const listTicket = useRef(0);
  const threadTicket = useRef(0);

  // ───────── Danh sách ─────────
  const loadList = useCallback(
    async (pageNumber: number, append: boolean) => {
      const ticket = ++listTicket.current;
      setListLoading(true);
      try {
        const t = tabRef.current;
        const result = await supportService.list({
          status: t === 'closed' ? 'closed' : 'open',
          needs_human: t === 'needs_human',
          search,
          page: pageNumber,
          limit: PAGE_SIZE,
        });
        if (ticket !== listTicket.current) return;
        setListError('');
        setPage(result.meta.page);
        setPages(result.meta.pages);
        setList((prev) => {
          const merged = append ? [...prev, ...result.conversations.filter((c) => !prev.some((p) => p.id === c.id))] : result.conversations;
          return merged.filter((c) => matchesTab(c, t)).sort(compare);
        });
      } catch (err: any) {
        if (ticket === listTicket.current) setListError(err.message);
      } finally {
        if (ticket === listTicket.current) setListLoading(false);
      }
    },
    [search]
  );

  useEffect(() => {
    void loadList(1, false);
  }, [loadList, tab]);

  /** Cập nhật/chèn một hội thoại vào danh sách (từ sự kiện realtime); loại bỏ nếu không còn khớp tab hiện tại. */
  const upsert = useCallback((c: SupportConversation) => {
    setList((prev) => {
      const t = tabRef.current;
      const exists = prev.some((x) => x.id === c.id);
      if (!matchesTab(c, t)) return exists ? prev.filter((x) => x.id !== c.id) : prev;
      return (exists ? prev.map((x) => (x.id === c.id ? { ...x, ...c } : x)) : [c, ...prev]).sort(compare);
    });
    setConversation((cur) => (cur && cur.id === c.id ? { ...cur, ...c } : cur));
  }, []);

  // ───────── Hội thoại đang mở ─────────
  const markRead = useCallback(async (id: number) => {
    try {
      upsert(await supportService.markRead(id));
    } catch {
      /* lần sau sẽ thử lại */
    }
  }, [upsert]);
  const markReadSoon = useDebouncedCallback(() => {
    if (selectedRef.current && document.visibilityState === 'visible') void markRead(selectedRef.current);
  }, 400);

  const loadThread = useCallback(async (id: number) => {
    const ticket = ++threadTicket.current;
    setThreadLoading(true);
    setThreadError('');
    try {
      const data = await supportService.get(id);
      if (ticket !== threadTicket.current) return;
      setConversation(data.conversation);
      setMessages(data.messages);
      setHasOlder(data.messages.length >= THREAD_PAGE);
      setCustomerTyping(false);
      if (data.conversation.unread_staff > 0) void markRead(id);
    } catch (err: any) {
      if (ticket === threadTicket.current) {
        setThreadError(err.message);
        setConversation(null);
        setMessages([]);
      }
    } finally {
      if (ticket === threadTicket.current) setThreadLoading(false);
    }
  }, [markRead]);

  useEffect(() => {
    if (selectedId) void loadThread(selectedId);
    else {
      threadTicket.current += 1;
      setConversation(null);
      setMessages([]);
    }
  }, [selectedId, loadThread]);

  const select = (id: number | null) => {
    const next = new URLSearchParams(params);
    if (id) next.set('c', String(id));
    else next.delete('c');
    setParams(next, { replace: true });
  };

  const appendMessage = (m: SupportMessage) =>
    setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m].sort((a, b) => a.id - b.id)));

  // ───────── Realtime ─────────
  useRealtime('chat:message', ({ conversation: c, message }: { conversation: SupportConversation; message: SupportMessage }) => {
    upsert(c);
    if (selectedRef.current === c.id) {
      appendMessage(message);
      if (message.sender_type === 'customer') {
        setCustomerTyping(false);
        markReadSoon();
      }
    }
  });
  useRealtime('chat:read', ({ conversation: c }: { conversation: SupportConversation }) => c && upsert(c));
  useRealtime('chat:conversation', ({ conversation: c }: { conversation: SupportConversation }) => c && upsert(c));
  useRealtime('chat:handoff', ({ conversation: c }: { conversation: SupportConversation }) => c && upsert(c));
  useRealtime('chat:typing', (d: { conversation_id: number; sender: string; typing: boolean }) => {
    if (d.sender !== 'customer' || d.conversation_id !== selectedRef.current) return;
    window.clearTimeout(typingTimer.current);
    setCustomerTyping(!!d.typing);
    if (d.typing) typingTimer.current = window.setTimeout(() => setCustomerTyping(false), 5000);
  });
  // Vừa kết nối lại sau khi mất kết nối: lấy lại những gì đã lỡ
  useRealtime('resync', () => {
    void loadList(1, false);
    const id = selectedRef.current;
    if (!id) return;
    const lastId = messagesRef.current.length ? messagesRef.current[messagesRef.current.length - 1].id : 0;
    supportService.messagesAfter(id, lastId).then((fresh) => fresh.forEach(appendMessage)).catch(() => undefined);
    markReadSoon();
  });
  useEffect(() => () => window.clearTimeout(typingTimer.current), []);

  // ───────── Hành động ─────────
  const send = async (text: string) => {
    if (!selectedId) return;
    try {
      const res = await supportService.reply(selectedId, text);
      appendMessage(res.message);
      upsert(res.conversation);
    } catch (err: any) {
      toast.error(err.message);
      throw err;
    }
  };

  const update = async (patch: { status?: 'open' | 'closed'; assign_to_me?: boolean; ai_enabled?: boolean }) => {
    if (!selectedId) return;
    try {
      upsert(await supportService.update(selectedId, patch));
      if (patch.status) toast.success(patch.status === 'closed' ? 'Đã kết thúc hội thoại' : 'Đã mở lại hội thoại');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const loadOlder = async () => {
    if (!selectedId || !messages.length) return;
    try {
      const older = await supportService.messagesBefore(selectedId, messages[0].id);
      setHasOlder(older.length >= THREAD_PAGE);
      setMessages((prev) => [...older.filter((o) => !prev.some((p) => p.id === o.id)), ...prev]);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const visibleList = tab === 'unread' ? list.filter((c) => c.unread_staff > 0) : list;

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Hỗ trợ khách hàng</h1>
        <p className="text-sm text-gray-500">Trò chuyện trực tiếp với khách đang xem cửa hàng. Tin nhắn mới hiện ngay, không cần tải lại trang.</p>
      </div>

      <div className="grid h-[calc(100vh-11rem)] min-h-[30rem] grid-cols-1 overflow-hidden rounded-lg border bg-white shadow lg:grid-cols-[22rem_1fr]">
        <div className={`${selectedId ? 'hidden lg:block' : 'block'} min-h-0 border-r`}>
          <ConversationList
            conversations={visibleList}
            selectedId={selectedId}
            tab={tab}
            onTab={setTab}
            search={searchInput}
            onSearch={setSearchInput}
            onSelect={select}
            loading={listLoading}
            error={listError}
            onRetry={() => void loadList(1, false)}
            hasMore={page < pages}
            onLoadMore={() => void loadList(page + 1, true)}
          />
        </div>

        <div className={`${selectedId ? 'block' : 'hidden lg:block'} min-h-0`}>
          {conversation ? (
            <ThreadView
              conversation={conversation}
              messages={messages}
              customerTyping={customerTyping}
              loading={threadLoading}
              error={threadError}
              onRetry={() => selectedId && void loadThread(selectedId)}
              onSend={send}
              onTypingChange={(t) => selectedId && void supportService.typing(selectedId, t)}
              onUpdate={update}
              aiAvailable={!!aiEnabled}
              onSuggest={() => aiService.suggestReply(conversation.id)}
              hasOlder={hasOlder}
              onLoadOlder={loadOlder}
              onBack={() => select(null)}
              myId={user?.id}
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gray-50 p-8 text-center text-sm text-gray-500">
              {threadLoading ? 'Đang tải hội thoại…' : threadError ? (
                <div role="alert" className="text-red-600">
                  {threadError}{' '}
                  <button className="underline" onClick={() => selectedId && void loadThread(selectedId)}>
                    Thử lại
                  </button>
                </div>
              ) : (
                'Chọn một hội thoại ở bên trái để bắt đầu trả lời khách.'
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupportPage;
