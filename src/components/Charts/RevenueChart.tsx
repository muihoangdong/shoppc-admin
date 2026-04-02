import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface RevenuePoint {
  month: string;
  revenue: number;
}

interface RevenueChartProps {
  data?: RevenuePoint[];
}

export const RevenueChart: React.FC<RevenueChartProps> = ({ data = [] }) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Doanh thu theo tháng</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip formatter={(value: number) => [`${value.toLocaleString('vi-VN')}đ`, 'Doanh thu']} />
          <Legend />
          <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} name="Doanh thu" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
