import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRightIcon, FireIcon } from '@heroicons/react/24/outline';
import { Product, TopProduct } from '../../types';
import { formatNumber, formatShortNumber } from '../../utils/formatters';

interface TopProductsProps {
  products: TopProduct[];
  /** Danh sách sản phẩm hiện có để lấy ảnh + tồn kho (có thể rỗng nếu chưa tải được) */
  catalog: Product[];
  periodLabel: string;
}

/** Top bán chạy THẬT (đơn không bị hủy trong kỳ đang xem) kèm ảnh, doanh số và thanh tồn kho. */
export const TopProducts: React.FC<TopProductsProps> = ({ products, catalog, periodLabel }) => {
  const max = Math.max(...products.map((p) => p.quantity_sold), 1);
  const byId = new Map(catalog.map((p) => [p.id, p]));
  return (
    <div className="frost-card flex h-full flex-col p-5">
      <div className="mb-4 flex items-start justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Linh kiện bán chạy</h3>
          <p className="text-sm text-slate-500">Top theo số lượng · {periodLabel}</p>
        </div>
        <FireIcon className="h-5 w-5 text-blue-600" />
      </div>
      {products.length === 0 ? (
        <p className="text-sm text-slate-500">Chưa có sản phẩm nào được bán trong kỳ này.</p>
      ) : (
        <ol className="space-y-3">
          {products.slice(0, 5).map((p, i) => {
            const info = p.product_id ? byId.get(p.product_id) : undefined;
            const stock = info?.stock;
            const low = stock !== undefined && stock <= 10;
            return (
              <li key={`${p.product_id}-${i}`} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white">
                    {info?.image_url ? <img src={info.image_url} alt="" className="h-full w-full object-contain p-1" /> : <span className="font-mono text-xs text-slate-400">#{i + 1}</span>}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{p.name}</p>
                    <p className="flex justify-between gap-2 font-mono text-[11px]">
                      <span className="text-slate-500">Đã bán: {formatNumber(p.quantity_sold)}</span>
                      <span className="font-semibold text-blue-600">{formatShortNumber(p.revenue)}</span>
                    </p>
                  </div>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-slate-200">
                  <div className="h-1.5 rounded-full bg-blue-600" style={{ width: `${Math.max((p.quantity_sold / max) * 100, 4)}%` }} />
                </div>
                {stock !== undefined && (
                  <p className={`mt-1.5 font-mono text-[11px] ${low ? 'font-semibold text-red-600' : 'text-slate-500'}`}>
                    Tồn kho: {stock === 0 ? 'Hết hàng' : `còn ${formatNumber(stock)}`}
                  </p>
                )}
              </li>
            );
          })}
        </ol>
      )}
      <Link
        to="/admin/analytics"
        className="mt-auto flex items-center justify-center gap-1 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 pt-2 font-mono text-xs font-semibold text-blue-700 hover:bg-blue-100"
        style={{ marginTop: '1rem' }}
      >
        Xem báo cáo hiệu suất sản phẩm <ArrowRightIcon className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
};
