import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AdminHeader from './AdminHeader';
import AdminSidebar from './AdminSidebar';
import AdminFooter from './AdminFooter';
import ChatWidget from '../Chatbot/ChatWidget';
import { useAuth } from '../../contexts/AuthContext';
import useNotifications from '../../hooks/useNotifications';
import useSupportUnread from '../../hooks/useSupportUnread';
import useDebouncedCallback from '../../hooks/useDebouncedCallback';
import RealtimeNotifier from './RealtimeNotifier';

const isDesktop = () => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches;

const AdminLayout: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false); // màn hình lớn: thu gọn sidebar
  const [mobileOpen, setMobileOpen] = useState(false); // điện thoại: ngăn kéo menu
  // Tăng mỗi khi chatbot thay đổi dữ liệu -> trang đang mở được dựng lại và tải dữ liệu mới
  const [dataVersion, setDataVersion] = useState(0);
  const { pendingOrders, lowStock, paymentClaims, refresh } = useNotifications(dataVersion);
  const unreadChats = useSupportUnread();
  const refreshSoon = useDebouncedCallback(() => void refresh(), 800); // gộp nhiều sự kiện dồn dập thành 1 lần tải

  // Chuyển trang thì đóng ngăn kéo; nhấn Esc cũng đóng
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileOpen) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileOpen]);

  const handleMenuClick = () => (isDesktop() ? setCollapsed((c) => !c) : setMobileOpen((o) => !o));

  return (
    <div className="min-h-screen bg-app">
      <AdminSidebar collapsed={collapsed} mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} unreadChats={unreadChats} />
      <RealtimeNotifier onStatsDirty={refreshSoon} />

      {mobileOpen && (
        <div
          data-testid="drawer-overlay"
          className="fixed inset-0 bg-black bg-opacity-40 z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div className={`min-h-screen flex flex-col transition-all duration-300 ${collapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        <AdminHeader onMenuClick={handleMenuClick} pendingOrders={pendingOrders} lowStock={lowStock} unreadChats={unreadChats} paymentClaims={paymentClaims} />

        <main className="flex-1 p-4 sm:p-6 min-w-0">
          <Outlet key={dataVersion} />
        </main>

        <AdminFooter />
      </div>

      {user && <ChatWidget onDataChanged={() => setDataVersion((v) => v + 1)} />}
    </div>
  );
};

export default AdminLayout;
