import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useRealtime } from '../../contexts/RealtimeContext';
import { formatPrice } from '../../utils/formatters';
import { playBeep } from '../../utils/sound';

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n)}…` : s);

/**
 * Không hiển thị gì; chỉ lắng nghe sự kiện realtime để báo cho nhân viên: toast + âm báo khi có đơn mới,
 * tin nhắn khách (trừ khi đang mở đúng hội thoại đó), khách cần nhân viên; và làm mới số liệu chuông thông báo.
 */
const RealtimeNotifier: React.FC<{ onStatsDirty: () => void }> = ({ onStatsDirty }) => {
  const location = useLocation();
  const navigate = useNavigate();

  useRealtime('order:new', (o: { id: number; order_code: string; customer_name: string; total_amount: number }) => {
    toast.success(`🛒 Đơn mới ${o.order_code} — ${clip(o.customer_name, 30)} — ${formatPrice(o.total_amount)}`, { id: `order-${o.id}`, duration: 7000 });
    playBeep();
    onStatsDirty(); // không phụ thuộc việc server có gửi kèm stats:dirty hay không
  });

  // Khách bấm "Tôi đã chuyển khoản": toast lâu hơn, bấm vào mở thẳng đơn để kiểm tra tài khoản và xác nhận
  useRealtime('payment:claimed', (o: { id: number; order_code: string; customer_name: string; total_amount: number }) => {
    toast(
      (t) => (
        <button
          type="button"
          className="text-left"
          onClick={() => {
            toast.dismiss(t.id);
            navigate(`/admin/orders?open=${o.id}`);
          }}
        >
          <span className="block font-semibold">💰 Khách báo đã chuyển khoản</span>
          <span className="block text-sm">
            Đơn {o.order_code} — {clip(o.customer_name, 30)} — <b>{formatPrice(o.total_amount)}</b>
          </span>
          <span className="mt-1 block text-xs text-blue-300 underline">Bấm để kiểm tra và xác nhận</span>
        </button>
      ),
      { id: `claim-${o.id}`, duration: 15000 }
    );
    playBeep();
    onStatsDirty();
  });

  useRealtime('payment:received', (o: { id: number; order_code: string; total_amount: number; by?: { name?: string } | null }) => {
    toast.success(`✅ Đã nhận ${formatPrice(o.total_amount)} cho đơn ${o.order_code}${o.by?.name ? ` (${o.by.name})` : ' (tự động)'}`, { id: `paid-${o.id}`, duration: 6000 });
    onStatsDirty();
  });

  useRealtime('chat:message', ({ conversation, message }: { conversation: { id: number; customer_name: string | null }; message: { sender_type: string; content: string } }) => {
    if (message.sender_type !== 'customer') return;
    const viewing =
      location.pathname === '/admin/support' &&
      new URLSearchParams(location.search).get('c') === String(conversation.id) &&
      document.visibilityState === 'visible';
    if (viewing) return;
    toast(`💬 ${conversation.customer_name || 'Khách'}: ${clip(message.content, 60)}`, { id: `chat-${conversation.id}`, duration: 6000 });
    playBeep();
  });

  useRealtime('chat:handoff', ({ conversation }: { conversation: { id: number; customer_name: string | null } }) => {
    toast(`🙋 ${conversation.customer_name || 'Khách'} cần nhân viên hỗ trợ`, { id: `handoff-${conversation.id}`, duration: 8000 });
    playBeep();
  });

  useRealtime('stats:dirty', onStatsDirty);
  useRealtime('resync', onStatsDirty);

  return null;
};

export default RealtimeNotifier;
