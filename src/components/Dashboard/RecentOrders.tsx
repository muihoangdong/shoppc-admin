import React from 'react';
import { DashboardStats } from '../../types';
import { formatPrice, formatRelativeTime } from '../../utils/formatters';
import { statusBadge, statusLabel } from '../../utils/orderStatus';

interface RecentOrdersProps {
  orders: DashboardStats['recentOrders'];
  onViewAll: () => void;
  onViewOrder: (id: number) => void;
}

export const RecentOrders: React.FC<RecentOrdersProps> = ({ orders, onViewAll, onViewOrder }) => (
  <div className="bg-white rounded-lg shadow">
    <div className="flex items-center justify-between p-6 pb-3">
      <h3 className="text-lg font-semibold">Đơn hàng gần đây</h3>
      <button onClick={onViewAll} className="text-sm text-blue-600 hover:underline">
        Xem tất cả
      </button>
    </div>
    {orders.length === 0 ? (
      <p className="px-6 pb-6 text-sm text-gray-500">Chưa có đơn hàng nào.</p>
    ) : (
      <ul className="divide-y">
        {orders.map((order) => (
          <li key={order.id}>
            <button
              onClick={() => onViewOrder(order.id)}
              className="flex w-full items-center justify-between gap-3 px-6 py-3 text-left hover:bg-gray-50"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{order.order_code}</p>
                <p className="text-xs text-gray-500 truncate">
                  {order.customer_name} · {formatRelativeTime(order.created_at)}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold text-gray-900">{formatPrice(order.total_amount)}</p>
                <span className={`inline-block rounded-full px-2 py-0.5 text-xs ${statusBadge(order.status)}`}>
                  {statusLabel(order.status)}
                </span>
              </div>
            </button>
          </li>
        ))}
      </ul>
    )}
  </div>
);
