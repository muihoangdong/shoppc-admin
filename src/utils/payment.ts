import type { Order } from '../types';

/** Khách đã bấm "Tôi đã chuyển khoản" nhưng cửa hàng chưa xác nhận đã nhận tiền */
export const isPaymentClaimed = (o: Pick<Order, 'payment_claimed_at' | 'payment_status' | 'status'>): boolean =>
  !!o.payment_claimed_at && o.payment_status !== 'paid' && o.status !== 'cancelled';
