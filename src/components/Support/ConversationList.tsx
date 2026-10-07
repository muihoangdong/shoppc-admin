import React from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { SupportConversation } from '../../types';
import { formatRelativeTime } from '../../utils/formatters';

export type SupportTab = 'all' | 'unread' | 'needs_human' | 'closed';

const TABS: { value: SupportTab; label: string }[] = [
  { value: 'all', label: 'Đang mở' },
  { value: 'unread', label: 'Chưa đọc' },
  { value: 'needs_human', label: 'Cần nhân viên' },
  { value: 'closed', label: 'Đã đóng' },
];

interface Props {
  conversations: SupportConversation[];
  selectedId: number | null;
  tab: SupportTab;
  onTab: (t: SupportTab) => void;
  search: string;
  onSearch: (s: string) => void;
  onSelect: (id: number) => void;
  loading: boolean;
  error: string;
  onRetry: () => void;
  hasMore: boolean;
  onLoadMore: () => void;
}

export const ConversationList: React.FC<Props> = ({ conversations, selectedId, tab, onTab, search, onSearch, onSelect, loading, error, onRetry, hasMore, onLoadMore }) => (
  <div className="flex h-full flex-col bg-white">
    <div className="space-y-3 border-b p-3">
      <div className="relative">
        <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        <input
          value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSearch(e.target.value)}
          placeholder="Tìm tên, SĐT, nội dung…"
          aria-label="Tìm hội thoại"
          className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
      <div className="flex gap-1 overflow-x-auto" role="tablist" aria-label="Lọc hội thoại">
        {TABS.map((t) => (
          <button
            key={t.value}
            role="tab"
            aria-selected={tab === t.value}
            onClick={() => onTab(t.value)}
            className={`whitespace-nowrap rounded-full px-3 py-1 text-xs transition ${tab === t.value ? 'bg-blue-600 text-white' : 'border bg-white text-gray-600 hover:bg-gray-50'}`}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>

    <div className="flex-1 overflow-y-auto" data-testid="conversation-list">
      {error && (
        <div role="alert" className="m-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}{' '}
          <button onClick={onRetry} className="underline">
            Thử lại
          </button>
        </div>
      )}
      {!error && loading && conversations.length === 0 && <p className="p-6 text-center text-sm text-gray-500">Đang tải…</p>}
      {!error && !loading && conversations.length === 0 && (
        <p className="p-6 text-center text-sm text-gray-500">{search ? 'Không có hội thoại phù hợp.' : 'Chưa có hội thoại nào.'}</p>
      )}
      <ul className="divide-y">
        {conversations.map((c) => {
          const active = c.id === selectedId;
          return (
            <li key={c.id}>
              <button
                onClick={() => onSelect(c.id)}
                aria-current={active ? 'true' : undefined}
                data-testid={`conv-${c.id}`}
                className={`flex w-full gap-3 px-4 py-3 text-left transition hover:bg-gray-50 ${active ? 'bg-blue-50' : ''}`}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold text-gray-600">
                  {(c.customer_name || 'K').trim().charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`truncate text-sm ${c.unread_staff > 0 ? 'font-bold text-gray-900' : 'font-medium text-gray-800'}`}>{c.customer_name || 'Khách ẩn danh'}</p>
                    <span className="shrink-0 text-xs text-gray-400">{c.last_message_at ? formatRelativeTime(c.last_message_at) : ''}</span>
                  </div>
                  <p className={`truncate text-xs ${c.unread_staff > 0 ? 'font-medium text-gray-800' : 'text-gray-500'}`}>{c.last_message_preview || '—'}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-1">
                    {c.needs_human && <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-700">Cần nhân viên</span>}
                    {c.ai_enabled && c.status === 'open' && <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-medium text-purple-700">AI đang trả lời</span>}
                    {c.status === 'closed' && <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600">Đã đóng</span>}
                  </div>
                </div>
                {c.unread_staff > 0 && (
                  <span data-testid={`unread-${c.id}`} className="mt-1 flex h-5 min-w-[1.25rem] shrink-0 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-semibold text-white">
                    {c.unread_staff > 99 ? '99+' : c.unread_staff}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
      {hasMore && (
        <div className="p-3 text-center">
          <button onClick={onLoadMore} disabled={loading} className="rounded-lg border px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50">
            {loading ? 'Đang tải…' : 'Tải thêm'}
          </button>
        </div>
      )}
    </div>
  </div>
);
