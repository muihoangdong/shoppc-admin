import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  HomeIcon,
  CubeIcon,
  TagIcon,
  ShoppingBagIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  ArrowLeftOnRectangleIcon,
  XMarkIcon,
  TicketIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { canManageUsers } from '../../utils/roles';
import Logo from '../Common/Logo';

interface AdminSidebarProps {
  /** Thu gọn (chỉ hiện icon) — chỉ áp dụng trên màn hình lớn. */
  collapsed: boolean;
  /** Ngăn kéo đang mở — chỉ áp dụng trên điện thoại/máy tính bảng. */
  mobileOpen: boolean;
  onCloseMobile: () => void;
  /** Số tin khách chưa đọc (huy hiệu ở mục Hỗ trợ). */
  unreadChats?: number;
}

const menuItems: { path: string; icon: React.ElementType; label: string; adminOnly?: boolean; end?: boolean }[] = [
  { path: '/admin', icon: HomeIcon, label: 'Tổng quan', end: true },
  { path: '/admin/products', icon: CubeIcon, label: 'Sản phẩm' },
  { path: '/admin/categories', icon: TagIcon, label: 'Danh mục' },
  { path: '/admin/orders', icon: ShoppingBagIcon, label: 'Đơn hàng' },
  { path: '/admin/coupons', icon: TicketIcon, label: 'Mã giảm giá' },
  { path: '/admin/reviews', icon: StarIcon, label: 'Đánh giá' },
  { path: '/admin/analytics', icon: ChartBarIcon, label: 'Thống kê' },
  { path: '/admin/support', icon: ChatBubbleLeftRightIcon, label: 'Hỗ trợ' },
  { path: '/admin/users', icon: UserGroupIcon, label: 'Tài khoản', adminOnly: true },
  { path: '/admin/settings', icon: Cog6ToothIcon, label: 'Cài đặt' },
];

const AdminSidebar: React.FC<AdminSidebarProps> = ({ collapsed, mobileOpen, onCloseMobile, unreadChats = 0 }) => {
  const { logout, user } = useAuth();
  const visibleItems = menuItems.filter((item) => !item.adminOnly || canManageUsers(user?.role));

  // Điện thoại: luôn rộng 64 và trượt vào/ra. Màn hình lớn (lg): luôn hiện, rộng 64 hoặc 20 (thu gọn).
  const labelClass = collapsed ? 'ml-3 lg:hidden' : 'ml-3';
  const itemAlign = collapsed ? 'lg:justify-center' : '';

  return (
    <aside
      aria-label="Menu chính"
      className={`fixed left-0 top-0 h-full bg-sidebar text-white transition-all duration-300 z-40 w-64 ${
        collapsed ? 'lg:w-20' : 'lg:w-64'
      } ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
    >
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className={collapsed ? 'lg:flex lg:w-full lg:justify-center' : ''} aria-label="Shoppc Admin">
          <Logo variant="light" className={collapsed ? 'lg:hidden' : ''} />
          {collapsed && <Logo variant="light" markOnly className="hidden lg:inline-flex" />}
        </div>
        <button
          onClick={onCloseMobile}
          aria-label="Đóng menu"
          className="p-1 rounded hover:bg-white/10 lg:hidden"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>

      <nav className="mt-6">
        {visibleItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            onClick={onCloseMobile}
            title={item.label}
            className={({ isActive }: { isActive: boolean }) =>
              `flex items-center px-4 py-3 transition-colors ${
                isActive ? 'bg-blue-600 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
              } ${itemAlign}`
            }
          >
            <span className="relative">
              <item.icon className="h-5 w-5 shrink-0" />
              {item.path === '/admin/support' && unreadChats > 0 && (
                <span data-testid="support-badge" className="absolute -right-2 -top-2 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                  {unreadChats > 99 ? '99+' : unreadChats}
                </span>
              )}
            </span>
            <span className={labelClass}>{item.label}</span>
          </NavLink>
        ))}

        <button
          onClick={logout}
          title="Đăng xuất"
          className={`w-full flex items-center px-4 py-3 text-white/70 hover:bg-white/10 hover:text-white transition-colors mt-4 border-t border-white/10 ${itemAlign}`}
        >
          <ArrowLeftOnRectangleIcon className="h-5 w-5 shrink-0" />
          <span className={labelClass}>Đăng xuất</span>
        </button>
      </nav>
    </aside>
  );
};

export default AdminSidebar;
