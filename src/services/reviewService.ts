import api, { apiErrorMessage } from './api';
import { AdminReview, ReviewListMeta, ReviewStatus } from '../types';

const wrap = async <T>(fn: () => Promise<T>, fallback: string): Promise<T> => {
  try {
    return await fn();
  } catch (error: any) {
    throw new Error(apiErrorMessage(error, fallback));
  }
};

export interface ReviewQuery {
  page?: number;
  status?: ReviewStatus | '';
  rating?: number | '';
  search?: string;
}

export const reviewService = {
  getReviews: (q: ReviewQuery): Promise<{ items: AdminReview[]; meta: ReviewListMeta }> =>
    wrap(async () => {
      const params = Object.fromEntries(Object.entries(q).filter(([, v]) => v !== '' && v !== undefined));
      const res = await api.get<{ data: AdminReview[]; meta: ReviewListMeta }>('/reviews', { params });
      return { items: res.data.data, meta: res.data.meta };
    }, 'Không thể tải danh sách đánh giá'),

  updateReview: (id: number, data: { status?: ReviewStatus; admin_reply?: string | null }): Promise<AdminReview> =>
    wrap(async () => (await api.patch<{ data: AdminReview }>(`/reviews/${id}`, data)).data.data, 'Không thể cập nhật đánh giá'),

  deleteReview: (id: number): Promise<void> =>
    wrap(async () => {
      await api.delete(`/reviews/${id}`);
    }, 'Không thể xóa đánh giá'),
};
