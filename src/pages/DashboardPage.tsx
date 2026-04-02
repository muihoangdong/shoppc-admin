import React, { useEffect, useState } from 'react';
import { StatsCard } from '../components/Dashboard/StatsCard';
import { RevenueChart } from '../components/Charts/RevenueChart';
import { RecentOrders } from '../components/Dashboard/RecentOrders';
import {
  ShoppingBagIcon,
  CubeIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import { formatPrice } from '../utils/formatters';
import { dashboardService } from '../services/dashboardService';
import { orderService } from '../services/orderService';
import { Order } from '../types';

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    lowStockProducts: 0,
    pendingOrders: 0,
    monthlyRevenue: [] as { month: string; revenue: number }[],
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [statsData, ordersData] = await Promise.all([
          dashboardService.getStats(),
          orderService.getOrders(),
        ]);
        setStats(statsData);
        setRecentOrders(ordersData.slice(0, 5));
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Tổng quan</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Tổng sản phẩm"
          value={stats.totalProducts}
          icon={CubeIcon}
          color="blue"
        />
        <StatsCard
          title="Tổng đơn hàng"
          value={stats.totalOrders}
          icon={ShoppingBagIcon}
          color="green"
        />
        <StatsCard
          title="Doanh thu"
          value={formatPrice(stats.totalRevenue)}
          icon={CurrencyDollarIcon}
          color="purple"
        />
        <StatsCard
          title="Sắp hết hàng"
          value={stats.lowStockProducts}
          icon={ExclamationTriangleIcon}
          color="red"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <RevenueChart data={stats.monthlyRevenue} />
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Top sản phẩm bán chạy</h3>
          <div className="space-y-4">
            {[
              { name: 'PC Gaming Cao cấp', sales: 245, maxSales: 245 },
              { name: 'RAM Corsair 16GB', sales: 189, maxSales: 245 },
              { name: 'Intel Core i9-13900K', sales: 156, maxSales: 245 },
              { name: 'NVIDIA RTX 4080', sales: 98, maxSales: 245 },
            ].map((product, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-gray-700 text-sm w-1/3">{product.name}</span>
                <div className="flex-1 mx-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${(product.sales / product.maxSales) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <span className="text-sm font-semibold text-gray-600 w-12 text-right">
                  {product.sales}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <RecentOrders orders={recentOrders} />
    </div>
  );
};

export default DashboardPage;