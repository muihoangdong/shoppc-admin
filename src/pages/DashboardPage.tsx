import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowPathIcon,
  BanknotesIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ShoppingBagIcon,
} from '@heroicons/react/24/outline';
import { dashboardService } from '../services/dashboardService';
import { DashboardStats } from '../types';
import { StatsCard } from '../components/Dashboard/StatsCard';
import { RecentOrders } from '../components/Dashboard/RecentOrders';
import { TopProducts } from '../components/Dashboard/TopProducts';
import { LowStockList } from '../components/Dashboard/LowStockList';
import { RevenueChart } from '../components/Charts/RevenueChart';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import ErrorMessage from '../components/Common/ErrorMessage';
import usePageTitle from '../hooks/usePageTitle';
import useDebouncedCallback from '../hooks/useDebouncedCallback';
import { useRealtime } from '../contexts/RealtimeContext';
import { AiInsights } from '../components/Dashboard/AiInsights';
import { formatNumber, formatPrice } from '../utils/formatters';

const DashboardPage: React.FC = () => {
  usePageTitle('Tổng quan');
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError('');
      setStats(await dashboardService.getStats());
      setUpdatedAt(new Date());
    } catch (err: any) {
      setError(err.message || 'Không thể tải số liệu tổng quan');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Realtime: số liệu đổi (đơn mới, đổi trạng thái, tồn kho...) → làm mới ngầm, không nháy màn hình
  const refreshSoon = useDebouncedCallback(() => void load(true), 1000);
  useRealtime('stats:dirty', refreshSoon);
  useRealtime('resync', refreshSoon);

  if (loading) return <LoadingSpinner />;
  // Lỗi mà chưa có dữ liệu cũ: báo rõ + cho thử lại (trước đây chỉ hiện toàn số 0 một cách đánh lừa)
  if (!stats) return <ErrorMessage message={error || 'Không có dữ liệu'} onRetry={() => void load()} />;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Tổng quan</h1>
          {updatedAt && (
            <p className="text-xs text-gray-400">Cập nhật lúc {updatedAt.toLocaleTimeString('vi-VN')}</p>
          )}
        </div>
        <button
          onClick={() => void load(true)}
          disabled={refreshing}
          className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          <ArrowPathIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      {error && (
        <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Không làm mới được dữ liệu: {error}. Đang hiển thị số liệu lần tải trước.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard title="Doanh thu" value={formatPrice(stats.totalRevenue)} icon={BanknotesIcon} color="green" hint="Đơn đã giao / hoàn tất" />
        <StatsCard title="Tổng đơn hàng" value={formatNumber(stats.totalOrders)} icon={ShoppingBagIcon} color="blue" to="/admin/orders" />
        <StatsCard
          title="Chờ xử lý"
          value={formatNumber(stats.pendingOrders)}
          icon={ClockIcon}
          color="yellow"
          to="/admin/orders?status=pending"
          hint={stats.pendingOrders > 0 ? 'Cần xử lý ngay' : 'Không có đơn tồn đọng'}
        />
        <StatsCard
          title="Sắp hết hàng"
          value={formatNumber(stats.lowStockProducts)}
          icon={ExclamationTriangleIcon}
          color="red"
          to="/admin/products?stock=low"
          hint="Tồn kho từ 10 trở xuống"
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 rounded-lg bg-white p-4 text-sm shadow sm:grid-cols-3">
        <div>
          <span className="text-gray-500">Đơn mới hôm nay: </span>
          <strong data-testid="today-orders">{formatNumber(stats.todayOrders)}</strong>
        </div>
        <div>
          <span className="text-gray-500">Doanh số hôm nay: </span>
          <strong>{formatPrice(stats.todaySales)}</strong>
          <span className="text-xs text-gray-400"> (chưa gồm đơn hủy)</span>
        </div>
        <div>
          <span className="text-gray-500">Tổng sản phẩm: </span>
          <strong>{formatNumber(stats.totalProducts)}</strong>
        </div>
      </div>

      <AiInsights />

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RevenueChart data={stats.monthlyRevenue} />
        </div>
        <TopProducts products={stats.topProducts} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentOrders
            orders={stats.recentOrders}
            onViewAll={() => navigate('/admin/orders')}
            onViewOrder={(id) => navigate(`/admin/orders?open=${id}`)}
          />
        </div>
        <LowStockList items={stats.lowStockList} total={stats.lowStockProducts} />
      </div>
    </div>
  );
};

export default DashboardPage;
