export interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'staff';
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
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  name: string;
  type: 'pc' | 'component' | 'peripheral';
  parent_id: number | null;
  parent_name?: string;
  children?: Category[];
  created_at: string;
  updated_at: string;
}

// ✅ CHỈ GIỮ LẠI MỘT KHAI BÁO DUY NHẤT - XÓA CÁI CŨ
export interface Order {
  id: number;
  order_code: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  total_amount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'completed' | 'cancelled';  // 6 trạng thái
  payment_method: 'cod' | 'banking';
  payment_status: 'pending' | 'paid';
  note?: string;
  created_at: string;
  updated_at: string;
}

// ✅ Thêm OrderItem nếu chưa có
export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  product_name: string;
  product_image?: string;
  quantity: number;
  price: number;
  total: number;
  created_at?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data: T;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  lowStockProducts: number;
  pendingOrders: number;
  monthlyRevenue: {
    month: string;
    revenue: number;
  }[];
}