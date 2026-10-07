import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { MagnifyingGlassIcon, EyeIcon, EyeSlashIcon, TrashIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import { AdminReview, ReviewListMeta, ReviewStatus } from '../types';
import { reviewService } from '../services/reviewService';
import { ConfirmDialog } from '../components/Common/ConfirmDialog';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import ErrorMessage from '../components/Common/ErrorMessage';
import Pagination from '../components/Common/Pagination';
import { useAuth } from '../contexts/AuthContext';
import usePageTitle from '../hooks/usePageTitle';
import useDebounce from '../hooks/useDebounce';
import useDebouncedCallback from '../hooks/useDebouncedCallback';
import { useRealtime } from '../contexts/RealtimeContext';
import { canDeleteReviews } from '../utils/roles';
import { formatDateTime } from '../utils/formatters';

const TABS: { value: ReviewStatus | ''; label: string; key: 'all' | ReviewStatus }[] = [
  { value: '', label: 'Tất cả', key: 'all' },
  { value: 'visible', label: 'Đang hiện', key: 'visible' },
  { value: 'hidden', label: 'Đã ẩn', key: 'hidden' },
];

const Stars: React.FC<{ value: number }> = ({ value }) => (
  <span className="inline-flex" role="img" aria-label={`${value} sao`}>
    {[1, 2, 3, 4, 5].map((i) => (
      <StarIcon key={i} className={`h-4 w-4 ${i <= value ? 'text-amber-400' : 'text-gray-200'}`} />
    ))}
  </span>
);

const ReviewsPage: React.FC = () => {
  usePageTitle('Đánh giá');
  const { user } = useAuth();
  const canDelete = canDeleteReviews(user?.role);
  const [items, setItems] = useState<AdminReview[]>([]);
  const [meta, setMeta] = useState<ReviewListMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState<ReviewStatus | ''>('');
  const [rating, setRating] = useState<number | ''>('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [page, setPage] = useState(1);
  const [replyFor, setReplyFor] = useState<AdminReview | null>(null);
  const [replyText, setReplyText] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminReview | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      setError('');
      const res = await reviewService.getReviews({ page, status, rating, search: debouncedSearch.trim() });
      setItems(res.items);
      setMeta(res.meta);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, status, rating, debouncedSearch]);

  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => setPage(1), [status, rating, debouncedSearch]);

  // Khách gửi / sửa đánh giá -> tự làm mới
  const refreshSoon = useDebouncedCallback(() => void load(), 500);
  useRealtime('review:changed', refreshSoon);
  useRealtime('resync', refreshSoon);

  const toggle = async (r: AdminReview) => {
    try {
      await reviewService.updateReview(r.id, { status: r.status === 'visible' ? 'hidden' : 'visible' });
      toast.success(r.status === 'visible' ? 'Đã ẩn đánh giá khỏi trang sản phẩm' : 'Đã hiện lại đánh giá');
      await load();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const openReply = (r: AdminReview) => {
    setReplyFor(r);
    setReplyText(r.admin_reply ?? '');
  };

  const saveReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyFor || saving) return;
    try {
      setSaving(true);
      await reviewService.updateReview(replyFor.id, { admin_reply: replyText.trim() || null });
      toast.success(replyText.trim() ? 'Đã gửi phản hồi' : 'Đã xóa phản hồi');
      setReplyFor(null);
      await load();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await reviewService.deleteReview(deleteTarget.id);
      toast.success('Đã xóa đánh giá');
      setDeleteTarget(null);
      await load();
    } catch (err: any) {
      toast.error(err.message);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error && !meta) return <ErrorMessage message={error} onRetry={() => { setLoading(true); void load(); }} />;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Đánh giá sản phẩm</h1>
        <p className="text-sm text-gray-500">Chỉ khách đã nhận hàng mới viết được đánh giá. Ẩn đánh giá không phù hợp hoặc trả lời để khách khác thấy.</p>
      </div>

      {error && (
        <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">Không làm mới được danh sách: {error}</div>
      )}

      <div className="rounded-lg bg-white shadow">
        <div className="flex flex-wrap items-center gap-3 border-b p-4">
          <div className="flex rounded-lg border border-gray-200 p-0.5" role="tablist">
            {TABS.map((t) => (
              <button
                key={t.key}
                role="tab"
                aria-selected={status === t.value}
                onClick={() => setStatus(t.value)}
                className={`rounded-md px-3 py-1.5 text-sm ${status === t.value ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                {t.label} ({meta?.counts[t.key] ?? 0})
              </button>
            ))}
          </div>
          <select
            value={rating}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setRating(e.target.value ? Number(e.target.value) : '')}
            aria-label="Lọc theo số sao"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Mọi số sao</option>
            {[5, 4, 3, 2, 1].map((s) => <option key={s} value={s}>{s} sao</option>)}
          </select>
          <div className="relative min-w-[220px] flex-1">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <input
              type="search"
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              placeholder="Tìm sản phẩm, tên khách, email, nội dung"
              aria-label="Tìm đánh giá"
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {items.length === 0 ? (
          <p className="py-14 text-center text-sm text-gray-500">
            {meta?.counts.all ? 'Không có đánh giá nào khớp bộ lọc.' : 'Chưa có đánh giá nào. Khách sẽ đánh giá được sau khi đơn chuyển sang "Đã giao".'}
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {items.map((r) => (
              <li key={r.id} className={`p-4 ${r.status === 'hidden' ? 'bg-gray-50' : ''}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-blue-700" title={r.product_name}>{r.product_name}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                      <Stars value={r.rating} />
                      <span className="font-medium text-gray-900">{r.customer_name}</span>
                      <span className="text-gray-500">{r.customer_email}</span>
                      <span className="text-xs text-gray-400">{formatDateTime(r.created_at)}</span>
                      {r.status === 'hidden' && <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-700">Đã ẩn</span>}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button onClick={() => openReply(r)} title="Trả lời" aria-label={`Trả lời đánh giá của ${r.customer_name}`} className="rounded p-1.5 text-blue-600 hover:bg-blue-50">
                      <ChatBubbleLeftIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => void toggle(r)}
                      title={r.status === 'visible' ? 'Ẩn khỏi trang sản phẩm' : 'Hiện lại'}
                      aria-label={r.status === 'visible' ? `Ẩn đánh giá của ${r.customer_name}` : `Hiện đánh giá của ${r.customer_name}`}
                      className="rounded p-1.5 text-gray-600 hover:bg-gray-100"
                    >
                      {r.status === 'visible' ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                    </button>
                    {canDelete && (
                      <button onClick={() => setDeleteTarget(r)} title="Xóa" aria-label={`Xóa đánh giá của ${r.customer_name}`} className="rounded p-1.5 text-red-600 hover:bg-red-50">
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>
                {r.comment ? (
                  <p className="mt-2 whitespace-pre-line break-words text-sm text-gray-700">{r.comment}</p>
                ) : (
                  <p className="mt-2 text-sm italic text-gray-400">(Chỉ chấm sao, không viết nhận xét)</p>
                )}
                {r.admin_reply && (
                  <div className="mt-2 rounded-lg border-l-4 border-blue-500 bg-blue-50 px-3 py-2 text-sm">
                    <span className="font-semibold text-blue-800">Shop đã trả lời: </span>
                    <span className="whitespace-pre-line text-gray-700">{r.admin_reply}</span>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}

        {meta && meta.pages > 1 && (
          <div className="border-t p-4">
            <Pagination page={meta.page} pages={meta.pages} total={meta.total} pageSize={meta.limit} onChange={setPage} unit="đánh giá" />
          </div>
        )}
      </div>

      {replyFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <form onSubmit={saveReply} role="dialog" aria-modal="true" aria-label="Trả lời đánh giá" className="w-full max-w-lg rounded-lg bg-white p-6">
            <h2 className="text-lg font-bold">Trả lời {replyFor.customer_name}</h2>
            <p className="mt-1 text-sm text-gray-500">{replyFor.product_name}</p>
            <div className="mt-3 rounded bg-gray-50 p-3 text-sm text-gray-700">
              <Stars value={replyFor.rating} />
              {replyFor.comment && <p className="mt-1 whitespace-pre-line">{replyFor.comment}</p>}
            </div>
            <label htmlFor="reply-text" className="mt-4 block text-sm font-medium text-gray-700">Phản hồi (hiển thị công khai dưới đánh giá)</label>
            <textarea
              id="reply-text"
              value={replyText}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReplyText(e.target.value.slice(0, 1000))}
              rows={4}
              placeholder="Cảm ơn anh/chị đã tin tưởng Shoppc…"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500">Để trống rồi lưu để xóa phản hồi.</p>
            <div className="mt-4 flex justify-end gap-3">
              <button type="button" onClick={() => setReplyFor(null)} disabled={saving} className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50">Hủy</button>
              <button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50">{saving ? 'Đang lưu…' : 'Lưu phản hồi'}</button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        type="danger"
        title="Xóa đánh giá?"
        confirmText="Xóa"
        loading={deleting}
        message={deleteTarget && <>Xóa hẳn đánh giá của <strong>{deleteTarget.customer_name}</strong>? Khách sẽ có thể viết lại đánh giá mới. Nếu chỉ muốn không hiển thị, hãy dùng nút Ẩn.</>}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
};

export default ReviewsPage;
