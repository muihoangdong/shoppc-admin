import api, { apiErrorMessage } from './api';
import { ApiResponse, Order, OrderDetail, OrderItem, OrderPage } from '../types';
import { OrderStatus, PaymentStatus } from '../utils/orderStatus';

export interface OrderFilters {
  status?: OrderStatus | '';
  payment_status?: PaymentStatus | '';
  search?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
  /** '1' = chỉ đơn khách đã báo chuyển khoản, chưa xác nhận */
  claimed?: '1' | '';
}

const clean = (params: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ''));

const wrap = async <T>(fn: () => Promise<T>, fallback: string): Promise<T> => {
  try {
    return await fn();
  } catch (error: any) {
    throw new Error(apiErrorMessage(error, fallback));
  }
};

export const orderService = {
  /** Lọc + phân trang phía server, kèm số đơn theo từng trạng thái. */
  getOrdersPage: (filters: OrderFilters): Promise<OrderPage> =>
    wrap(async () => {
      const response = await api.get<ApiResponse<Order[]>>('/orders', {
        params: clean({ page: 1, limit: 10, ...filters }),
      });
      return { orders: response.data.data, meta: response.data.meta };
    }, 'Không thể tải danh sách đơn hàng'),

  getOrderDetail: (id: number): Promise<OrderDetail> =>
    wrap(async () => (await api.get<ApiResponse<OrderDetail>>(`/orders/${id}`)).data.data, 'Không thể tải chi tiết đơn hàng'),

  getOrderItems: (orderId: number): Promise<OrderItem[]> =>
    wrap(async () => (await api.get<ApiResponse<OrderItem[]>>(`/orders/${orderId}/items`)).data.data, 'Không thể tải sản phẩm của đơn'),

  updateOrderStatus: (id: number, status: OrderStatus, note?: string): Promise<Order> =>
    wrap(
      async () => (await api.patch<ApiResponse<Order>>(`/orders/${id}/status`, { status, note })).data.data,
      'Không thể cập nhật trạng thái đơn hàng'
    ),

  updatePaymentStatus: (id: number, payment_status: PaymentStatus): Promise<Order> =>
    wrap(
      async () => (await api.patch<ApiResponse<Order>>(`/orders/${id}/payment`, { payment_status })).data.data,
      'Không thể cập nhật thanh toán'
    ),

  /** Khách báo đã chuyển khoản nhưng chưa thấy tiền về: bỏ trạng thái "đã báo", khách được báo để kiểm tra lại. */
  rejectPaymentClaim: (id: number): Promise<Order> =>
    wrap(async () => (await api.patch<ApiResponse<Order>>(`/orders/${id}/payment-claim`, {})).data.data, 'Không thể cập nhật'),
};
