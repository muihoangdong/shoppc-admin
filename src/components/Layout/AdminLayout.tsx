import { useRealtimeRefresh } from '../../contexts/RealtimeContext';
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
import PageTransition from '../Common/PageTransition';

const isDesktop = () => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches;

const AdminLayout: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false); // màn hình lớn: thu gọn sidebar
  const [mobileOpen, setMobileOpen] = useState(false); // điện thoại: ngăn kéo menu
  const refreshData = useRealtimeRefresh();
  const keepMounted = [
    '/admin',
    '/admin/products',
    '/admin/categories',
    '/admin/orders',
    '/admin/reviews',
    '/admin/support',
  ].includes(location.pathname);
  // Cập nhật thông báo; các trang có realtime tải ngầm, trang còn lại giữ cách nạp dữ liệu cũ.
  const [dataVersion, setDataVersion] = useState(0);
  const { pendingOrders, lowStock, paymentClaims, refresh } = useNotifications(dataVersion);
  const unreadChats = useSupportUnread();
  const refreshSoon = useDebouncedCallback(() => void refresh(), 800); // gộp nhiều sự kiện dồn dập thành 1 lần tải

  // Chuyển trang thì đóng ngăn kéo; nhấn Esc cũng đóng
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleMenuClick = () => (isDesktop() ? setCollapsed((c) => !c) : setMobileOpen((o) => !o));

  return (
    <div className="min-h-screen bg-app">
      <AdminSidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        unreadChats={unreadChats}
        pendingOrders={pendingOrders}
      />
      <RealtimeNotifier onStatsDirty={refreshSoon} />

      {mobileOpen && (
        <div
          data-testid="drawer-overlay"
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div className={`min-h-screen flex flex-col transition-all duration-200 ${collapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        <AdminHeader
          onMenuClick={handleMenuClick}
          pendingOrders={pendingOrders}
          lowStock={lowStock}
          unreadChats={unreadChats}
          paymentClaims={paymentClaims}
        />

        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          <PageTransition>
            <Outlet key={keepMounted ? location.pathname : dataVersion} />
          </PageTransition>
        </main>

        <AdminFooter />
      </div>

      {user && (
        <ChatWidget
          onDataChanged={() => {
            setDataVersion((v) => v + 1);
            refreshData();
          }}
        />
      )}
    </div>
  );
};

export default AdminLayout;
