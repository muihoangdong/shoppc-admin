import React from 'react';
import { Link } from 'react-router-dom';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { DashboardStats } from '../../types';

export const LowStockList: React.FC<{ items: DashboardStats['lowStockList']; total: number }> = ({ items, total }) => (
  <div className="frost-card p-5">
    <div className="mb-3 flex items-center justify-between">
      <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
        <ExclamationTriangleIcon className="h-5 w-5 text-red-500" /> Sắp hết hàng
      </h3>
      {total > 0 && (
        <Link to="/admin/products?stock=low" className="text-xs font-semibold text-blue-600 hover:underline">
          Xem tất cả ({total})
        </Link>
      )}
    </div>
    {items.length === 0 ? (
      <p className="text-sm text-slate-500">Tồn kho đang ổn, không có sản phẩm nào sắp hết.</p>
    ) : (
      <ul className="divide-y divide-slate-200">
        {items.map((p) => (
          <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
            <span className="truncate text-sm text-slate-800">{p.name}</span>
            <span className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-semibold ${p.stock === 0 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
              {p.stock === 0 ? 'Hết hàng' : `Còn ${p.stock}`}
            </span>
          </li>
        ))}
      </ul>
    )}
  </div>
);
