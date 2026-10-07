import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { formatPrice, formatShortNumber } from '../../utils/formatters';

interface RevenuePoint {
  month: string; // dạng YYYY-MM
  revenue: number;
}

interface RevenueChartProps {
  data?: RevenuePoint[];
}

/** 2026-10 -> 10/2026 */
const monthLabel = (m: string) => (/^\d{4}-\d{2}$/.test(m) ? `${m.slice(5)}/${m.slice(0, 4)}` : m);

export const RevenueChart: React.FC<RevenueChartProps> = ({ data = [] }) => {
  const hasRevenue = data.some((d) => d.revenue > 0);
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold">Doanh thu theo tháng</h3>
      <p className="text-xs text-gray-400 mb-4">Chỉ tính đơn đã giao / hoàn tất, 6 tháng gần nhất</p>
      {!hasRevenue ? (
        <p className="py-16 text-center text-sm text-gray-500">Chưa có doanh thu trong 6 tháng qua.</p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" tickFormatter={monthLabel} />
            <YAxis tickFormatter={(v: number) => formatShortNumber(v)} width={70} />
            <Tooltip
              labelFormatter={monthLabel}
              formatter={(value: number) => [formatPrice(value), 'Doanh thu']}
            />
            <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} name="Doanh thu" />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};
