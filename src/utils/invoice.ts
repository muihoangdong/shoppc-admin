import { OrderDetail } from '../types';
import { formatDateTime, formatFullAddress, formatPrice } from './formatters';
import { paymentMethodLabel, paymentStatusLabel, statusLabel } from './orderStatus';

/** Thoát ký tự HTML: tên khách, ghi chú... do người dùng nhập nên tuyệt đối không chèn thẳng vào trang in. */
export const escapeHtml = (value: unknown): string =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export const buildInvoiceHtml = (o: OrderDetail): string => {
  const address = formatFullAddress(o.customer_address, o.customer_ward ?? undefined, o.customer_district ?? undefined, o.customer_city ?? undefined);
  const rows = o.items
    .map(
      (i, idx) => `<tr>
        <td>${idx + 1}</td><td>${escapeHtml(i.product_name)}</td>
        <td class="r">${escapeHtml(i.quantity)}</td><td class="r">${escapeHtml(formatPrice(i.price))}</td>
        <td class="r">${escapeHtml(formatPrice(i.total))}</td></tr>`
    )
    .join('');
  const discount = Number(o.discount) > 0 ? `<tr><td>Giảm giá${o.coupon_code ? ` (mã ${escapeHtml(o.coupon_code)})` : ''}</td><td class="r">-${escapeHtml(formatPrice(Number(o.discount)))}</td></tr>` : '';

  return `<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>Hóa đơn ${escapeHtml(o.order_code)}</title>
<style>
 body{font-family:Arial,Helvetica,sans-serif;color:#111;margin:32px;font-size:14px}
 h1{margin:0 0 4px;font-size:22px} .muted{color:#666}
 table{width:100%;border-collapse:collapse;margin-top:16px} th,td{border-bottom:1px solid #ddd;padding:8px;text-align:left}
 th{background:#f5f5f5} .r{text-align:right} .totals{width:320px;margin-left:auto}
 .totals td{border:0;padding:4px 8px} .grand td{font-weight:bold;font-size:16px;border-top:2px solid #111}
 @media print{body{margin:12mm}}
</style></head><body>
<h1>HÓA ĐƠN BÁN HÀNG</h1>
<p class="muted">Shoppc · Mã đơn <strong>${escapeHtml(o.order_code)}</strong> · Ngày đặt ${escapeHtml(formatDateTime(o.created_at))}</p>
<p><strong>Khách hàng:</strong> ${escapeHtml(o.customer_name)}<br>
<strong>Điện thoại:</strong> ${escapeHtml(o.customer_phone)}<br>
<strong>Email:</strong> ${escapeHtml(o.customer_email)}<br>
<strong>Địa chỉ giao hàng:</strong> ${escapeHtml(address)}</p>
${o.note ? `<p><strong>Ghi chú của khách:</strong> ${escapeHtml(o.note)}</p>` : ''}
<table><thead><tr><th>#</th><th>Sản phẩm</th><th class="r">SL</th><th class="r">Đơn giá</th><th class="r">Thành tiền</th></tr></thead><tbody>${rows}</tbody></table>
<table class="totals"><tbody>
 <tr><td>Tạm tính</td><td class="r">${escapeHtml(formatPrice(Number(o.subtotal ?? o.total_amount)))}</td></tr>
 ${discount}
 <tr><td>Phí vận chuyển</td><td class="r">${escapeHtml(formatPrice(Number(o.shipping_fee ?? 0)))}</td></tr>
 <tr class="grand"><td>Tổng cộng</td><td class="r">${escapeHtml(formatPrice(Number(o.total_amount)))}</td></tr>
</tbody></table>
<p class="muted">Thanh toán: ${escapeHtml(paymentMethodLabel(o.payment_method))} — ${escapeHtml(paymentStatusLabel(o.payment_status))}<br>
Trạng thái đơn: ${escapeHtml(statusLabel(o.status))}</p>
<p class="muted" style="text-align:center;margin-top:32px">Cảm ơn quý khách đã mua hàng!</p>
</body></html>`;
};

/** Mở cửa sổ in. Trả về false nếu trình duyệt chặn cửa sổ bật lên. */
export const printInvoice = (order: OrderDetail): boolean => {
  const win = window.open('', '_blank', 'width=820,height=900');
  if (!win) return false;
  win.document.open();
  win.document.write(buildInvoiceHtml(order));
  win.document.close();
  win.focus();
  win.onload = () => win.print();
  // Một số trình duyệt không bắn onload với document.write: in sau một nhịp ngắn
  window.setTimeout(() => {
    try {
      win.print();
    } catch {
      /* người dùng đã đóng cửa sổ */
    }
  }, 400);
  return true;
};
