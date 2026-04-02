import React, { useEffect, useState, useCallback } from 'react';
import { Order, OrderItem } from '../types';
import { orderService } from '../services/orderService';
import { formatPrice, formatDate } from '../utils/formatters';
import { 
  EyeIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  TruckIcon, 
  XMarkIcon, 
  ClockIcon,
  FunnelIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/Common/LoadingSpinner';

const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedOrderItems, setSelectedOrderItems] = useState<OrderItem[]>([]);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const data = await orderService.getOrders();
      setOrders(data);
      setFilteredOrders(data);
    } catch (error) {
      toast.error('Không thể tải danh sách đơn hàng');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Filter orders
  useEffect(() => {
    let filtered = [...orders];
    
    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(o => 
        o.order_code.toLowerCase().includes(term) ||
        o.customer_name.toLowerCase().includes(term) ||
        o.customer_phone.includes(term)
      );
    }
    
    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(o => o.status === filterStatus);
    }
    
    setFilteredOrders(filtered);
  }, [searchTerm, filterStatus, orders]);

  const handleUpdateStatus = async (id: number, status: Order['status']) => {
    if (updating) return;
    
    setUpdating(true);
    try {
      await orderService.updateOrderStatus(id, status);
      toast.success('Cập nhật trạng thái đơn hàng thành công');
      await fetchOrders();
      
      // Nếu đang xem chi tiết đơn hàng này, cập nhật lại
      if (selectedOrder && selectedOrder.id === id) {
        setSelectedOrder({ ...selectedOrder, status });
      }
    } catch (error) {
      toast.error('Không thể cập nhật trạng thái');
    } finally {
      setUpdating(false);
    }
  };

  const handleViewOrder = async (order: Order) => {
    setSelectedOrder(order);
    setIsDetailOpen(true);
    try {
      const items = await orderService.getOrderItems(order.id);
      setSelectedOrderItems(items);
    } catch (error) {
      toast.error('Không thể tải chi tiết đơn hàng');
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterStatus('all');
  };

  const statusColors: Record<Order['status'], string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    shipped: 'bg-purple-100 text-purple-800',
    delivered: 'bg-indigo-100 text-indigo-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  const statusText: Record<Order['status'], string> = {
    pending: 'Chờ xử lý',
    processing: 'Đang xử lý',
    shipped: 'Đã giao hàng',
    delivered: 'Đã nhận hàng',
    completed: 'Hoàn thành',
    cancelled: 'Đã hủy',
  };

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return <ClockIcon className="h-4 w-4" />;
      case 'processing':
        return <TruckIcon className="h-4 w-4" />;
      case 'shipped':
        return <TruckIcon className="h-4 w-4" />;
      case 'delivered':
        return <CheckCircleIcon className="h-4 w-4" />;
      case 'completed':
        return <CheckCircleIcon className="h-4 w-4" />;
      case 'cancelled':
        return <XCircleIcon className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const statusOptions = [
    { value: 'all', label: 'Tất cả' },
    { value: 'pending', label: 'Chờ xử lý' },
    { value: 'processing', label: 'Đang xử lý' },
    { value: 'shipped', label: 'Đã giao hàng' },
    { value: 'delivered', label: 'Đã nhận hàng' },
    { value: 'completed', label: 'Hoàn thành' },
    { value: 'cancelled', label: 'Đã hủy' },
  ];

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Quản lý đơn hàng</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-500 text-sm">Tổng đơn hàng</p>
          <p className="text-2xl font-bold text-gray-800">{orders.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-500 text-sm">Chờ xử lý</p>
          <p className="text-2xl font-bold text-yellow-600">
            {orders.filter(o => o.status === 'pending').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-500 text-sm">Đang xử lý</p>
          <p className="text-2xl font-bold text-blue-600">
            {orders.filter(o => o.status === 'processing').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-500 text-sm">Hoàn thành</p>
          <p className="text-2xl font-bold text-green-600">
            {orders.filter(o => o.status === 'completed').length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo mã đơn, tên khách hàng, số điện thoại..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* Status Filter */}
          <div className="sm:w-64 relative">
            <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
            >
              {statusOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          
          {/* Clear Filters Button */}
          {(searchTerm || filterStatus !== 'all') && (
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
        
        {/* Results count */}
        <div className="mt-3 text-sm text-gray-500">
          Hiển thị {filteredOrders.length} / {orders.length} đơn hàng
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã đơn</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Khách hàng</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tổng tiền</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày đặt</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="text-sm font-mono font-medium text-gray-900">{order.order_code}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{order.customer_name}</p>
                      <p className="text-xs text-gray-500">{order.customer_phone}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-red-600">{formatPrice(order.total_amount)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${statusColors[order.status]}`}>
                      {getStatusIcon(order.status)}
                      {statusText[order.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-500">{formatDate(order.created_at)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewOrder(order)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Xem chi tiết"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                      {order.status === 'pending' && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'processing')}
                          disabled={updating}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition disabled:opacity-50"
                          title="Xác nhận đơn hàng"
                        >
                          <CheckCircleIcon className="h-5 w-5" />
                        </button>
                      )}
                      {order.status === 'processing' && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'completed')}
                          disabled={updating}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition disabled:opacity-50"
                          title="Hoàn thành"
                        >
                          <TruckIcon className="h-5 w-5" />
                        </button>
                      )}
                      {(order.status === 'pending' || order.status === 'processing') && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'cancelled')}
                          disabled={updating}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                          title="Hủy đơn hàng"
                        >
                          <XCircleIcon className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Không tìm thấy đơn hàng nào</p>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {isDetailOpen && selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          items={selectedOrderItems}
          onClose={() => {
            setIsDetailOpen(false);
            setSelectedOrder(null);
            setSelectedOrderItems([]);
          }}
          onUpdateStatus={handleUpdateStatus}
          statusColors={statusColors}
          statusText={statusText}
          getStatusIcon={getStatusIcon}
        />
      )}
    </div>
  );
};

// Order Detail Modal Component
interface OrderDetailModalProps {
  order: Order;
  items: OrderItem[];
  onClose: () => void;
  onUpdateStatus: (id: number, status: Order['status']) => Promise<void>;
  statusColors: Record<Order['status'], string>;
  statusText: Record<Order['status'], string>;
  getStatusIcon: (status: Order['status']) => React.ReactNode;
}

const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  order,
  items,
  onClose,
  onUpdateStatus,
  statusColors,
  statusText,
  getStatusIcon,
}) => {
  const [updating, setUpdating] = useState(false);

  const handleStatusUpdate = async (status: Order['status']) => {
    if (updating) return;
    setUpdating(true);
    await onUpdateStatus(order.id, status);
    setUpdating(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Chi tiết đơn hàng</h2>
            <p className="text-sm text-gray-500 mt-1">Mã đơn: {order.order_code}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status Actions */}
          <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium text-gray-700 mr-2">Cập nhật trạng thái:</span>
            {(['pending', 'processing', 'completed', 'cancelled'] as Order['status'][]).map((status) => (
              <button
                key={status}
                onClick={() => handleStatusUpdate(status)}
                disabled={order.status === status || updating}
                className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-full transition ${
                  order.status === status
                    ? statusColors[status]
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                } disabled:opacity-50`}
              >
                {getStatusIcon(status)}
                {statusText[status]}
              </button>
            ))}
          </div>

          {/* Customer Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-700 mb-3">Thông tin khách hàng</h3>
              <div className="space-y-2 text-sm">
                <p><span className="text-gray-500 w-24 inline-block">Họ tên:</span> {order.customer_name}</p>
                <p><span className="text-gray-500 w-24 inline-block">Email:</span> {order.customer_email}</p>
                <p><span className="text-gray-500 w-24 inline-block">Điện thoại:</span> {order.customer_phone}</p>
                <p><span className="text-gray-500 w-24 inline-block">Địa chỉ:</span> {order.customer_address}</p>
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-700 mb-3">Thông tin đơn hàng</h3>
              <div className="space-y-2 text-sm">
                <p><span className="text-gray-500 w-24 inline-block">Ngày đặt:</span> {formatDate(order.created_at)}</p>
                <p><span className="text-gray-500 w-24 inline-block">Phương thức:</span> {order.payment_method === 'cod' ? 'Thanh toán khi nhận hàng' : 'Chuyển khoản'}</p>
                <p><span className="text-gray-500 w-24 inline-block">Thanh toán:</span> 
                  <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                    order.payment_status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {order.payment_status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                  </span>
                </p>
                {order.note && <p><span className="text-gray-500 w-24 inline-block align-top">Ghi chú:</span> {order.note}</p>}
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div>
            <h3 className="font-semibold text-gray-700 mb-3">Sản phẩm đã đặt</h3>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Sản phẩm</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Đơn giá</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Số lượng</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Thành tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {item.product_image && (
                            <img 
                              src={item.product_image} 
                              alt={item.product_name} 
                              className="w-10 h-10 object-cover rounded border"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          )}
                          <span className="text-sm font-medium text-gray-900">{item.product_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-sm">{formatPrice(item.price)}</td>
                      <td className="px-4 py-3 text-center text-sm">x{item.quantity}</td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-red-600">
                        {formatPrice(item.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t">
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-right font-semibold">Tổng cộng:</td>
                    <td className="px-4 py-3 text-right font-bold text-red-600 text-lg">
                      {formatPrice(order.total_amount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrdersPage;