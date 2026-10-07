import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Area,
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Analytics, AnalyticsPeriod } from '../types';
import { analyticsService } from '../services/analyticsService';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import ErrorMessage from '../components/Common/ErrorMessage';
import { StatsCard } from '../components/Dashboard/StatsCard';
import usePageTitle from '../hooks/usePageTitle';
import { formatNumber, formatPercent, formatPrice, formatShortNumber } from '../utils/formatters';
import { statusBadge } from '../utils/orderStatus';
import { BanknotesIcon, ChartBarIcon, ReceiptPercentIcon, XCircleIcon } from '@heroicons/react/24/outline';

type PeriodChoice = AnalyticsPeriod | 'custom';

const PERIODS: { value: AnalyticsPeriod; label: string }[] = [
  { value: 'today', label: 'Hôm nay' },
  { value: '7d', label: '7 ngày' },
  { value: '30d', label: '30 ngày' },
  { value: 'this_month', label: 'Tháng này' },
  { value: 'last_month', label: 'Tháng trước' },
  { value: 'this_year', label: 'Năm nay' },
];

const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#84cc16', '#6b7280'];

/** 2026-10-04 -> 04/10 ; 2026-10 -> 10/2026 */
const bucketLabel = (b: string) => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(b)) return `${b.slice(8)}/${b.slice(5, 7)}`;
  if (/^\d{4}-\d{2}$/.test(b)) return `${b.slice(5)}/${b.slice(0, 4)}`;
  return b;
};

const PAYMENT_LABELS: Record<string, string> = { cod: 'Thanh toán khi nhận hàng (COD)', banking: 'Chuyển khoản' };

const AnalyticsPage: React.FC = () => {
  usePageTitle('Thống kê');
  const [period, setPeriod] = useState<PeriodChoice>('30d');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [applied, setApplied] = useState<{ from: string; to: string } | null>(null);
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const latest = useRef(0);

  const customInvalid = !customFrom || !customTo || customFrom > customTo;

  useEffect(() => {
    if (period === 'custom' && !applied) return;
    const ticket = ++latest.current;
    setLoading(true);
    analyticsService
      .getAnalytics(period === 'custom' && applied ? applied : { period: period as AnalyticsPeriod })
      .then((result) => {
        if (ticket !== latest.current) return;
        setData(result);
        setError('');
      })
      .catch((err: Error) => ticket === latest.current && setError(err.message))
      .finally(() => ticket === latest.current && setLoading(false));
  }, [period, applied, reloadKey]);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  const chipClass = (active: boolean) =>
    `rounded-full px-3 py-1.5 text-sm transition ${active ? 'bg-blue-600 text-white' : 'border bg-white text-gray-700 hover:bg-gray-50'}`;
  const dateInput = 'rounded-lg border border-gray-300 px-3 py-1.5 text-sm';

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Thống kê kinh doanh</h1>
        <p className="text-sm text-gray-500">Doanh thu chỉ tính đơn đã giao / hoàn tất. Số đơn và sản phẩm bán chạy không tính đơn đã hủy.</p>
      </div>

      <div className="mb-6 flex flex-wrap items-end gap-2">
        {PERIODS.map((p) => (
          <button key={p.value} className={chipClass(period === p.value)} onClick={() => setPeriod(p.value)}>
            {p.label}
          </button>
        ))}
        <button className={chipClass(period === 'custom')} onClick={() => setPeriod('custom')}>
          Tùy chọn
        </button>
        {period === 'custom' && (
          <div className="flex flex-wrap items-end gap-2">
            <label className="text-xs text-gray-500">
              Từ ngày
              <input type="date" value={customFrom} max={customTo || undefined} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomFrom(e.target.value)} className={`${dateInput} mt-1 block`} />
            </label>
            <label className="text-xs text-gray-500">
              Đến ngày
              <input type="date" value={customTo} min={customFrom || undefined} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomTo(e.target.value)} className={`${dateInput} mt-1 block`} />
            </label>
            <button
              disabled={customInvalid}
              onClick={() => setApplied({ from: customFrom, to: customTo })}
              className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Xem
            </button>
          </div>
        )}
      </div>

      {error && !data ? (
        <ErrorMessage message={error} onRetry={reload} />
      ) : loading && !data ? (
        <LoadingSpinner />
      ) : period === 'custom' && !applied && !data ? (
        <p className="py-12 text-center text-sm text-gray-500">Chọn khoảng ngày rồi bấm "Xem".</p>
      ) : (
        data && (
          <div className={`space-y-6 transition-opacity ${loading ? 'opacity-60' : ''}`}>
            {error && (
              <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}{' '}
                <button onClick={reload} className="underline">
                  Thử lại
                </button>
              </div>
            )}
            <p className="text-sm text-gray-500" data-testid="range-label">
              Khoảng thời gian: <strong>{data.range.label}</strong> ({data.range.from} → {data.range.to})
            </p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatsCard title="Doanh thu thực" value={formatPrice(data.realized_revenue)} icon={BanknotesIcon} color="green" hint={`${formatNumber(data.realized_orders)} đơn đã giao/hoàn tất`} />
              <StatsCard title="Tổng đơn hàng" value={formatNumber(data.total_orders)} icon={ChartBarIcon} color="blue" hint="Gồm cả đơn đã hủy" />
              <StatsCard title="Giá trị đơn trung bình" value={formatPrice(data.avg_realized_order_value)} icon={ReceiptPercentIcon} color="purple" hint="Trên các đơn đã giao/hoàn tất" />
              <StatsCard
                title="Tỷ lệ hủy"
                value={formatPercent(data.total_orders ? (data.cancelled_orders / data.total_orders) * 100 : 0, 1)}
                icon={XCircleIcon}
                color="red"
                hint={`${formatNumber(data.cancelled_orders)} đơn đã hủy`}
              />
            </div>

            {data.total_orders === 0 ? (
              <p className="rounded-lg bg-white py-12 text-center text-sm text-gray-500 shadow">Không có đơn hàng nào trong khoảng thời gian này.</p>
            ) : (
              <>
                <div className="rounded-lg bg-white p-6 shadow">
                  <h3 className="text-lg font-semibold">Doanh thu và số đơn theo {data.granularity === 'day' ? 'ngày' : 'tháng'}</h3>
                  <ResponsiveContainer width="100%" height={320}>
                    <ComposedChart data={data.series}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="bucket" tickFormatter={bucketLabel} minTickGap={16} />
                      <YAxis yAxisId="revenue" tickFormatter={(v: number) => formatShortNumber(v)} width={70} />
                      <YAxis yAxisId="orders" orientation="right" allowDecimals={false} width={40} />
                      <Tooltip
                        labelFormatter={bucketLabel}
                        formatter={(value: number, name: string) => (name === 'Doanh thu' ? [formatPrice(value), name] : [value, name])}
                      />
                      <Legend />
                      <Area yAxisId="revenue" type="monotone" dataKey="revenue" name="Doanh thu" stroke="#6366f1" fill="rgba(99, 102, 241, 0.18)" />
                      <Bar yAxisId="orders" dataKey="orders" name="Số đơn" fill="#10b981" barSize={14} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <div className="rounded-lg bg-white p-6 shadow">
                    <h3 className="mb-4 text-lg font-semibold">Doanh số theo danh mục</h3>
                    {data.by_category_excluding_cancelled.length === 0 ? (
                      <p className="text-sm text-gray-500">Chưa có dữ liệu.</p>
                    ) : (
                      <div className="grid items-center gap-4 sm:grid-cols-2">
                        <ResponsiveContainer width="100%" height={220}>
                          <PieChart>
                            <Pie data={data.by_category_excluding_cancelled} dataKey="revenue" nameKey="category" innerRadius={45} outerRadius={85}>
                              {data.by_category_excluding_cancelled.map((c, i) => (
                                <Cell key={c.category} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(v: number) => formatPrice(v)} />
                          </PieChart>
                        </ResponsiveContainer>
                        <ul className="space-y-2 text-sm">
                          {data.by_category_excluding_cancelled.map((c, i) => (
                            <li key={c.category} className="flex items-center justify-between gap-2">
                              <span className="flex min-w-0 items-center gap-2">
                                <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                                <span className="truncate">{c.category}</span>
                              </span>
                              <span className="shrink-0 text-gray-500">{formatPrice(c.revenue)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="rounded-lg bg-white p-6 shadow">
                    <h3 className="mb-4 text-lg font-semibold">Đơn hàng theo trạng thái</h3>
                    <ul className="space-y-3">
                      {data.by_status.map((s) => (
                        <li key={s.status}>
                          <div className="flex items-center justify-between text-sm">
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge(s.status)}`}>{s.label}</span>
                            <span className="text-gray-600">
                              {formatNumber(s.orders)} đơn · {formatPrice(s.amount)}
                            </span>
                          </div>
                          <div className="mt-1 h-1.5 rounded-full bg-gray-100">
                            <div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${(s.orders / data.total_orders) * 100}%` }} />
                          </div>
                        </li>
                      ))}
                    </ul>
                    <h4 className="mb-2 mt-6 text-sm font-semibold text-gray-700">Phương thức thanh toán (không tính đơn hủy)</h4>
                    <ul className="space-y-1 text-sm">
                      {data.by_payment_method_excluding_cancelled.map((p) => (
                        <li key={p.payment_method} className="flex justify-between">
                          <span>{PAYMENT_LABELS[p.payment_method] || p.payment_method}</span>
                          <span className="text-gray-500">
                            {formatNumber(p.orders)} đơn · {formatPrice(p.amount)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="overflow-hidden rounded-lg bg-white shadow">
                  <h3 className="p-6 pb-3 text-lg font-semibold">Sản phẩm bán chạy</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                        <tr>
                          <th className="px-6 py-2">#</th>
                          <th className="px-6 py-2">Sản phẩm</th>
                          <th className="px-6 py-2 text-right">Đã bán</th>
                          <th className="px-6 py-2 text-right">Doanh số</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {data.top_products_excluding_cancelled.map((p, i) => (
                          <tr key={`${p.product_id}-${i}`}>
                            <td className="px-6 py-2 text-gray-400">{i + 1}</td>
                            <td className="px-6 py-2">{p.name}</td>
                            <td className="px-6 py-2 text-right">{formatNumber(p.quantity_sold)}</td>
                            <td className="px-6 py-2 text-right">{formatPrice(p.revenue)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )
      )}
    </div>
  );
};

export default AnalyticsPage;
