import React from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Analytics } from '../../types';
import { formatPrice, formatShortNumber } from '../../utils/formatters';
import useThemeColors from '../../hooks/useThemeColors';

const MAX_SLICES = 5;

/** Cơ cấu doanh thu theo danh mục (không tính đơn hủy) — biểu đồ tròn + bảng chú thích. */
export const RevenueMix: React.FC<{ data: Analytics }> = ({ data }) => {
  const c = useThemeColors();
  const sorted = [...data.by_category_excluding_cancelled].sort((a, b) => b.revenue - a.revenue);
  const top = sorted.slice(0, MAX_SLICES);
  const rest = sorted.slice(MAX_SLICES).reduce((t, x) => t + x.revenue, 0);
  const slices = [...top.map((x) => ({ name: x.category || 'Khác', value: x.revenue })), ...(rest > 0 ? [{ name: 'Khác', value: rest }] : [])].filter((s) => s.value > 0);
  const total = slices.reduce((t, s) => t + s.value, 0);

  return (
    <div className="frost-card flex h-full flex-col p-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Cơ cấu Doanh thu</h3>
          <p className="text-sm text-slate-500">Theo danh mục sản phẩm</p>
        </div>
        <span className="rounded-lg border border-slate-200 px-2 py-1 font-mono text-[11px] text-slate-600">{data.range.label}</span>
      </div>

      {total === 0 ? (
        <p className="flex flex-1 items-center justify-center py-16 text-sm text-slate-500">Chưa có doanh số theo danh mục.</p>
      ) : (
        <>
          <div className="relative mx-auto mt-2 h-52 w-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={slices} dataKey="value" nameKey="name" innerRadius="68%" outerRadius="100%" paddingAngle={2} stroke={c.surface} strokeWidth={3}>
                  {slices.map((s, i) => (
                    <Cell key={s.name} fill={c.series[i % c.series.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => formatPrice(v)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-slate-900">{formatShortNumber(total)}</span>
              <span className="text-xs text-slate-500">Tổng doanh số</span>
            </div>
          </div>
          <ul className="mt-4 space-y-2">
            {slices.map((s, i) => (
              <li key={s.name} className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: c.series[i % c.series.length] }} />
                  <span className="truncate text-slate-700">{s.name}</span>
                </span>
                <span className="shrink-0 font-mono text-xs">
                  <strong className="text-slate-900">{((s.value / total) * 100).toFixed(0)}%</strong>
                  <span className="ml-1 text-slate-500">({formatShortNumber(s.value)})</span>
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};
