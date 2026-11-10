import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Squares2X2Icon,
  CubeIcon,
  CpuChipIcon,
  ShoppingBagIcon,
  ChartBarIcon,
  AdjustmentsHorizontalIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  ArrowLeftOnRectangleIcon,
  XMarkIcon,
  TicketIcon,
  StarIcon,
  ShieldCheckIcon,
  ArchiveBoxIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  BuildingStorefrontIcon,
  ClipboardDocumentListIcon,
  TruckIcon,
  TagIcon,
  QueueListIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { canManageUsers, roleLabel } from '../../utils/roles';
import Logo from '../Common/Logo';

interface AdminSidebarProps {
  /** Thu gọn (chỉ hiện icon) — chỉ áp dụng trên màn hình lớn. */
  collapsed: boolean;
  /** Ngăn kéo đang mở — chỉ áp dụng trên điện thoại/máy tính bảng. */
  mobileOpen: boolean;
  onCloseMobile: () => void;
  /** Số tin khách chưa đọc (huy hiệu ở mục Hỗ trợ). */
  unreadChats?: number;
  /** Số đơn chờ xử lý (huy hiệu ở mục Đơn hàng). */
  pendingOrders?: number;
}

type Item = {
  path: string;
  icon: React.ElementType;
  label: string;
  adminOnly?: boolean;
  end?: boolean;
  badge?: 'orders' | 'chats';
};

const menuItems: Item[] = [
  { path: '/admin', icon: Squares2X2Icon, label: 'Tổng quan', end: true },
  { path: '/admin/products', icon: CubeIcon, label: 'Sản phẩm' },
  { path: '/admin/categories', icon: CpuChipIcon, label: 'Danh mục linh kiện' },
  { path: '/admin/catalog-standards', icon: TagIcon, label: 'Hãng & thông số chuẩn' },
  { path: '/admin/suppliers', icon: BuildingStorefrontIcon, label: 'Nhà cung cấp' },
  { path: '/admin/purchases', icon: ArrowDownTrayIcon, label: 'Nhập kho' },
  { path: '/admin/inventory', icon: ArchiveBoxIcon, label: 'Lịch sử xuất / nhập kho' },
  { path: '/admin/orders', icon: ShoppingBagIcon, label: 'Đơn hàng', badge: 'orders' },
  { path: '/admin/shipping', icon: TruckIcon, label: 'Vận chuyển' },
  { path: '/admin/warranty', icon: ShieldCheckIcon, label: 'Serial & bảo hành' },
  { path: '/admin/returns', icon: ArrowPathIcon, label: 'Đổi trả & hoàn tiền' },
  { path: '/admin/bulk', icon: QueueListIcon, label: 'Nhập / xuất CSV', adminOnly: true },
  { path: '/admin/audit', icon: ClipboardDocumentListIcon, label: 'Nhật ký thao tác', adminOnly: true },
  { path: '/admin/users', icon: UserGroupIcon, label: 'Khách hàng & tài khoản', adminOnly: true },
  { path: '/admin/coupons', icon: TicketIcon, label: 'Mã giảm giá' },
  { path: '/admin/reviews', icon: StarIcon, label: 'Đánh giá' },
  { path: '/admin/analytics', icon: ChartBarIcon, label: 'Doanh thu & Thống kê' },
  { path: '/admin/support', icon: ChatBubbleLeftRightIcon, label: 'Hỗ trợ khách hàng', badge: 'chats' },
  { path: '/admin/settings', icon: AdjustmentsHorizontalIcon, label: 'Cấu hình hệ thống' },
];

const groups = [
  { label: 'Tổng quan', paths: ['/admin', '/admin/analytics'] },
  { label: 'Bán hàng', paths: ['/admin/orders', '/admin/shipping', '/admin/coupons'] },
  {
    label: 'Sản phẩm & kho',
    paths: [
      '/admin/products',
      '/admin/categories',
      '/admin/catalog-standards',
      '/admin/suppliers',
      '/admin/purchases',
      '/admin/inventory',
      '/admin/bulk',
    ],
  },
  { label: 'Chăm sóc khách hàng', paths: ['/admin/warranty', '/admin/returns', '/admin/reviews', '/admin/support'] },
  { label: 'Hệ thống', paths: ['/admin/users', '/admin/audit', '/admin/settings'] },
];

const AdminSidebar: React.FC<AdminSidebarProps> = ({
  collapsed,
  mobileOpen,
  onCloseMobile,
  unreadChats = 0,
  pendingOrders = 0,
}) => {
  const { logout, user } = useAuth();
  const sidebar = useRef<HTMLElement>(null);
  const closeMobile = useRef(onCloseMobile);
  closeMobile.current = onCloseMobile;
  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    sidebar.current?.querySelector<HTMLButtonElement>('button')?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMobile.current();
      if (event.key !== 'Tab') return;
      const controls = [
        ...(sidebar.current?.querySelectorAll<HTMLElement>('a[href],button:not(:disabled)') || []),
      ].filter((el) => el.getClientRects().length);
      const first = controls[0],
        last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    const resize = () => {
      if (window.matchMedia('(min-width: 1024px)').matches) closeMobile.current();
    };
    window.addEventListener('keydown', keydown);
    window.addEventListener('resize', resize);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener('keydown', keydown);
      window.removeEventListener('resize', resize);
      previous?.focus();
    };
  }, [mobileOpen]);

  const { pathname } = useLocation();
  const [closed, setClosed] = useState<string[]>(() => {
    try {
      const value = JSON.parse(localStorage.getItem('admin.menu.groups') || '[]');
      return Array.isArray(value) ? value.filter((v) => typeof v === 'string') : [];
    } catch {
      return [];
    }
  });
  useEffect(() => {
    setClosed((value) => value.filter((label) => !groups.find((g) => g.label === label)?.paths.includes(pathname)));
  }, [pathname]);
  useEffect(() => {
    try {
      localStorage.setItem('admin.menu.groups', JSON.stringify(closed));
    } catch {
      /* optional */
    }
  }, [closed]);
  const visibleItems = menuItems.filter((item) => !item.adminOnly || canManageUsers(user?.role));

  // Điện thoại: luôn rộng 64 và trượt vào/ra. Màn hình lớn (lg): luôn hiện, rộng 64 hoặc 20 (thu gọn).
  const hideWhenCollapsed = collapsed ? 'lg:hidden' : '';
  const itemAlign = collapsed ? 'lg:justify-center lg:px-0' : '';
  const badgeOf = (item: Item) => (item.badge === 'orders' ? pendingOrders : item.badge === 'chats' ? unreadChats : 0);

  return (
    <aside
      ref={sidebar}
      role={mobileOpen ? 'dialog' : undefined}
      aria-modal={mobileOpen || undefined}
      aria-label="Menu chính"
      className={`fixed left-0 top-0 z-40 flex h-full w-64 flex-col border-r border-slate-200 bg-sidebar text-slate-700 transition-all duration-200 ${
        collapsed ? 'lg:w-20' : 'lg:w-64'
      } ${mobileOpen ? 'visible translate-x-0' : 'invisible -translate-x-full'} lg:visible lg:translate-x-0`}
    >
      <div className="flex items-center justify-between px-4 py-4">
        <div
          className={`flex min-w-0 items-center gap-2 ${collapsed ? 'lg:w-full lg:justify-center' : ''}`}
          aria-label="Shoppc Admin"
        >
          <Logo className={collapsed ? 'lg:hidden' : ''} />
          {collapsed && <Logo markOnly className="hidden lg:inline-flex" />}
          <span
            className={`rounded-md border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700 ${hideWhenCollapsed}`}
          >
            v{import.meta.env.VITE_APP_VERSION || '2.4'}
          </span>
        </div>
        <button
          onClick={onCloseMobile}
          aria-label="Đóng menu"
          className="rounded p-1 text-slate-500 hover:bg-slate-200/60 lg:hidden"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        {groups.map((group, groupIndex) => (
          <section key={group.label} className="mb-3">
            <button
              type="button"
              aria-expanded={!closed.includes(group.label)}
              aria-controls={`menu-group-${groupIndex}`}
              onClick={() =>
                setClosed((items) =>
                  items.includes(group.label) ? items.filter((v) => v !== group.label) : [...items, group.label],
                )
              }
              className={`flex w-full items-center justify-between px-3 py-2 text-left text-[11px] font-semibold text-slate-500 ${hideWhenCollapsed}`}
            >
              {group.label}
              <span aria-hidden="true">{closed.includes(group.label) ? '+' : '−'}</span>
            </button>
            <ul
              id={`menu-group-${groupIndex}`}
              className={`space-y-1 ${closed.includes(group.label) ? (collapsed ? 'hidden lg:block' : 'hidden') : ''}`}
            >
              {visibleItems
                .filter((item) => group.paths.includes(item.path))
                .map((item) => {
                  const count = badgeOf(item);
                  return (
                    <li key={item.path}>
                      <NavLink
                        to={item.path}
                        end={item.end}
                        onClick={onCloseMobile}
                        title={item.label}
                        className={({ isActive }: { isActive: boolean }) =>
                          `relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                            isActive
                              ? 'bg-blue-100 font-semibold text-blue-700'
                              : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'
                          } ${itemAlign}`
                        }
                      >
                        <span className="relative">
                          <item.icon className="h-5 w-5 shrink-0" />
                          {count > 0 && collapsed && (
                            <span className="absolute -right-2 -top-2 hidden h-4 min-w-[1rem] items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-semibold text-white lg:flex">
                              {count > 99 ? '99+' : count}
                            </span>
                          )}
                        </span>
                        <span className={`flex-1 truncate ${hideWhenCollapsed}`}>{item.label}</span>
                        {count > 0 && (
                          <span
                            data-testid={item.badge === 'chats' ? 'support-badge' : undefined}
                            className={`rounded-md bg-blue-600 px-1.5 py-0.5 text-[10px] font-semibold text-white ${hideWhenCollapsed}`}
                          >
                            {count > 99 ? '99+' : count}
                          </span>
                        )}
                      </NavLink>
                    </li>
                  );
                })}
            </ul>
          </section>
        ))}
      </nav>

      <div className="border-t border-slate-200 p-3">
        <div
          className={`mb-2 flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-2.5 ${collapsed ? 'lg:justify-center lg:border-0 lg:bg-transparent' : ''}`}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
            <ShieldCheckIcon className="h-5 w-5" />
          </span>
          <span className={`min-w-0 ${hideWhenCollapsed}`}>
            <span className="block truncate text-sm font-semibold text-slate-900">
              {user?.full_name || user?.username}
            </span>
            <span className="block text-[10px] uppercase tracking-wider text-blue-600">{roleLabel(user?.role)}</span>
          </span>
        </div>
        <button
          onClick={logout}
          title="Đăng xuất"
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50 ${itemAlign}`}
        >
          <ArrowLeftOnRectangleIcon className="h-5 w-5 shrink-0" />
          <span className={hideWhenCollapsed}>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
