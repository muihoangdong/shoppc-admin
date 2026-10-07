import type { OrderStatus, PaymentMethod, PaymentStatus } from '../utils/orderStatus';

export interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'staff' | 'customer';
  full_name: string;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  category_id: number;
  category_name?: string;
  image_url?: string;
  specs: Record<string, any>;
  /** Build PC: loại linh kiện (cpu, mainboard, ram...) và thông số kiểm tra tương thích */
  part_type?: string | null;
  build_specs?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  name: string;
  type: 'pc' | 'component' | 'peripheral';
  parent_id: number | null;
  parent_name?: string;
  product_count?: number;
  children?: Category[];
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: number;
  order_code: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  customer_ward?: string | null;
  customer_district?: string | null;
  customer_city?: string | null;
  subtotal?: number;
  discount?: number;
  coupon_code?: string | null;
  shipping_fee?: number;
  total_amount: number;
  status: OrderStatus;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  /** Lúc khách bấm "Tôi đã chuyển khoản" (null khi chưa báo hoặc cửa hàng báo chưa nhận được tiền) */
  payment_claimed_at?: string | null;
  note?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number | null;
  product_name: string;
  product_image?: string;
  quantity: number;
  price: number;
  total: number;
  created_at?: string;
}

export interface OrderHistoryEntry {
  id: number;
  old_status: OrderStatus | null;
  new_status: OrderStatus;
  note?: string | null;
  created_at: string;
  changed_by?: number | null;
  changed_by_name?: string | null;
}

export interface OrderDetail extends Order {
  items: OrderItem[];
  history: OrderHistoryEntry[];
}

export type StatusCounts = Record<OrderStatus | 'all', number>;

export interface OrderPage {
  orders: Order[];
  meta: { total: number; page: number; limit: number; pages: number; counts: StatusCounts };
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data: T;
  meta?: any;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface TopProduct {
  product_id: number | null;
  name: string;
  quantity_sold: number;
  revenue: number;
}

export interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  lowStockProducts: number;
  pendingOrders: number;
  /** Đơn khách báo đã chuyển khoản, cửa hàng chưa xác nhận */
  paymentClaims: number;
  todayOrders: number;
  todaySales: number;
  monthlyRevenue: { month: string; revenue: number }[];
  topProducts: TopProduct[];
  lowStockList: { id: number; name: string; stock: number }[];
  recentOrders: Pick<Order, 'id' | 'order_code' | 'customer_name' | 'total_amount' | 'status' | 'created_at'>[];
}

export type AnalyticsPeriod = 'today' | '7d' | '30d' | 'this_month' | 'last_month' | 'this_year';

export interface Analytics {
  range: { from: string; to: string; label: string };
  granularity: 'day' | 'month';
  total_orders: number;
  cancelled_orders: number;
  realized_revenue: number;
  realized_orders: number;
  avg_realized_order_value: number;
  series: { bucket: string; orders: number; revenue: number }[];
  by_status: { status: OrderStatus; label: string; orders: number; amount: number }[];
  by_payment_method_excluding_cancelled: { payment_method: string; orders: number; amount: number }[];
  by_category_excluding_cancelled: { category: string; quantity: number; revenue: number }[];
  top_products_excluding_cancelled: TopProduct[];
}

// ───────── Chat hỗ trợ khách hàng ─────────
export type SenderType = 'customer' | 'staff' | 'ai' | 'system';

export interface SupportMessage {
  id: number;
  conversation_id: number;
  sender_type: SenderType;
  sender_name: string | null;
  content: string;
  created_at: string;
}

export interface SupportConversation {
  id: number;
  visitor_id: string;
  user_id: number | null;
  customer_name: string | null;
  customer_phone: string | null;
  status: 'open' | 'closed';
  assigned_to: number | null;
  ai_enabled: boolean;
  needs_human: boolean;
  unread_staff: number;
  unread_customer: number;
  last_message_at: string | null;
  last_message_preview: string | null;
  created_at: string;
}

// ==================== MÃ GIẢM GIÁ ====================
export type CouponType = 'percentage' | 'fixed';
export interface Coupon {
  id: number;
  code: string;
  description: string | null;
  type: CouponType;
  value: number;
  min_order_value: number;
  /** Chỉ dùng cho loại %: giảm tối đa bao nhiêu tiền. null = không giới hạn. */
  max_discount: number | null;
  /** null = không giới hạn số lượt */
  usage_limit: number | null;
  used_count: number;
  once_per_customer: boolean;
  /** 'YYYY-MM-DD' hoặc null */
  starts_on: string | null;
  expires_on: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ==================== ĐÁNH GIÁ SẢN PHẨM ====================
export type ReviewStatus = 'visible' | 'hidden';
export interface AdminReview {
  id: number;
  product_id: number;
  product_name: string;
  product_image: string | null;
  user_id: number;
  customer_name: string;
  customer_email: string;
  order_id: number | null;
  rating: number;
  comment: string | null;
  status: ReviewStatus;
  admin_reply: string | null;
  replied_at: string | null;
  created_at: string;
  updated_at: string;
}
export interface ReviewListMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
  counts: { all: number; visible: number; hidden: number };
}
