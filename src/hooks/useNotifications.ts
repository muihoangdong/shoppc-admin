import { useCallback, useEffect, useState } from 'react';
import { dashboardService } from '../services/dashboardService';

/**
 * Số việc cần chú ý cho chuông thông báo: đơn chờ xử lý + sản phẩm sắp hết hàng + khách báo đã chuyển khoản.
 * Tự làm mới mỗi phút (khi tab đang hiển thị), khi quay lại tab, và khi `refreshKey` đổi (sau khi chatbot sửa dữ liệu).
 */
export default function useNotifications(refreshKey = 0, intervalMs = 60000) {
  const [counts, setCounts] = useState({ pendingOrders: 0, lowStock: 0, paymentClaims: 0 });

  const load = useCallback(async () => {
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
    try {
      const stats = await dashboardService.getStats();
      setCounts({ pendingOrders: stats.pendingOrders, lowStock: stats.lowStockProducts, paymentClaims: stats.paymentClaims || 0 });
    } catch {
      // Im lặng: chuông thông báo không quan trọng bằng nội dung trang; lần sau sẽ thử lại
    }
  }, []);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), intervalMs);
    const onFocus = () => void load();
    window.addEventListener('focus', onFocus);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', onFocus);
    };
  }, [load, intervalMs, refreshKey]);

  return { ...counts, total: counts.pendingOrders + counts.lowStock + counts.paymentClaims, refresh: load };
}
