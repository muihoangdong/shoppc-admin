import api from './api';
import { ApiResponse, Order, OrderItem } from '../types';

export const orderService = {
  async getOrders(params?: { status?: string; payment_status?: string }): Promise<Order[]> {
    const response = await api.get<ApiResponse<Order[]>>('/orders', { params });
    return response.data.data;
  },

  async getOrderById(id: number): Promise<Order> {
    const orders = await this.getOrders();
    const order = orders.find((item) => item.id === id);
    if (!order) throw new Error('Không tìm thấy đơn hàng');
    return order;
  },

  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    const response = await api.get<ApiResponse<OrderItem[]>>(`/orders/${orderId}/items`);
    return response.data.data;
  },

  async updateOrderStatus(id: number, status: Order['status'], note?: string): Promise<Order> {
    const response = await api.patch<ApiResponse<Order>>(`/orders/${id}/status`, { status, note });
    return response.data.data;
  },
};
