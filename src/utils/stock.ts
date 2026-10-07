/** Ngưỡng "sắp hết hàng": khớp với backend (thống kê và chuông thông báo đếm tồn kho <= 10). */
export const LOW_STOCK_THRESHOLD = 10;

export type StockLevel = 'out' | 'low' | 'ok';

export const stockLevel = (stock: number): StockLevel =>
  stock <= 0 ? 'out' : stock <= LOW_STOCK_THRESHOLD ? 'low' : 'ok';

export const STOCK_BADGE: Record<StockLevel, string> = {
  out: 'bg-red-100 text-red-800',
  low: 'bg-orange-100 text-orange-800',
  ok: 'bg-green-100 text-green-800',
};

export const STOCK_LABEL: Record<StockLevel, string> = {
  out: 'Hết hàng',
  low: 'Sắp hết',
  ok: 'Còn hàng',
};
