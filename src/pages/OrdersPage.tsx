import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { Order, OrderPage } from '../types';
import { orderService } from '../services/orderService';
import { OrderDetailModal } from '../components/Orders/OrderDetailModal';
import { OrderStatusBadge, PaymentBadge } from '../components/Orders/StatusBadge';
import { ConfirmDialog } from '../components/Common/ConfirmDialog';
import Pagination from '../components/Common/Pagination';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import ErrorMessage from '../components/Common/ErrorMessage';
import useDebounce from '../hooks/useDebounce';
import useDebouncedCallback from '../hooks/useDebouncedCallback';
import { useRealtime } from '../contexts/RealtimeContext';
import usePageTitle from '../hooks/usePageTitle';
import { formatDateTime, formatPhone, formatPrice } from '../utils/formatters';
import {
  NEXT_STEP,
  ORDER_STATUSES,
  OrderStatus,
  PaymentStatus,
  STATUS_LABELS,
  canCancel,
  isOrderStatus,
} from '../utils/orderStatus';
import { isPaymentClaimed } from '../utils/payment';

const PAGE_SIZE = 10;

const inputClass =
  'rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';

const OrdersPage: React.FC = () => {
  usePageTitle('Đơn hàng');
  const [params, setParams] = useSearchParams();

  // Trạng thái lọc theo tab và đơn đang mở lấy từ URL: bấm chuông thông báo / thẻ tổng quan sẽ vào đúng bộ lọc
  const urlStatus = params.get('status');
  const status: OrderStatus | '' = isOrderStatus(urlStatus) ? urlStatus : '';
  const openId = Number(params.get('open')) || null;
  // ?claimed=1: chỉ đơn khách đã báo "Tôi đã chuyển khoản" mà chưa được xác nhận (từ chuông / thông báo)
  const claimed = params.get('claimed') === '1';

  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | ''>('');
  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput.trim(), 400);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const [data, setData] = useState<OrderPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actingId, setActingId] = useState<number | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Order | null>(null);

  const dateError = from && to && from > to ? 'Ngày bắt đầu phải trước ngày kết thúc' : '';
  const latest = useRef(0);

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  // Số trang gắn với bộ lọc: đổi bộ lọc thì về trang 1 NGAY trong lần render đó
  // (trước đây dùng effect nên gửi thừa một request với số trang cũ rồi mới gửi lại với trang 1)
  const filterKey = JSON.stringify([status, paymentStatus, search, from, to, claimed]);
  const [pageState, setPageState] = useState({ key: filterKey, page: 1 });
  const page = pageState.key === filterKey ? pageState.page : 1;
  const setPage = (p: number) => setPageState({ key: filterKey, page: p });

  useEffect(() => {
    if (dateError) return undefined;
    const ticket = ++latest.current; // bỏ qua phản hồi cũ nếu người dùng đã đổi bộ lọc tiếp
    setLoading(true);
    orderService
      .getOrdersPage({ status, payment_status: paymentStatus, search, from, to, page, limit: PAGE_SIZE, claimed: claimed ? '1' : '' })
      .then((result) => {
        if (ticket !== latest.current) return;
        setData(result);
        setError('');
      })
      .catch((err: Error) => {
        if (ticket !== latest.current) return;
        setError(err.message);
      })
      .finally(() => {
        if (ticket === latest.current) setLoading(false);
      });
    return undefined;
  }, [status, paymentStatus, search, from, to, claimed, page, reloadKey, dateError]);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  // Realtime: đơn mới / đơn đổi trạng thái (kể cả do nhân viên khác hoặc chatbot) / vừa kết nối lại → làm mới danh sách
  const reloadSoon = useDebouncedCallback(reload, 500);
  useRealtime('order:new', reloadSoon);
  useRealtime('order:updated', reloadSoon);
  useRealtime('payment:claimed', reloadSoon);
  useRealtime('payment:received', reloadSoon);
  useRealtime('resync', reloadSoon);

  const advance = async (order: Order) => {
    const next = NEXT_STEP[order.status];
    if (!next) return;
    try {
      setActingId(order.id);
      await orderService.updateOrderStatus(order.id, next.to);
      toast.success(`Đơn ${order.order_code}: ${next.label}`);
      reload();
    } catch (err: any) {
      toast.error(err.message);
      reload(); // có thể người khác vừa xử lý đơn này
    } finally {
      setActingId(null);
    }
  };

  const confirmCancel = async () => {
    if (!cancelTarget) return;
    try {
      setActingId(cancelTarget.id);
      await orderService.updateOrderStatus(cancelTarget.id, 'cancelled');
      toast.success(`Đã hủy đơn ${cancelTarget.order_code} và hoàn lại tồn kho`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setActingId(null);
      setCancelTarget(null);
      reload();
    }
  };

  const clearFilters = () => {
    setSearchInput('');
    setPaymentStatus('');
    setFrom('');
    setTo('');
    const next = new URLSearchParams(params);
    next.delete('status');
    next.delete('claimed');
    setParams(next, { replace: true });
  };

  const hasFilters = !!(status || paymentStatus || searchInput || from || to || claimed);
  const counts = data?.meta.counts;
  const tabClass = (active: boolean) =>
    `whitespace-nowrap rounded-full px-3 py-1.5 text-sm transition ${
      active ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border hover:bg-gray-50'
    }`;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý đơn hàng</h1>
        <p className="text-sm text-gray-500">Xử lý đơn theo đúng thứ tự: chờ xử lý → đang xử lý → đang giao → đã giao → hoàn tất.</p>
      </div>

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Lọc theo trạng thái">
        <button role="tab" aria-selected={status === ''} className={tabClass(status === '')} onClick={() => setParam('status', null)}>
          Tất cả{counts ? ` (${counts.all})` : ''}
        </button>
        {ORDER_STATUSES.map((s) => (
          <button key={s} role="tab" aria-selected={status === s} className={tabClass(status === s)} onClick={() => setParam('status', s)}>
            {STATUS_LABELS[s]}
            {counts ? ` (${counts[s]})` : ''}
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-3 rounded-lg bg-white p-4 shadow">
        <div className="relative min-w-[14rem] flex-1">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            value={searchInput}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchInput(e.target.value)}
            placeholder="Tìm mã đơn, tên, SĐT, email…"
            aria-label="Tìm đơn hàng"
            className={`${inputClass} w-full pl-9`}
          />
        </div>
        <select
          value={paymentStatus}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPaymentStatus(e.target.value as PaymentStatus | '')}
          aria-label="Lọc theo thanh toán"
          className={inputClass}
        >
          <option value="">Mọi thanh toán</option>
          <option value="pending">Chưa thanh toán</option>
          <option value="paid">Đã thanh toán</option>
        </select>
        <label className="text-xs text-gray-500">
          Từ ngày
          <input type="date" value={from} max={to || undefined} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFrom(e.target.value)} className={`${inputClass} mt-1 block`} />
        </label>
        <label className="text-xs text-gray-500">
          Đến ngày
          <input type="date" value={to} min={from || undefined} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTo(e.target.value)} className={`${inputClass} mt-1 block`} />
        </label>
        <button
          type="button"
          aria-pressed={claimed}
          onClick={() => setParam('claimed', claimed ? null : '1')}
          className={`rounded-lg border px-3 py-2 text-sm transition ${claimed ? 'border-green-600 bg-green-600 text-white' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
        >
          💰 Khách báo đã chuyển khoản
        </button>
        {hasFilters && (
          <button onClick={clearFilters} className="rounded-lg border px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">
            Xóa bộ lọc
          </button>
        )}
      </div>
      {dateError && <p role="alert" className="mb-3 text-sm text-red-600">{dateError}</p>}

      {error && !data ? (
        <ErrorMessage message={error} onRetry={reload} />
      ) : (
        <div className={`overflow-hidden rounded-lg bg-white shadow transition-opacity ${loading && data ? 'opacity-60' : ''}`}>
          {loading && !data ? (
            <div className="py-16">
              <LoadingSpinner />
            </div>
          ) : (
            <>
              {error && (
                <div role="alert" className="border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
                  {error}{' '}
                  <button onClick={reload} className="underline">
                    Thử lại
                  </button>
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Mã đơn', 'Khách hàng', 'Tổng tiền', 'Thanh toán', 'Trạng thái', 'Ngày đặt', 'Thao tác'].map((h) => (
                        <th key={h} className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {data?.orders.map((order) => {
                      const next = NEXT_STEP[order.status];
                      const busy = actingId === order.id;
                      return (
                        <tr key={order.id} onClick={() => setParam('open', String(order.id))} className="cursor-pointer hover:bg-gray-50">
                          <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">{order.order_code}</td>
                          <td className="px-4 py-3">
                            <p className="text-sm text-gray-900">{order.customer_name}</p>
                            <p className="text-xs text-gray-500">{formatPhone(order.customer_phone)}</p>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-gray-900">{formatPrice(order.total_amount)}</td>
                          <td className="px-4 py-3">
                            <PaymentBadge status={order.payment_status} />
                            <p className="mt-1 text-xs text-gray-400">{order.payment_method === 'cod' ? 'COD' : 'Chuyển khoản'}</p>
                            {isPaymentClaimed(order) && (
                              <span className="mt-1 inline-block whitespace-nowrap rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800" title={`Khách báo lúc ${formatDateTime(order.payment_claimed_at as string)}`}>
                                💰 Khách báo đã CK
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <OrderStatusBadge status={order.status} />
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{formatDateTime(order.created_at)}</td>
                          <td className="whitespace-nowrap px-4 py-3" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                            <div className="flex items-center gap-3 text-sm">
                              {next && (
                                <button
                                  disabled={busy}
                                  onClick={() => void advance(order)}
                                  className="rounded-lg bg-blue-600 px-3 py-1 text-white hover:bg-blue-700 disabled:opacity-50"
                                >
                                  {busy ? '…' : next.label}
                                </button>
                              )}
                              {canCancel(order.status) && (
                                <button disabled={busy} onClick={() => setCancelTarget(order)} className="text-red-600 hover:underline disabled:opacity-50">
                                  Hủy
                                </button>
                              )}
                              {!next && !canCancel(order.status) && <span className="text-gray-400" title="Đơn đã ở trạng thái cuối">—</span>}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {data && data.orders.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-500">
                          {hasFilters ? (
                            <>
                              Không có đơn hàng nào phù hợp với bộ lọc.{' '}
                              <button onClick={clearFilters} className="text-blue-600 underline">
                                Xóa bộ lọc
                              </button>
                            </>
                          ) : (
                            'Chưa có đơn hàng nào.'
                          )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {data && <Pagination page={data.meta.page} pages={data.meta.pages} total={data.meta.total} pageSize={data.meta.limit} onChange={setPage} unit="đơn" />}
            </>
          )}
        </div>
      )}

      {openId && <OrderDetailModal orderId={openId} onClose={() => setParam('open', null)} onChanged={reload} />}

      <ConfirmDialog
        isOpen={!!cancelTarget}
        type="danger"
        title="Hủy đơn hàng?"
        confirmText="Hủy đơn"
        cancelText="Giữ đơn"
        loading={actingId !== null && actingId === cancelTarget?.id}
        message={
          cancelTarget && (
            <>
              Hủy đơn <strong>{cancelTarget.order_code}</strong> của {cancelTarget.customer_name}? Tồn kho các sản phẩm trong đơn sẽ được hoàn lại và không thể khôi phục.
            </>
          )
        }
        onCancel={() => setCancelTarget(null)}
        onConfirm={() => void confirmCancel()}
      />
    </div>
  );
};

export default OrdersPage;
