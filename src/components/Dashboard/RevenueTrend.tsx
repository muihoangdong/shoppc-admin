import React, { useId } from 'react';
import { Area, AreaChart, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Analytics } from '../../types';
import { formatNumber, formatPrice, formatShortNumber } from '../../utils/formatters';
import useThemeColors from '../../hooks/useThemeColors';

/** 2026-10-05 -> 05/10, 2026-10 -> T10/26 */
const bucketLabel = (b: string) => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(b)) return `${b.slice(8, 10)}/${b.slice(5, 7)}`;
  if (/^\d{4}-\d{2}$/.test(b)) return `T${b.slice(5, 7)}/${b.slice(2, 4)}`;
  return b;
};

/** Biến động doanh thu (vùng) + số đơn (đường nét đứt) theo ngày/tháng của kỳ đang xem. */
export const RevenueTrend: React.FC<{ data: Analytics }> = ({ data }) => {
  const c = useThemeColors();
  const gid = useId().replace(/:/g, '');
  const series = data.series.map((s) => ({ ...s, label: bucketLabel(s.bucket) }));
  const peak = series.reduce((best, s) => (s.revenue > (best?.revenue ?? -1) ? s : best), series[0]);
  const hasData = series.some((s) => s.revenue > 0 || s.orders > 0);

  return (
    <div className="frost-card flex h-full flex-col p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Biến động Doanh thu & Đơn hàng</h3>
          <p className="text-sm text-slate-500">
            {data.range.label} ({data.range.from} → {data.range.to}) · theo {data.granularity === 'day' ? 'ngày' : 'tháng'}
          </p>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-slate-600">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: c.primary }} /> Doanh thu (đ)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 border-t-2 border-dashed" style={{ borderColor: c.series[1] }} /> Số đơn
          </span>
        </div>
      </div>

      {!hasData ? (
        <p className="flex flex-1 items-center justify-center py-16 text-sm text-slate-500">Chưa có đơn hàng trong khoảng thời gian này.</p>
      ) : (
        <div className="mt-4 h-72 flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`rev-${gid}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={c.primary} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={c.primary} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 6" stroke={c.grid} vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: c.muted }} tickLine={false} axisLine={false} minTickGap={16} />
              <YAxis yAxisId="rev" tickFormatter={(v: number) => formatShortNumber(v)} tick={{ fontSize: 11, fill: c.muted }} tickLine={false} axisLine={false} width={56} />
              <YAxis yAxisId="ord" orientation="right" allowDecimals={false} tick={{ fontSize: 11, fill: c.muted }} tickLine={false} axisLine={false} width={28} />
              <Tooltip
                formatter={(value: number, name: string) => (name === 'revenue' ? [formatPrice(value), 'Doanh thu'] : [formatNumber(value), 'Số đơn'])}
                labelFormatter={(l: string) => `Kỳ ${l}`}
              />
              <Area yAxisId="rev" type="monotone" dataKey="revenue" stroke={c.primary} strokeWidth={2.5} fill={`url(#rev-${gid})`} activeDot={{ r: 5 }} />
              <Line yAxisId="ord" type="monotone" dataKey="orders" stroke={c.series[1]} strokeWidth={2} strokeDasharray="5 5" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Stat label="Doanh thu cao nhất" value={peak && peak.revenue > 0 ? `${formatPrice(peak.revenue)}` : '—'} hint={peak && peak.revenue > 0 ? peak.label : undefined} />
        <Stat label="Giá trị TB / đơn" value={formatPrice(data.avg_realized_order_value || 0)} />
        <Stat label="Đơn bị hủy" value={formatNumber(data.cancelled_orders)} hint={data.total_orders ? `${((data.cancelled_orders / data.total_orders) * 100).toFixed(1)}%` : undefined} />
      </div>
    </div>
  );
};

const Stat: React.FC<{ label: string; value: string; hint?: string }> = ({ label, value, hint }) => (
  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
    <p className="text-[11px] text-slate-500">{label}</p>
    <p className="text-sm font-semibold text-blue-600">
      {value} {hint && <span className="text-[11px] font-normal text-slate-400">· {hint}</span>}
    </p>
  </div>
);
