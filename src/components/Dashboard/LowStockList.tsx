import React from 'react';
import { Link } from 'react-router-dom';
import { DashboardStats } from '../../types';

export const LowStockList: React.FC<{ items: DashboardStats['lowStockList']; total: number }> = ({ items, total }) => (
  <div className="bg-white rounded-lg shadow">
    <div className="flex items-center justify-between p-6 pb-3">
      <h3 className="text-lg font-semibold">Sắp hết hàng</h3>
      {total > 0 && (
        <Link to="/admin/products?stock=low" className="text-sm text-blue-600 hover:underline">
          Xem tất cả ({total})
        </Link>
      )}
    </div>
    {items.length === 0 ? (
      <p className="px-6 pb-6 text-sm text-gray-500">Tồn kho đang ổn, không có sản phẩm nào sắp hết.</p>
    ) : (
      <ul className="divide-y">
        {items.map((p) => (
          <li key={p.id} className="flex items-center justify-between gap-3 px-6 py-3">
            <span className="truncate text-sm text-gray-800">{p.name}</span>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                p.stock === 0 ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'
              }`}
            >
              {p.stock === 0 ? 'Hết hàng' : `Còn ${p.stock}`}
            </span>
          </li>
        ))}
      </ul>
    )}
  </div>
);
