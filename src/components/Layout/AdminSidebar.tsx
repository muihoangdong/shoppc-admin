import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  HomeIcon,
  CubeIcon,
  TagIcon,
  ShoppingBagIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ArrowLeftOnRectangleIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';

interface AdminSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const menuItems = [
  { path: '/admin', icon: HomeIcon, label: 'Tổng quan' },
  { path: '/admin/products', icon: CubeIcon, label: 'Sản phẩm' },
  { path: '/admin/categories', icon: TagIcon, label: 'Danh mục' },
  { path: '/admin/orders', icon: ShoppingBagIcon, label: 'Đơn hàng' },
  { path: '/admin/analytics', icon: ChartBarIcon, label: 'Thống kê' },
  { path: '/admin/settings', icon: Cog6ToothIcon, label: 'Cài đặt' },
];

const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen }) => {
  const { logout } = useAuth();

  return (
    <div
      className={`fixed left-0 top-0 h-full bg-gray-900 text-white transition-all duration-300 z-20 ${
        isOpen ? 'w-64' : 'w-20'
      }`}
    >
      <div className="p-4 border-b border-gray-800">
        <div className={`font-bold text-xl ${!isOpen && 'text-center'}`}>
          {isOpen ? ' Shoppc Admin' : 'AD'}
        </div>
      </div>

      <nav className="mt-6">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center px-4 py-3 transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              } ${!isOpen && 'justify-center'}`
            }
          >
            <item.icon className="h-5 w-5" />
            {isOpen && <span className="ml-3">{item.label}</span>}
          </NavLink>
        ))}

        <button
          onClick={logout}
          className={`w-full flex items-center px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors mt-4 ${
            !isOpen && 'justify-center'
          }`}
        >
          <ArrowLeftOnRectangleIcon className="h-5 w-5" />
          {isOpen && <span className="ml-3">Đăng xuất</span>}
        </button>
      </nav>
    </div>
  );
};

export default AdminSidebar;