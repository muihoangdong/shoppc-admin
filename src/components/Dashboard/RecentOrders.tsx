import React from 'react';
import { ChevronRightIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';
import { DashboardStats } from '../../types';
import { formatPrice, formatRelativeTime } from '../../utils/formatters';
import { statusBadge, statusLabel } from '../../utils/orderStatus';

interface RecentOrdersProps {
  orders: DashboardStats['recentOrders'];
  pending: number;
  onViewAll: () => void;
  onViewOrder: (id: number) => void;
}

const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('') || '?';

/** Đơn hàng mới nhất dạng bảng: mã đơn, khách, tổng tiền, trạng thái, thời gian; bấm một dòng để mở đơn. */
export const RecentOrders: React.FC<RecentOrdersProps> = ({ orders, pending, onViewAll, onViewOrder }) => (
  <div className="frost-card overflow-hidden">
    <div className="flex flex-wrap items-start justify-between gap-3 p-5 pb-3">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-blue-600">
          <ClipboardDocumentListIcon className="h-5 w-5" />
        </span>
        <div>
          <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            Đơn hàng mới cần xử lý
            {pending > 0 && <span className="rounded-md bg-red-600 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-white">{pending} chờ xử lý</span>}
          </h3>
          <p className="text-sm text-slate-500">Ưu tiên xác nhận, đóng gói & giao hàng sớm</p>
        </div>
      </div>
      <button onClick={onViewAll} className="flex items-center gap-1 font-mono text-xs font-semibold text-blue-600 hover:underline">
        Xem tất cả <ChevronRightIcon className="h-3.5 w-3.5" />
      </button>
    </div>
    {orders.length === 0 ? (
      <p className="px-5 pb-6 text-sm text-slate-500">Chưa có đơn hàng nào.</p>
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-y border-slate-200 bg-slate-50 text-left">
              {['Mã đơn', 'Khách hàng', 'Tổng tiền', 'Trạng thái', ''].map((h) => (
                <th key={h} className="frost-label px-5 py-2.5 !text-[10px] font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {orders.map((order) => (
              <tr key={order.id} onClick={() => onViewOrder(order.id)} className="cursor-pointer transition hover:bg-slate-50">
                <td className="px-5 py-3">
                  <p className="font-mono text-xs font-semibold text-blue-600">#{order.order_code}</p>
                  <p className="text-[11px] text-slate-400">{formatRelativeTime(order.created_at)}</p>
                </td>
                <td className="px-5 py-3">
                  <span className="flex items-center gap-2">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 font-mono text-[11px] font-semibold text-blue-700">
                      {initials(order.customer_name)}
                    </span>
                    <span className="truncate font-medium text-slate-800">{order.customer_name}</span>
                  </span>
                </td>
                <td className="whitespace-nowrap px-5 py-3 font-mono text-sm font-semibold text-slate-900">{formatPrice(order.total_amount)}</td>
                <td className="px-5 py-3">
                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadge(order.status)}`}>{statusLabel(order.status)}</span>
                </td>
                <td className="px-5 py-3 text-right">
                  <span className="rounded-lg border border-slate-200 px-2 py-1 font-mono text-[11px] text-slate-600">Chi tiết</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
);
