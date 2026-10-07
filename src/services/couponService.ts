import api, { apiErrorMessage } from './api';
import { Coupon, ApiResponse } from '../types';

const wrap = async <T>(fn: () => Promise<T>, fallback: string): Promise<T> => {
  try {
    return await fn();
  } catch (error: any) {
    throw new Error(apiErrorMessage(error, fallback));
  }
};

export type CouponInput = Omit<Coupon, 'id' | 'used_count' | 'created_at' | 'updated_at'>;

export const couponService = {
  getCoupons: (search = ''): Promise<Coupon[]> =>
    wrap(async () => (await api.get<ApiResponse<Coupon[]>>('/coupons', { params: search ? { search } : {} })).data.data, 'Không thể tải danh sách mã giảm giá'),

  createCoupon: (data: CouponInput): Promise<Coupon> =>
    wrap(async () => (await api.post<ApiResponse<Coupon>>('/coupons', data)).data.data, 'Không thể tạo mã giảm giá'),

  updateCoupon: (id: number, data: Partial<CouponInput>): Promise<Coupon> =>
    wrap(async () => (await api.put<ApiResponse<Coupon>>(`/coupons/${id}`, data)).data.data, 'Không thể cập nhật mã giảm giá'),

  deleteCoupon: (id: number): Promise<void> =>
    wrap(async () => {
      await api.delete(`/coupons/${id}`);
    }, 'Không thể xóa mã giảm giá'),
};
