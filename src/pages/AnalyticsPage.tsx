import React, { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import {
  ArrowTrendingUpIcon,
  BanknotesIcon,
  ChartBarIcon,
  CubeIcon,
  ShoppingCartIcon,
} from '@heroicons/react/24/outline';
import { categoryService } from '../services/categoryService';
import { dashboardService } from '../services/dashboardService';
import { orderService } from '../services/orderService';
import { productService } from '../services/productService';
import { Category, DashboardStats, Order, Product } from '../types';
import { formatPrice } from '../utils/formatters';
import LoadingSpinner from '../components/Common/LoadingSpinner';

const COLORS = ['#2563eb', '#8b5cf6', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4'];

const StatCard: React.FC<{
  title: string;
  value: string;
  sub: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}> = ({ title, value, sub, icon: Icon }) => (
  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm text-slate-500">{title}</p>
        <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
        <p className="mt-2 text-sm text-emerald-600">{sub}</p>
      </div>
      <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
        <Icon className="h-6 w-6" />
      </div>
    </div>
  </div>
);

const AnalyticsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, ordersData, productsData, categoriesData] = await Promise.all([
          dashboardService.getStats(),
          orderService.getOrders(),
          productService.getProducts(),
          categoryService.getCategories(),
        ]);
        setStats(statsData);
        setOrders(ordersData);
        setProducts(productsData);
        setCategories(categoriesData);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const revenueData = useMemo(() => {
    const monthlyMap = new Map<string, { month: string; revenue: number; orders: number }>();
    orders.forEach((order) => {
      const date = new Date(order.created_at);
      if (Number.isNaN(date.getTime())) return;
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const current = monthlyMap.get(monthKey) || { month: monthKey, revenue: 0, orders: 0 };
      current.revenue += Number(order.total_amount || 0);
      current.orders += 1;
      monthlyMap.set(monthKey, current);
    });
    return Array.from(monthlyMap.values())
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6)
      .map((item) => ({
        ...item,
        month: item.month.slice(5),
      }));
  }, [orders]);

  const categoryData = useMemo(() => {
    const counts = new Map<number, number>();
    products.forEach((product) => {
      counts.set(product.category_id, (counts.get(product.category_id) || 0) + 1);
    });

    return categories
      .map((category) => ({
        name: category.name,
        value: counts.get(category.id) || 0,
      }))
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [categories, products]);

  const paymentData = useMemo(() => {
    const map = new Map<string, { method: string; orders: number; revenue: number }>();
    orders.forEach((order) => {
      const key = order.payment_method;
      const current = map.get(key) || { method: key.toUpperCase(), orders: 0, revenue: 0 };
      current.orders += 1;
      current.revenue += Number(order.total_amount || 0);
      map.set(key, current);
    });
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
  }, [orders]);

  const statusData = useMemo(() => {
    const statuses: Order['status'][] = ['pending', 'processing', 'shipped', 'delivered', 'completed', 'cancelled'];
    const labels: Record<Order['status'], string> = {
      pending: 'Chờ xử lý',
      processing: 'Đang xử lý',
      shipped: 'Đang giao',
      delivered: 'Đã giao',
      completed: 'Hoàn tất',
      cancelled: 'Đã hủy',
    };

    return statuses.map((status) => ({
      name: labels[status],
      value: orders.filter((order) => order.status === status).length,
    }));
  }, [orders]);

  const topProducts = useMemo(() => {
    return [...products]
      .sort((a, b) => Number(a.stock) - Number(b.stock))
      .slice(0, 5)
      .map((product) => ({
        name: product.name,
        stock: product.stock,
        price: product.price,
        category: categories.find((category) => category.id === product.category_id)?.name || 'Khác',
      }));
  }, [products, categories]);

  const avgOrder = stats && stats.totalOrders > 0 ? stats.totalRevenue / stats.totalOrders : 0;

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 p-6 text-white shadow-lg">
        <p className="text-sm uppercase tracking-[0.22em] text-blue-200">Dữ liệu thực từ database</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Thống kê kinh doanh</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-200">
          Trang này đang lấy dữ liệu trực tiếp từ bảng sản phẩm, danh mục và đơn hàng. Không dùng mock data hay số liệu giả lập.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Doanh thu" value={formatPrice(stats?.totalRevenue || 0)} sub="Tính từ đơn delivered/completed" icon={BanknotesIcon} />
        <StatCard title="Tổng đơn hàng" value={String(stats?.totalOrders || 0)} sub="Lấy từ bảng orders" icon={ShoppingCartIcon} />
        <StatCard title="Giá trị đơn trung bình" value={formatPrice(avgOrder)} sub="Doanh thu / số đơn" icon={ArrowTrendingUpIcon} />
        <StatCard title="Tổng sản phẩm" value={String(stats?.totalProducts || 0)} sub={`${stats?.lowStockProducts || 0} sản phẩm sắp hết hàng`} icon={CubeIcon} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Doanh thu theo tháng</h2>
          <p className="mt-1 text-sm text-slate-500">Tổng hợp từ ngày tạo đơn hàng trong database.</p>
          <div className="mt-4 h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="revenueGradientReal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" />
                <YAxis stroke="#64748b" tickFormatter={(value) => `${Math.round(Number(value) / 1000000)}tr`} />
                <Tooltip formatter={(value: number, name: string) => [name === 'revenue' ? formatPrice(value) : value, name === 'revenue' ? 'Doanh thu' : 'Đơn hàng']} />
                <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={3} fill="url(#revenueGradientReal)" />
                <Bar dataKey="orders" fill="#8b5cf6" radius={[6, 6, 0, 0]} barSize={28} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Cơ cấu danh mục</h2>
            <p className="mt-1 text-sm text-slate-500">Dựa trên số lượng sản phẩm đang có theo category.</p>
            <div className="mt-4 h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={88} paddingAngle={4}>
                    {categoryData.map((entry, index) => (
                      <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Trạng thái đơn hàng</h2>
            <div className="mt-4 space-y-3">
              {statusData.map((item, index) => (
                <div key={item.name}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-slate-600">{item.name}</span>
                    <span className="font-semibold text-slate-900">{item.value}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div className="h-2 rounded-full" style={{ width: `${orders.length ? (item.value / orders.length) * 100 : 0}%`, backgroundColor: COLORS[index % COLORS.length] }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Doanh thu theo phương thức thanh toán</h2>
              <p className="text-sm text-slate-500">Tổng hợp từ payment_method của bảng orders.</p>
            </div>
            <div className="rounded-2xl bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600">Realtime từ DB</div>
          </div>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={paymentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="method" stroke="#64748b" />
                <YAxis stroke="#64748b" tickFormatter={(value) => `${Math.round(Number(value) / 1000000)}tr`} />
                <Tooltip formatter={(value: number, name: string) => [name === 'revenue' ? formatPrice(value) : value, name === 'revenue' ? 'Doanh thu' : 'Đơn hàng']} />
                <Bar dataKey="revenue" fill="#2563eb" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Sản phẩm cần chú ý</h2>
          <p className="mt-1 text-sm text-slate-500">Danh sách có tồn kho thấp nhất hiện tại.</p>
          <div className="mt-4 space-y-3">
            {topProducts.map((product, index) => (
              <div key={product.name} className="rounded-2xl border border-slate-100 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-slate-900">{index + 1}. {product.name}</p>
                    <p className="mt-1 text-sm text-slate-500">{product.category}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${product.stock <= 10 ? 'text-rose-600' : 'text-emerald-600'}`}>Tồn kho: {product.stock}</p>
                    <p className="mt-1 text-xs text-slate-500">{formatPrice(product.price)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <ChartBarIcon className="h-6 w-6 text-blue-600" />
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Ghi chú kỹ thuật</h2>
            <p className="text-sm text-slate-500">Nguồn dữ liệu sử dụng trên trang thống kê.</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">Đơn hàng và doanh thu lấy từ <span className="font-semibold text-slate-900">/api/orders</span> và <span className="font-semibold text-slate-900">/api/orders/dashboard/stats</span>.</div>
          <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">Danh mục và số lượng sản phẩm lấy từ <span className="font-semibold text-slate-900">/api/categories</span> và <span className="font-semibold text-slate-900">/api/products</span>.</div>
          <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">Không còn dữ liệu hard-code, mock array hay số liệu giả lập trong trang này.</div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
