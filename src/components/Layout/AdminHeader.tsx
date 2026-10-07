import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bars3Icon, BellIcon, SpeakerWaveIcon, SpeakerXMarkIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { roleLabel } from '../../utils/roles';
import { useRealtimeStatus } from '../../contexts/RealtimeContext';
import { isSoundEnabled, playBeep, setSoundEnabled } from '../../utils/sound';
import ThemeToggle from '../Common/ThemeToggle';

interface AdminHeaderProps {
  onMenuClick: () => void;
  pendingOrders: number;
  lowStock: number;
  unreadChats?: number;
  paymentClaims?: number;
}

type MenuName = 'bell' | 'user' | null;

const AdminHeader: React.FC<AdminHeaderProps> = ({ onMenuClick, pendingOrders, lowStock, unreadChats = 0, paymentClaims = 0 }) => {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState<MenuName>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const total = pendingOrders + lowStock + unreadChats + paymentClaims;
  const status = useRealtimeStatus();
  const [sound, setSound] = useState(isSoundEnabled());

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
  const itemClass = 'flex items-center justify-between px-4 py-3 text-sm text-gray-700 hover:bg-gray-50';

  return (
    <header className="bg-white shadow-sm sticky top-0 z-30">
      <div className="flex items-center justify-between px-4 sm:px-6 py-3">
        <button onClick={onMenuClick} aria-label="Mở/đóng menu" className="p-2 rounded-lg hover:bg-gray-100 transition">
          <Bars3Icon className="h-6 w-6 text-gray-600" />
        </button>

        <div ref={wrapRef} className="flex items-center space-x-2 sm:space-x-4">
          {/* Trạng thái kết nối realtime */}
          <span
            data-testid="realtime-status"
            data-status={status}
            title={status === 'live' ? 'Đang nhận dữ liệu trực tiếp' : status === 'offline' ? 'Mất kết nối, đang thử lại…' : 'Đang kết nối…'}
            className="hidden items-center gap-1.5 text-xs text-gray-500 sm:flex"
          >
            <span className={`h-2 w-2 rounded-full ${status === 'live' ? 'bg-green-500' : status === 'offline' ? 'bg-amber-500' : 'bg-gray-300'}`} />
            {status === 'live' ? 'Trực tiếp' : status === 'offline' ? 'Đang kết nối lại…' : status === 'connecting' ? 'Đang kết nối…' : ''}
          </span>

          {/* Giao diện sáng/tối */}
          <ThemeToggle />

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
            className="p-2 rounded-lg hover:bg-gray-100 transition"
          >
            {sound ? <SpeakerWaveIcon className="h-5 w-5 text-gray-600" /> : <SpeakerXMarkIcon className="h-5 w-5 text-gray-400" />}
          </button>

          {/* Chuông thông báo */}
          <div className="relative">
            <button
              onClick={() => toggle('bell')}
              aria-label={total ? `Có ${total} việc cần chú ý` : 'Thông báo'}
              aria-expanded={open === 'bell'}
              className="p-2 rounded-lg hover:bg-gray-100 transition relative"
            >
              <BellIcon className="h-6 w-6 text-gray-600" />
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
              <div className="absolute right-0 mt-2 w-72 rounded-lg border bg-white shadow-lg overflow-hidden">
                <p className="px-4 py-2 text-xs font-semibold uppercase text-gray-500 bg-gray-50">Cần chú ý</p>
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
              className="flex items-center space-x-3 rounded-lg p-1 hover:bg-gray-100 transition"
            >
              <UserCircleIcon className="h-8 w-8 text-gray-600" />
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-700">{user?.full_name}</p>
                <p className="text-xs text-gray-500">{roleLabel(user?.role)}</p>
              </div>
            </button>
            {open === 'user' && (
              <div className="absolute right-0 mt-2 w-56 rounded-lg border bg-white shadow-lg overflow-hidden">
                <div className="px-4 py-3 border-b">
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
