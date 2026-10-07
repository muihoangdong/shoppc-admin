/**
 * Vai trò (khớp với backend: shoppc-be/src/config/roles.js).
 *   customer  Khách hàng      — chỉ dùng storefront, KHÔNG vào được trang quản trị
 *   staff     Nhân viên       — sản phẩm/danh mục (tạo, sửa), tồn kho, đơn hàng, thống kê, chatbot
 *   admin     Quản trị viên   — toàn quyền: gồm xóa sản phẩm/danh mục và quản lý tài khoản
 * Quyền thật sự luôn được backend kiểm tra; các hàm ở đây chỉ để ẩn/hiện giao diện cho hợp lý.
 */
export type Role = 'admin' | 'staff' | 'customer';

export const ROLE_LABELS: Record<Role, string> = {
  customer: 'Khách hàng',
  staff: 'Nhân viên',
  admin: 'Quản trị viên',
};

export const ROLE_BADGE_CLASSES: Record<Role, string> = {
  customer: 'bg-gray-100 text-gray-700',
  staff: 'bg-blue-100 text-blue-800',
  admin: 'bg-purple-100 text-purple-800',
};

const RANK: Record<Role, number> = { customer: 0, staff: 1, admin: 2 };

export const isRole = (role: unknown): role is Role =>
  typeof role === 'string' && Object.prototype.hasOwnProperty.call(RANK, role);

export const hasRole = (role: unknown, min: Role): boolean => isRole(role) && RANK[role] >= RANK[min];

export const roleLabel = (role: unknown): string => (isRole(role) ? ROLE_LABELS[role] : 'Không xác định');

/** Vào được trang quản trị (nhân viên hoặc admin). */
export const canAccessAdmin = (role: unknown): boolean => hasRole(role, 'staff');
/** Xóa sản phẩm / danh mục. */
export const canDeleteCatalog = (role: unknown): boolean => hasRole(role, 'admin');
/** Quản lý tài khoản người dùng. */
export const canManageUsers = (role: unknown): boolean => hasRole(role, 'admin');
/** Tạo / sửa / xóa mã giảm giá (nhân viên chỉ xem). */
export const canManageCoupons = (role: unknown): boolean => hasRole(role, 'admin');
/** Xóa hẳn đánh giá của khách (nhân viên chỉ ẩn/hiện và trả lời). */
export const canDeleteReviews = (role: unknown): boolean => hasRole(role, 'admin');
