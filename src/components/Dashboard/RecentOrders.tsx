import React from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Order } from '../../types';

interface RecentOrdersProps {
  orders?: Order[];
  onViewAll?: () => void;
  onViewOrder?: (id: number) => void;
}

const mockOrders: Order[] = [];

const statusColors: Record<Order['status'], string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-indigo-100 text-indigo-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const statusText: Record<Order['status'], string> = {
  pending: 'Chờ xử lý',
  processing: 'Đang xử lý',
  shipped: 'Đã giao hàng',
  delivered: 'Đã nhận hàng',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
};

export const RecentOrders: React.FC<RecentOrdersProps> = ({ orders = mockOrders, onViewAll, onViewOrder }) => {
  const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b flex justify-between items-center">
        <h3 className="text-lg font-semibold">Đơn hàng gần đây</h3>
        {onViewAll && (
          <button onClick={onViewAll} className="text-blue-600 hover:text-blue-700 text-sm">
            Xem tất cả
          </button>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã đơn</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Khách hàng</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tổng tiền</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày đặt</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {orders.map((order) => (
              <tr
                key={order.id}
                onClick={() => onViewOrder?.(order.id)}
                className={`${onViewOrder ? 'cursor-pointer hover:bg-gray-50' : ''}`}
              >
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{order.order_code}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{order.customer_name}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{formatPrice(order.total_amount)}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs rounded-full ${statusColors[order.status]}`}>
                    {statusText[order.status]}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {format(new Date(order.created_at), 'dd/MM/yyyy HH:mm', { locale: vi })}
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  Chưa có đơn hàng nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
