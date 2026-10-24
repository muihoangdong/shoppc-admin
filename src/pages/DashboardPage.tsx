import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  BanknotesIcon,
  CalendarDaysIcon,
  ExclamationTriangleIcon,
  ShoppingCartIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { dashboardService } from '../services/dashboardService';
import { analyticsService, AnalyticsQuery } from '../services/analyticsService';
import { productService } from '../services/productService';
import { Analytics, DashboardStats, Product } from '../types';
import { KpiCard } from '../components/Dashboard/KpiCard';
import { RevenueTrend } from '../components/Dashboard/RevenueTrend';
import { RevenueMix } from '../components/Dashboard/RevenueMix';
import { RecentOrders } from '../components/Dashboard/RecentOrders';
import { TopProducts } from '../components/Dashboard/TopProducts';
import { LowStockList } from '../components/Dashboard/LowStockList';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import ErrorMessage from '../components/Common/ErrorMessage';
import usePageTitle from '../hooks/usePageTitle';
import useDebouncedCallback from '../hooks/useDebouncedCallback';
import { useRealtime } from '../contexts/RealtimeContext';
import { AiInsights } from '../components/Dashboard/AiInsights';
import { formatNumber, formatPrice } from '../utils/formatters';

type PeriodKey = 'today' | '7d' | 'this_month' | 'custom';
const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: 'today', label: 'Hôm nay' },
  { key: '7d', label: '7 ngày' },
  { key: 'this_month', label: 'Tháng này' },
  { key: 'custom', label: 'Tùy chọn' },
];

/** Cộng/trừ ngày cho chuỗi YYYY-MM-DD (tính theo UTC để không lệch múi giờ) */
const addDays = (ymd: string, n: number) => {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
};
const daysBetween = (a: string, b: string) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000);

/** Kỳ liền trước có cùng độ dài để so sánh (tháng này ↔ tháng trước) */
const previousQuery = (period: PeriodKey, range: Analytics['range']): AnalyticsQuery => {
  if (period === 'this_month') return { period: 'last_month' };
  const len = daysBetween(range.from, range.to) + 1;
  return { from: addDays(range.from, -len), to: addDays(range.from, -1) };
};

const pctChange = (now: number, before: number): number | null => (before > 0 ? ((now - before) / before) * 100 : null);

/** Xuất CSV (Excel mở được tiếng Việt nhờ BOM) */
function downloadCsv(name: string, rows: (string | number)[][]) {
  const esc = (v: string | number) => {
    const s = String(v ?? '');
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = '﻿' + rows.map((r) => r.map(esc).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const DashboardPage: React.FC = () => {
  usePageTitle('Tổng quan');
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [period, setPeriod] = useState<PeriodKey>('this_month');
  const [custom, setCustom] = useState(() => {
    const today = new Date().toLocaleDateString('sv-SE');
    return { from: addDays(today, -13), to: today };
  });
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [previous, setPrevious] = useState<Analytics | null>(null);
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [error, setError] = useState('');
  const [analyticsError, setAnalyticsError] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);
  const ticket = useRef(0);

  const query: AnalyticsQuery = period === 'custom' ? { from: custom.from, to: custom.to } : { period };
  const queryKey = JSON.stringify(query);

  const load = useCallback(
    async (isRefresh = false) => {
      const my = ++ticket.current;
      try {
        if (isRefresh) setRefreshing(true);
        setError('');
        setAnalyticsError('');
        const q = JSON.parse(queryKey) as AnalyticsQuery;
        const [s, a, products] = await Promise.all([
          dashboardService.getStats(),
          analyticsService.getAnalytics(q).catch((e: Error) => {
            setAnalyticsError(e.message);
            return null;
          }),
          productService.getProducts().catch(() => [] as Product[]),
        ]);
        if (my !== ticket.current) return;
        setStats(s);
        setAnalytics(a);
        setCatalog(products);
        setUpdatedAt(new Date());
        setPrevious(a ? await analyticsService.getAnalytics(previousQuery(period, a.range)).catch(() => null) : null);
      } catch (err: any) {
        if (my === ticket.current) setError(err.message || 'Không thể tải số liệu tổng quan');
      } finally {
        if (my === ticket.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- queryKey đại diện cho kỳ đang chọn
    [queryKey, period]
  );

  useEffect(() => {
    void load(!!stats);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ tải lại khi đổi kỳ
  }, [load]);

  // Realtime: số liệu đổi (đơn mới, đổi trạng thái, tồn kho...) → làm mới ngầm, không nháy màn hình
  const refreshSoon = useDebouncedCallback(() => void load(true), 1000);
  useRealtime('stats:dirty', refreshSoon);
  useRealtime('resync', refreshSoon);

  useEffect(() => {
    if (!exportOpen) return undefined;
    const onDown = (e: MouseEvent) => exportRef.current && !exportRef.current.contains(e.target as Node) && setExportOpen(false);
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [exportOpen]);

  if (loading && !stats) return <LoadingSpinner />;
  // Lỗi mà chưa có dữ liệu cũ: báo rõ + cho thử lại (không hiện toàn số 0 một cách đánh lừa)
  if (!stats) return <ErrorMessage message={error || 'Không có dữ liệu'} onRetry={() => void load()} />;

  const revenue = analytics?.realized_revenue ?? stats.totalRevenue;
  const orders = analytics?.total_orders ?? stats.totalOrders;
  const lowNames = stats.lowStockList.slice(0, 2);

  const exportCsv = () => {
    setExportOpen(false);
    if (!analytics) return;
    const rows: (string | number)[][] = [
      ['Báo cáo tổng quan Shoppc', `${analytics.range.from} → ${analytics.range.to}`],
      [],
      ['Chỉ số', 'Giá trị'],
      ['Doanh thu thực nhận (đ)', analytics.realized_revenue],
      ['Tổng số đơn', analytics.total_orders],
      ['Đơn hoàn tất tính doanh thu', analytics.realized_orders],
      ['Đơn bị hủy', analytics.cancelled_orders],
      ['Giá trị trung bình / đơn (đ)', Math.round(analytics.avg_realized_order_value || 0)],
      [],
      ['Kỳ', 'Số đơn', 'Doanh thu (đ)'],
      ...analytics.series.map((s) => [s.bucket, s.orders, s.revenue]),
      [],
      ['Danh mục', 'Số lượng', 'Doanh số (đ)'],
      ...analytics.by_category_excluding_cancelled.map((c) => [c.category, c.quantity, c.revenue]),
      [],
      ['Sản phẩm bán chạy', 'Đã bán', 'Doanh số (đ)'],
      ...analytics.top_products_excluding_cancelled.map((p) => [p.name, p.quantity_sold, p.revenue]),
    ];
    downloadCsv(`shoppc-tong-quan-${analytics.range.from}_${analytics.range.to}.csv`, rows);
  };

  const exportPdf = () => {
    setExportOpen(false);
    window.setTimeout(() => window.print(), 50); // hộp thoại in → "Lưu dưới dạng PDF"
  };

  return (
    <div className="space-y-6">
      {/* Tiêu đề + bộ chọn kỳ */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Tổng quan hoạt động kinh doanh</h1>
            <span className="frost-chip border-blue-200 bg-blue-50 text-blue-700">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-600" /> Arctic Frost
            </span>
          </div>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
            <ArrowPathIcon className={`h-4 w-4 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
            {updatedAt ? `Cập nhật lúc ${updatedAt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}` : 'Đang cập nhật'} · Tự đồng bộ khi có đơn
            mới
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2" data-print-hide>
          <div className="flex rounded-xl border border-slate-200 bg-white p-1" role="group" aria-label="Khoảng thời gian">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => setPeriod(p.key)}
                aria-pressed={period === p.key}
                className={`flex items-center gap-1 rounded-lg px-3 py-1.5 font-mono text-xs transition ${
                  period === p.key ? 'bg-blue-600 font-semibold text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {p.label}
                {p.key === 'custom' && <CalendarDaysIcon className="h-3.5 w-3.5" />}
              </button>
            ))}
          </div>
          {period === 'custom' && (
            <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2 py-1 text-xs">
              <input type="date" value={custom.from} max={custom.to} onChange={(e) => e.target.value && setCustom((c) => ({ ...c, from: e.target.value }))} aria-label="Từ ngày" className="bg-transparent p-1 outline-none" />
              <span className="text-slate-400">→</span>
              <input type="date" value={custom.to} min={custom.from} onChange={(e) => e.target.value && setCustom((c) => ({ ...c, to: e.target.value }))} aria-label="Đến ngày" className="bg-transparent p-1 outline-none" />
            </div>
          )}
          <div ref={exportRef} className="relative">
            <button
              type="button"
              onClick={() => setExportOpen((v) => !v)}
              disabled={!analytics}
              aria-expanded={exportOpen}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-xs font-semibold text-slate-700 hover:border-blue-300 hover:text-blue-600 disabled:opacity-50"
            >
              <ArrowDownTrayIcon className="h-4 w-4" /> Xuất Excel / PDF
            </button>
            {exportOpen && (
              <div className="absolute right-0 z-20 mt-2 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                <button onClick={exportCsv} className="block w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50">
                  Excel (.csv)
                </button>
                <button onClick={exportPdf} className="block w-full border-t border-slate-200 px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50">
                  PDF (in trang này)
                </button>
              </div>
            )}
          </div>
          <button
            onClick={() => void load(true)}
            disabled={refreshing}
            aria-label="Làm mới"
            title="Làm mới"
            className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:border-blue-300 hover:text-blue-600 disabled:opacity-50"
          >
            <ArrowPathIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {(error || analyticsError) && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error ? `Không làm mới được dữ liệu: ${error}. Đang hiển thị số liệu lần tải trước.` : `Không tải được thống kê theo kỳ: ${analyticsError}`}
        </div>
      )}

      {/* Chỉ số chính */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label={`Doanh thu · ${analytics?.range.label || 'tất cả'}`}
          value={formatPrice(revenue)}
          icon={BanknotesIcon}
          delta={analytics && previous ? pctChange(analytics.realized_revenue, previous.realized_revenue) : null}
          deltaLabel={previous ? `so với ${previous.range.label.toLowerCase()} (${formatPrice(previous.realized_revenue)})` : 'Đơn đã giao / hoàn tất'}
        />
        <KpiCard
          label="Tổng số đơn hàng"
          value={formatNumber(orders)}
          unit="đơn"
          icon={ShoppingCartIcon}
          tone="cyan"
          to="/admin/orders"
          delta={analytics && previous ? pctChange(analytics.total_orders, previous.total_orders) : null}
          deltaLabel={`${formatNumber(stats.todayOrders)} đơn hôm nay · ${formatPrice(stats.todaySales)}`}
        />
        <KpiCard
          label="Đơn chờ xử lý"
          value={formatNumber(stats.pendingOrders)}
          unit="đơn"
          icon={ClockIcon}
          tone="purple"
          to="/admin/orders?status=pending"
          footer={
            <span className="rounded-md bg-blue-50 px-1.5 py-0.5 font-mono text-[11px] text-blue-700">
              {stats.pendingOrders > 0 ? 'Cần xử lý ngay' : 'Không có đơn tồn đọng'}
              {stats.paymentClaims > 0 ? ` · ${stats.paymentClaims} báo đã CK` : ''}
            </span>
          }
        />
        <KpiCard
          label="Cảnh báo tồn kho thấp"
          value={formatNumber(stats.lowStockProducts)}
          unit="sản phẩm"
          icon={ExclamationTriangleIcon}
          tone="red"
          to="/admin/products?stock=low"
          footer={
            lowNames.length ? (
              <span className="flex flex-wrap gap-1">
                {lowNames.map((p) => (
                  <span key={p.id} className="max-w-[9rem] truncate rounded-md bg-red-50 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-red-600">
                    {p.name}: {p.stock}
                  </span>
                ))}
              </span>
            ) : (
              'Tồn kho ≤ 10 · đang ổn'
            )
          }
        />
      </div>

      <AiInsights />

      {/* Biểu đồ */}
      {analytics && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <RevenueTrend data={analytics} />
          </div>
          <RevenueMix data={analytics} />
        </div>
      )}

      {/* Đơn hàng + bán chạy */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <RecentOrders
            orders={stats.recentOrders}
            pending={stats.pendingOrders}
            onViewAll={() => navigate('/admin/orders')}
            onViewOrder={(id) => navigate(`/admin/orders?open=${id}`)}
          />
          <LowStockList items={stats.lowStockList} total={stats.lowStockProducts} />
        </div>
        <TopProducts
          products={analytics?.top_products_excluding_cancelled ?? stats.topProducts}
          catalog={catalog}
          periodLabel={analytics?.range.label.toLowerCase() || '30 ngày gần nhất'}
        />
      </div>

      <p className="text-center font-mono text-[11px] text-slate-400">
        Tổng {formatNumber(stats.totalProducts)} sản phẩm đang bán · Doanh thu tính trên đơn đã giao / hoàn tất, không gồm đơn hủy.
      </p>
    </div>
  );
};

export default DashboardPage;
