import React from 'react';
import { TopProduct } from '../../types';
import { formatNumber, formatPrice } from '../../utils/formatters';

/** Top sản phẩm bán chạy THẬT (từ các đơn không bị hủy trong 30 ngày gần nhất). */
export const TopProducts: React.FC<{ products: TopProduct[] }> = ({ products }) => {
  const max = Math.max(...products.map((p) => p.quantity_sold), 1);
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold">Bán chạy nhất</h3>
      <p className="text-xs text-gray-400 mb-4">30 ngày gần nhất, không tính đơn đã hủy</p>
      {products.length === 0 ? (
        <p className="text-sm text-gray-500">Chưa có sản phẩm nào được bán trong 30 ngày qua.</p>
      ) : (
        <ol className="space-y-4">
          {products.map((p, i) => (
            <li key={`${p.product_id}-${i}`}>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate font-medium text-gray-800">
                  {i + 1}. {p.name}
                </span>
                <span className="shrink-0 text-gray-500">{formatNumber(p.quantity_sold)} đã bán</span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-gray-100">
                <div className="h-2 rounded-full bg-blue-500" style={{ width: `${Math.max((p.quantity_sold / max) * 100, 4)}%` }} />
              </div>
              <p className="mt-1 text-xs text-gray-400">{formatPrice(p.revenue)}</p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
};
