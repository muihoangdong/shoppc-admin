import React, { useCallback, useEffect, useState } from 'react';
import { BanknotesIcon, PrinterIcon, XMarkIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { OrderDetail } from '../../types';
import { orderService } from '../../services/orderService';
import { ConfirmDialog } from '../Common/ConfirmDialog';
import LoadingSpinner from '../Common/LoadingSpinner';
import ErrorMessage from '../Common/ErrorMessage';
import { OrderStatusBadge, PaymentBadge } from './StatusBadge';
import { formatDateTime, formatFullAddress, formatPhone, formatPrice } from '../../utils/formatters';
import { NEXT_STEP, OrderStatus, canCancel, paymentMethodLabel, statusLabel } from '../../utils/orderStatus';
import { printInvoice } from '../../utils/invoice';
import { useRealtime } from '../../contexts/RealtimeContext';
import { isPaymentClaimed } from '../../utils/payment';

interface OrderDetailModalProps {
  orderId: number;
  onClose: () => void;
  /** Gọi sau khi đơn thay đổi (đổi trạng thái / thanh toán) để danh sách phía sau tải lại. */
  onChanged: () => void;
}

type Pending = null | { kind: 'cancel' } | { kind: 'payment'; to: 'paid' | 'pending' } | { kind: 'reject-claim' };

const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex gap-3 py-1 text-sm">
    <dt className="w-28 shrink-0 text-gray-500">{label}</dt>
    <dd className="min-w-0 break-words text-gray-900">{children}</dd>
  </div>
);

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({ orderId, onClose, onChanged }) => {
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<Pending>(null);
  const [reason, setReason] = useState('');

  const load = useCallback(async () => {
    try {
      setError('');
      setOrder(await orderService.getOrderDetail(orderId));
    } catch (err: any) {
      setError(err.message || 'Không thể tải chi tiết đơn hàng');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    setLoading(true);
    setOrder(null);
    void load();
  }, [load]);

  // Realtime: đơn đang xem vừa được người khác cập nhật → tải lại ngay để không thao tác trên dữ liệu cũ
  useRealtime('order:updated', (o: { id: number }) => {
    if (o.id === orderId) void load();
  });
  useRealtime('payment:claimed', (o: { id: number }) => {
    if (o.id === orderId) void load();
  });
  useRealtime('payment:received', (o: { id: number }) => {
    if (o.id === orderId) void load();
  });
  useRealtime('resync', () => void load());

  // Esc đóng cửa sổ (khi không có hộp thoại xác nhận nào đang mở)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !pending && !busy) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, pending, busy]);

  const run = async (action: () => Promise<unknown>, success: string) => {
    try {
      setBusy(true);
      await action();
      toast.success(success);
      await load();
      onChanged();
    } catch (err: any) {
      toast.error(err.message || 'Thao tác thất bại');
      await load(); // dữ liệu có thể đã đổi (người khác vừa xử lý) nên tải lại cho đúng
    } finally {
      setBusy(false);
      setPending(null);
      setReason('');
    }
  };

  const changeStatus = (to: OrderStatus, note?: string) =>
    run(() => orderService.updateOrderStatus(orderId, to, note), `Đã chuyển sang "${statusLabel(to)}"`);

  const next = order ? NEXT_STEP[order.status] : undefined;
  const address = order
    ? formatFullAddress(order.customer_address, order.customer_ward ?? undefined, order.customer_district ?? undefined, order.customer_city ?? undefined)
    : '';

  const handlePrint = () => {
    if (order && !printInvoice(order)) toast.error('Trình duyệt đang chặn cửa sổ in. Hãy cho phép cửa sổ bật lên rồi thử lại.');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black bg-opacity-50 p-4"
      onMouseDown={(e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <div role="dialog" aria-modal="true" aria-label="Chi tiết đơn hàng" className="my-6 w-full max-w-3xl rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <h2 className="truncate text-lg font-semibold">{order ? `Đơn hàng ${order.order_code}` : 'Chi tiết đơn hàng'}</h2>
            {order && <OrderStatusBadge status={order.status} />}
          </div>
          <button onClick={onClose} aria-label="Đóng" className="rounded p-1 hover:bg-gray-100">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-6 p-6">
          {loading && <LoadingSpinner />}
          {!loading && error && !order && <ErrorMessage message={error} onRetry={() => { setLoading(true); void load(); }} />}

          {order && (
            <>
              <section>
                <h3 className="mb-2 text-sm font-semibold uppercase text-gray-500">Khách hàng</h3>
                <dl>
                  <Row label="Họ tên">{order.customer_name}</Row>
                  <Row label="Điện thoại">{formatPhone(order.customer_phone)}</Row>
                  <Row label="Email">{order.customer_email}</Row>
                  <Row label="Địa chỉ">{address}</Row>
                  {order.note && <Row label="Ghi chú">{order.note}</Row>}
                  <Row label="Ngày đặt">{formatDateTime(order.created_at)}</Row>
                </dl>
              </section>

              <section>
                <h3 className="mb-2 text-sm font-semibold uppercase text-gray-500">Sản phẩm</h3>
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                      <tr>
                        <th className="px-4 py-2">Sản phẩm</th>
                        <th className="px-4 py-2 text-right">SL</th>
                        <th className="px-4 py-2 text-right">Đơn giá</th>
                        <th className="px-4 py-2 text-right">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {order.items.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-2">{item.product_name}</td>
                          <td className="px-4 py-2 text-right">{item.quantity}</td>
                          <td className="px-4 py-2 text-right">{formatPrice(item.price)}</td>
                          <td className="px-4 py-2 text-right">{formatPrice(item.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <dl className="mt-3 ml-auto w-full max-w-xs space-y-1 text-sm">
                  <div className="flex justify-between"><dt className="text-gray-500">Tạm tính</dt><dd>{formatPrice(Number(order.subtotal ?? order.total_amount))}</dd></div>
                  {Number(order.discount) > 0 && (
                    <div className="flex justify-between"><dt className="text-gray-500">Giảm giá{order.coupon_code ? ` (mã ${order.coupon_code})` : ''}</dt><dd>-{formatPrice(Number(order.discount))}</dd></div>
                  )}
                  <div className="flex justify-between"><dt className="text-gray-500">Phí vận chuyển</dt><dd>{formatPrice(Number(order.shipping_fee ?? 0))}</dd></div>
                  <div className="flex justify-between border-t pt-2 text-base font-semibold"><dt>Tổng cộng</dt><dd data-testid="order-total">{formatPrice(Number(order.total_amount))}</dd></div>
                </dl>
              </section>

              {isPaymentClaimed(order) && (
                <section role="alert" className="rounded-lg border-2 border-green-500 bg-green-50 p-4" data-testid="payment-claim">
                  <p className="flex items-center gap-2 font-semibold text-green-800">
                    <BanknotesIcon className="h-5 w-5 shrink-0" />
                    Khách báo đã chuyển khoản lúc {formatDateTime(order.payment_claimed_at as string)}
                  </p>
                  <p className="mt-1 text-sm text-green-900">
                    Mở app ngân hàng kiểm tra có giao dịch <b>{formatPrice(Number(order.total_amount))}</b> với nội dung{' '}
                    <b className="font-mono">{order.order_code.replace(/-/g, '')}</b>.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      disabled={busy}
                      onClick={() => setPending({ kind: 'payment', to: 'paid' })}
                      className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      Xác nhận đã nhận tiền
                    </button>
                    <button
                      disabled={busy}
                      onClick={() => setPending({ kind: 'reject-claim' })}
                      className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      Chưa nhận được tiền
                    </button>
                  </div>
                </section>
              )}

              <section>
                <h3 className="mb-2 text-sm font-semibold uppercase text-gray-500">Thanh toán</h3>
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span>{paymentMethodLabel(order.payment_method)}</span>
                  <PaymentBadge status={order.payment_status} />
                  {order.status !== 'cancelled' && (
                    <button
                      disabled={busy}
                      onClick={() => setPending({ kind: 'payment', to: order.payment_status === 'paid' ? 'pending' : 'paid' })}
                      className="text-blue-600 hover:underline disabled:opacity-50"
                    >
                      {order.payment_status === 'paid' ? 'Bỏ đánh dấu đã thanh toán' : 'Đánh dấu đã thanh toán'}
                    </button>
                  )}
                </div>
                {order.payment_method === 'cod' && order.payment_status !== 'paid' && order.status !== 'cancelled' && (
                  <p className="mt-1 text-xs text-gray-400">Đơn COD sẽ tự được đánh dấu đã thanh toán khi chuyển sang "Đã giao".</p>
                )}
              </section>

              <section>
                <h3 className="mb-2 text-sm font-semibold uppercase text-gray-500">Lịch sử trạng thái</h3>
                {order.history.length === 0 ? (
                  <p className="text-sm text-gray-500">Chưa có lịch sử.</p>
                ) : (
                  <ol className="space-y-3 border-l-2 border-gray-200 pl-4">
                    {[...order.history].reverse().map((h) => (
                      <li key={h.id} className="text-sm">
                        <p className="font-medium text-gray-900">
                          {h.old_status ? `${statusLabel(h.old_status)} → ` : ''}
                          {statusLabel(h.new_status)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDateTime(h.created_at)}
                          {h.changed_by_name ? ` · ${h.changed_by_name}` : ''}
                        </p>
                        {h.note && <p className="text-xs text-gray-600">“{h.note}”</p>}
                      </li>
                    ))}
                  </ol>
                )}
              </section>
            </>
          )}
        </div>

        {order && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t bg-gray-50 px-6 py-4">
            <button onClick={handlePrint} className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm hover:bg-gray-50">
              <PrinterIcon className="h-4 w-4" />
              In hóa đơn
            </button>
            <div className="flex gap-3">
              {canCancel(order.status) && (
                <button
                  disabled={busy}
                  onClick={() => setPending({ kind: 'cancel' })}
                  className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  Hủy đơn
                </button>
              )}
              {next && (
                <button
                  disabled={busy}
                  onClick={() => void changeStatus(next.to)}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {busy ? 'Đang xử lý…' : next.label}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={pending?.kind === 'cancel'}
        type="danger"
        title="Hủy đơn hàng?"
        confirmText="Hủy đơn"
        cancelText="Giữ đơn"
        loading={busy}
        onCancel={() => { setPending(null); setReason(''); }}
        onConfirm={() => void changeStatus('cancelled', reason.trim() || undefined)}
        message={
          <div className="space-y-3 text-left">
            <p className="text-center">Đơn sẽ chuyển sang "Đã hủy" và <strong>tồn kho các sản phẩm trong đơn được hoàn lại</strong>. Không thể khôi phục.</p>
            <textarea
              value={reason}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReason(e.target.value)}
              maxLength={500}
              rows={2}
              placeholder="Lý do hủy (không bắt buộc)"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        }
      />
      <ConfirmDialog
        isOpen={pending?.kind === 'payment'}
        type="info"
        title={pending?.kind === 'payment' && pending.to === 'paid' ? 'Xác nhận đã nhận tiền?' : 'Bỏ đánh dấu đã thanh toán?'}
        message={
          pending?.kind === 'payment' && pending.to === 'paid'
            ? 'Đơn sẽ được đánh dấu là ĐÃ THANH TOÁN. Trang đơn của khách tự cập nhật và khách nhận email xác nhận (nếu đã cấu hình email).'
            : 'Đơn sẽ quay về trạng thái CHƯA THANH TOÁN.'
        }
        loading={busy}
        onCancel={() => setPending(null)}
        onConfirm={() => {
          if (pending?.kind === 'payment') {
            const to = pending.to;
            void run(() => orderService.updatePaymentStatus(orderId, to), 'Đã cập nhật thanh toán');
          }
        }}
      />
      <ConfirmDialog
        isOpen={pending?.kind === 'reject-claim'}
        type="warning"
        title="Chưa nhận được tiền?"
        message="Trang đơn của khách sẽ báo cửa hàng chưa nhận được tiền để khách kiểm tra lại giao dịch và báo lại."
        confirmText="Báo khách"
        loading={busy}
        onCancel={() => setPending(null)}
        onConfirm={() => void run(() => orderService.rejectPaymentClaim(orderId), 'Đã báo khách: chưa nhận được tiền')}
      />
    </div>
  );
};
