/**
 * Vòng đời đơn hàng — khớp với backend (shoppc-be/src/config/orderStatus.js).
 *
 *   pending ─► processing ─► shipped ─► delivered ─► completed
 *      └──────────┴────────────┴──► cancelled (hủy => backend hoàn lại tồn kho)
 *
 * Quyền chuyển trạng thái luôn do backend kiểm tra; ở đây chỉ để hiển thị đúng nút cho người dùng.
 */
export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'completed' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid';
export type PaymentMethod = 'cod' | 'banking';

export const ORDER_STATUSES: OrderStatus[] = ['pending', 'processing', 'shipped', 'delivered', 'completed', 'cancelled'];

export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Chờ xử lý',
  processing: 'Đang xử lý',
  shipped: 'Đang giao',
  delivered: 'Đã giao',
  completed: 'Hoàn tất',
  cancelled: 'Đã hủy',
};

// Khai báo đầy đủ tên class (không ghép chuỗi) để Tailwind nhận diện được
export const STATUS_BADGE: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-teal-100 text-teal-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered', 'cancelled'],
  delivered: ['completed'],
  completed: [],
  cancelled: [],
};

/** Bước tiếp theo "bình thường" của đơn (nút chính). Đơn đã hoàn tất/hủy thì không có. */
export const NEXT_STEP: Partial<Record<OrderStatus, { to: OrderStatus; label: string }>> = {
  pending: { to: 'processing', label: 'Xử lý đơn' },
  processing: { to: 'shipped', label: 'Giao hàng' },
  shipped: { to: 'delivered', label: 'Đã giao' },
  delivered: { to: 'completed', label: 'Hoàn tất' },
};

export const isOrderStatus = (v: unknown): v is OrderStatus =>
  typeof v === 'string' && (ORDER_STATUSES as string[]).includes(v);

export const statusLabel = (s: unknown): string => (isOrderStatus(s) ? STATUS_LABELS[s] : String(s ?? ''));
export const statusBadge = (s: unknown): string => (isOrderStatus(s) ? STATUS_BADGE[s] : 'bg-gray-100 text-gray-800');

export const canTransition = (from: OrderStatus, to: OrderStatus): boolean =>
  isOrderStatus(from) && TRANSITIONS[from].includes(to);

export const canCancel = (status: OrderStatus): boolean => canTransition(status, 'cancelled');

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cod: 'Thanh toán khi nhận hàng (COD)',
  banking: 'Chuyển khoản ngân hàng',
};
export const paymentMethodLabel = (m: string): string => PAYMENT_METHOD_LABELS[m] || m;

export const PAYMENT_STATUS_LABELS: Record<string, string> = { pending: 'Chưa thanh toán', paid: 'Đã thanh toán' };
export const paymentStatusLabel = (s: string): string => PAYMENT_STATUS_LABELS[s] || s;
export const paymentBadge = (s: string): string => (s === 'paid' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800');
