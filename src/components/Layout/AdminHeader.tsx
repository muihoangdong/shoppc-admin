import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowTopRightOnSquareIcon,
  Bars3Icon,
  BellIcon,
  MagnifyingGlassIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { roleLabel } from '../../utils/roles';
import { useRealtimeStatus } from '../../contexts/RealtimeContext';
import { isSoundEnabled, playBeep, setSoundEnabled } from '../../utils/sound';
import ThemeToggle from '../Common/ThemeToggle';
import { STOREFRONT_URL } from '../../utils/storefront';

interface AdminHeaderProps {
  onMenuClick: () => void;
  pendingOrders: number;
  lowStock: number;
  unreadChats?: number;
  paymentClaims?: number;
}

type MenuName = 'bell' | 'user' | null;


const SEARCH_TARGETS = [
  { value: 'orders', label: 'Đơn hàng', path: '/admin/orders' },
  { value: 'products', label: 'Sản phẩm', path: '/admin/products' },
] as const;

const AdminHeader: React.FC<AdminHeaderProps> = ({ onMenuClick, pendingOrders, lowStock, unreadChats = 0, paymentClaims = 0 }) => {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState<MenuName>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const total = pendingOrders + lowStock + unreadChats + paymentClaims;
  const status = useRealtimeStatus();
  const [sound, setSound] = useState(isSoundEnabled());
  const navigate = useNavigate();
  const searchRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [target, setTarget] = useState<(typeof SEARCH_TARGETS)[number]['value']>('orders');

  // Ctrl/⌘ + K: tìm nhanh từ mọi trang
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    const path = SEARCH_TARGETS.find((t) => t.value === target)!.path;
    navigate(`${path}?q=${encodeURIComponent(q)}`);
    searchRef.current?.blur();
  };

  // Bấm ra ngoài hoặc nhấn Esc thì đóng menu
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const toggle = (name: Exclude<MenuName, null>) => setOpen((current) => (current === name ? null : name));
  const itemClass = 'flex items-center justify-between px-4 py-3 text-sm text-slate-700 hover:bg-slate-50';
  const iconBtn = 'relative rounded-xl border border-slate-200 bg-white p-2 text-slate-600 transition hover:border-blue-300 hover:text-blue-600';

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-app/90 backdrop-blur">
      <div className="flex items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <button onClick={onMenuClick} aria-label="Mở/đóng menu" className="rounded-xl p-2 text-slate-600 transition hover:bg-slate-200/60">
          <Bars3Icon className="h-6 w-6" />
        </button>

        {/* Tìm kiếm chung */}
        <form onSubmit={submitSearch} role="search" className="hidden min-w-0 max-w-xl flex-1 md:flex">
          <div className="flex w-full items-center rounded-xl border border-slate-200 bg-white pl-3 transition focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-500/10">
            <MagnifyingGlassIcon className="h-4 w-4 shrink-0 text-slate-400" />
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm mã đơn hàng, tên khách, sản phẩm…"
              aria-label="Tìm kiếm"
              className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400"
            />
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value as typeof target)}
              aria-label="Tìm trong"
              className="border-l border-slate-200 bg-transparent px-2 py-2 text-[11px] text-slate-600 outline-none"
            >
              {SEARCH_TARGETS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <kbd className="mr-2 hidden rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-500 lg:block">Ctrl K</kbd>
          </div>
        </form>

        <div ref={wrapRef} className="ml-auto flex items-center gap-2">
          {/* Trạng thái kết nối realtime */}
          <span
            data-testid="realtime-status"
            data-status={status}
            title={status === 'live' ? 'Đang nhận dữ liệu trực tiếp' : status === 'offline' ? 'Mất kết nối, đang thử lại…' : 'Đang kết nối…'}
            className="hidden items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] text-slate-600 xl:flex"
          >
            <span className={`h-2 w-2 rounded-full ${status === 'live' ? 'bg-green-500' : status === 'offline' ? 'bg-amber-500' : 'bg-slate-300'}`} />
            Hệ thống: {status === 'live' ? 'Trực tuyến' : status === 'offline' ? 'Đang kết nối lại…' : 'Đang kết nối…'}
          </span>

          <a
            href={STOREFRONT_URL}
            target="_blank"
            rel="noreferrer"
            className="hidden items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-600 lg:flex"
          >
            Xem Storefront <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
          </a>

          {/* Giao diện sáng/tối */}
          <ThemeToggle className={iconBtn} />

          {/* Bật/tắt âm báo */}
          <button
            onClick={() => {
              const next = !sound;
              setSound(next);
              setSoundEnabled(next);
              if (next) playBeep();
            }}
            aria-label={sound ? 'Tắt âm báo' : 'Bật âm báo'}
            aria-pressed={sound}
            title={sound ? 'Âm báo đơn/tin nhắn mới: đang bật' : 'Âm báo đơn/tin nhắn mới: đang tắt'}
            className={iconBtn}
          >
            {sound ? <SpeakerWaveIcon className="h-5 w-5" /> : <SpeakerXMarkIcon className="h-5 w-5 text-slate-400" />}
          </button>

          {/* Chuông thông báo */}
          <div className="relative">
            <button
              onClick={() => toggle('bell')}
              aria-label={total ? `Có ${total} việc cần chú ý` : 'Thông báo'}
              aria-expanded={open === 'bell'}
              className={iconBtn}
            >
              <BellIcon className="h-5 w-5" />
              {total > 0 && (
                <span
                  data-testid="bell-badge"
                  className="absolute -top-0.5 -right-0.5 min-w-[1.1rem] h-[1.1rem] px-1 flex items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold text-white"
                >
                  {total > 99 ? '99+' : total}
                </span>
              )}
            </button>
            {open === 'bell' && (
              <div className="absolute right-0 mt-2 w-72 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                <p className="frost-label bg-slate-50 px-4 py-2">Cần chú ý</p>
                {total === 0 && <p className="px-4 py-6 text-center text-sm text-gray-500">Không có việc nào cần xử lý 🎉</p>}
                {paymentClaims > 0 && (
                  <Link to="/admin/orders?claimed=1" onClick={() => setOpen(null)} className={itemClass}>
                    <span>Khách báo đã chuyển khoản</span>
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800">{paymentClaims}</span>
                  </Link>
                )}
                {unreadChats > 0 && (
                  <Link to="/admin/support" onClick={() => setOpen(null)} className={itemClass}>
                    <span>Tin nhắn khách chưa đọc</span>
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800">{unreadChats}</span>
                  </Link>
                )}
                {pendingOrders > 0 && (
                  <Link to="/admin/orders?status=pending" onClick={() => setOpen(null)} className={itemClass}>
                    <span>Đơn hàng chờ xử lý</span>
                    <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-semibold text-yellow-800">{pendingOrders}</span>
                  </Link>
                )}
                {lowStock > 0 && (
                  <Link to="/admin/products?stock=low" onClick={() => setOpen(null)} className={itemClass}>
                    <span>Sản phẩm sắp hết hàng</span>
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800">{lowStock}</span>
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Menu người dùng */}
          <div className="relative">
            <button
              onClick={() => toggle('user')}
              aria-expanded={open === 'user'}
              aria-label="Menu tài khoản"
              title={`${user?.full_name || ''} · ${roleLabel(user?.role)}`}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm transition hover:bg-blue-700"
            >
              <UserIcon className="h-5 w-5" />
            </button>
            {open === 'user' && (
              <div className="absolute right-0 mt-2 w-60 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                <div className="border-b border-slate-200 px-4 py-3">
                  <p className="text-sm font-medium text-gray-800 truncate">{user?.full_name}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                </div>
                <Link to="/admin/settings" onClick={() => setOpen(null)} className={itemClass}>
                  Cài đặt tài khoản
                </Link>
                <button onClick={logout} className={`${itemClass} w-full text-red-600`}>
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
