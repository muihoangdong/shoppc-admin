import TableView from '../components/Common/TableView';
import { useSearchParams } from 'react-router-dom';
import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { ArrowPathIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import useDebounce from '../hooks/useDebounce';
import usePageTitle from '../hooks/usePageTitle';
import {
  operationsService as api,
  OperationList,
  OperationLookups,
  OperationRow as Row,
} from '../services/operationsService';
import {
  buttonClass,
  primaryClass,
  inputClass,
  Field,
  TextField,
  SelectField,
  OperationModal,
  Status,
  labels,
  money,
  dateTime,
} from '../components/Operations/OperationUI';

export type OperationKind =
  | 'suppliers'
  | 'receipts'
  | 'movements'
  | 'serials'
  | 'warranties'
  | 'returns'
  | 'shipments'
  | 'brands'
  | 'templates'
  | 'audit';
const meta: Record<OperationKind, { title: string; searchPlaceholder: string; add?: string; statuses?: string[] }> = {
  suppliers: {
    title: 'Nhà cung cấp',
    searchPlaceholder: 'Tên, mã nhà cung cấp hoặc số điện thoại…',
    add: 'Thêm nhà cung cấp',
  },
  receipts: {
    title: 'Nhập kho',
    searchPlaceholder: 'Mã phiếu nhập hoặc tên nhà cung cấp…',
    add: 'Lập phiếu nhập',
    statuses: ['draft', 'received', 'cancelled'],
  },
  movements: {
    title: 'Lịch sử xuất / nhập kho',
    searchPlaceholder: 'Tên sản phẩm, SKU hoặc lý do…',
    add: 'Điều chỉnh tồn',
  },
  serials: {
    title: 'Serial sản phẩm',
    searchPlaceholder: 'Serial, tên sản phẩm hoặc mã đơn…',
    add: 'Đăng ký serial',
    statuses: ['in_stock', 'sold', 'returned', 'repair', 'retired'],
  },
  warranties: {
    title: 'Phiếu bảo hành',
    searchPlaceholder: 'Mã phiếu bảo hành, serial hoặc tên khách…',
    add: 'Tiếp nhận bảo hành',
    statuses: ['active', 'received', 'diagnosing', 'repairing', 'resolved', 'rejected'],
  },
  returns: {
    title: 'Đổi trả & hoàn tiền',
    searchPlaceholder: 'Mã đổi trả, mã đơn hoặc tên khách…',
    add: 'Tạo yêu cầu đổi trả',
    statuses: ['requested', 'approved', 'received', 'refunded', 'closed', 'rejected', 'cancelled'],
  },
  shipments: {
    title: 'Vận chuyển',
    searchPlaceholder: 'Mã vận đơn, hãng vận chuyển hoặc mã đơn…',
    add: 'Tạo vận đơn',
    statuses: ['created', 'picked_up', 'in_transit', 'delivered', 'failed', 'returned', 'cancelled'],
  },
  brands: {
    title: 'Thương hiệu',
    searchPlaceholder: 'Tên thương hiệu…',
    add: 'Thêm thương hiệu',
  },
  templates: {
    title: 'Thông số chuẩn',
    searchPlaceholder: 'Tên mẫu thông số hoặc tên danh mục…',
    add: 'Thêm mẫu thông số',
  },
  audit: {
    title: 'Nhật ký thao tác',
    searchPlaceholder: 'Người thao tác, hành động hoặc nội dung…',
  },
};
const emptyLookups: OperationLookups = {
  products: [],
  suppliers: [],
  brands: [],
  templates: [],
  categories: [],
  orders: [],
};
const adminOnlyAdd = new Set<OperationKind>(['suppliers', 'brands', 'templates', 'movements']);
const warrantyNext: Record<string, string[]> = {
  received: ['diagnosing', 'rejected'],
  diagnosing: ['repairing', 'resolved', 'rejected'],
  repairing: ['resolved', 'rejected'],
};
const shipNext: Record<string, string[]> = {
  created: ['picked_up', 'cancelled'],
  picked_up: ['in_transit', 'delivered', 'failed'],
  in_transit: ['delivered', 'failed', 'returned'],
  failed: ['in_transit', 'delivered', 'returned'],
};
const returnNext: Record<string, string[]> = {
  requested: ['approved', 'rejected', 'cancelled'],
  approved: ['received', 'cancelled'],
  received: ['refunded', 'closed'],
};
const splitSerials = (s: string) =>
  s
    .split(/[\n,;]+/)
    .map((v) => v.trim())
    .filter(Boolean);

async function loadOperationList(kind: OperationKind, params: Record<string, unknown>): Promise<OperationList> {
  if (kind !== 'warranties' || params.status !== 'active') return api.get<OperationList>(kind, params);
  const page = Number(params.page) || 1;
  let total = 0;
  const lists = await Promise.all(
    ['received', 'diagnosing', 'repairing'].map(async (status) => {
      const first = await api.get<OperationList>(kind, { ...params, status, page: 1, limit: 100 });
      total += first.total;
      const rest = await Promise.all(
        Array.from({ length: Math.max(0, Math.ceil(Math.min(first.total, page * 20) / first.limit) - 1) }, (_, index) =>
          api.get<OperationList>(kind, { ...params, status, page: index + 2, limit: first.limit }),
        ),
      );
      return [first, ...rest].flatMap((list) => list.items);
    }),
  );
  const rows = lists.flat().sort((a, b) => b.id - a.id);
  return { items: rows.slice((page - 1) * 20, page * 20), total, page, limit: 20 };
}

const OperationsPage: React.FC<{ kind: OperationKind }> = ({ kind }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const info = meta[kind];
  usePageTitle(info.title);
  const [data, setData] = useState<OperationList>({ items: [], total: 0, page: 1, limit: 20 });
  const [lookups, setLookups] = useState<OperationLookups>(emptyLookups);
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search, 300);
  const [params] = useSearchParams();
  const [status, setStatus] = useState(() =>
    info.statuses?.includes(params.get('status') || '') ? params.get('status')! : '',
  );
  useEffect(() => {
    setStatus(info.statuses?.includes(params.get('status') || '') ? params.get('status')! : '');
  }, [kind, params, info.statuses]);
  const [productId, setProductId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [reload, setReload] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState<{ type: string; row?: Row; title: string; readOnly?: boolean } | null>(null);
  const [form, setForm] = useState<Row>({});
  const [busy, setBusy] = useState(false);
  const [modalError, setModalError] = useState('');
  const [orderItems, setOrderItems] = useState<Row[]>([]);
  const [serialChoices, setSerialChoices] = useState<Row[]>([]);
  const [serialSearch, setSerialSearch] = useState('');
  const serialQuery = useDebounce(serialSearch, 300);
  const set = (key: string, value: any) => setForm((previous) => ({ ...previous, [key]: value }));

  useEffect(() => {
    setPage(1);
  }, [debounced, status, productId, from, to]);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError('');
    loadOperationList(kind, { search: debounced, status, product_id: productId, from, to, page })
      .then((result) => alive && setData(result))
      .catch((err) => alive && setError(err.message))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [kind, debounced, status, productId, from, to, page, reload]);
  useEffect(() => {
    let alive = true;
    api
      .get<OperationLookups>('lookups')
      .then((value) => alive && setLookups(value))
      .catch((err) => alive && setError(err.message));
    return () => {
      alive = false;
    };
  }, [reload]);
  useEffect(() => {
    let alive = true;
    setOrderItems([]);
    if (form.order_id && modal)
      api
        .get<Row[]>(`orders/${form.order_id}/items`)
        .then((value) => alive && setOrderItems(value))
        .catch((err) => alive && setModalError(err.message));
    return () => {
      alive = false;
    };
  }, [form.order_id, modal]);
  useEffect(() => {
    let alive = true;
    setSerialChoices([]);
    if (modal?.type === 'warranties' || (modal?.type === 'return-status' && form.status === 'received')) {
      api
        .get<OperationList>('serials', {
          limit: 100,
          status: 'sold',
          search: serialQuery,
          ...(modal.row?.order_item_id ? { order_item_id: modal.row.order_item_id } : {}),
        })
        .then((value) => alive && setSerialChoices(value.items))
        .catch((err) => alive && setModalError(err.message));
    }
    return () => {
      alive = false;
    };
  }, [modal, form.status, serialQuery]);

  const open = useCallback(
    (type: string, row?: Row, overrideTitle?: string, readOnly = false) => {
      setModalError('');
      setSerialSearch('');
      let initial: Row = row ? { ...row } : { is_active: true };
      if (type === 'receipts')
        initial = row
          ? { ...row, items: row.items.map((i: Row) => ({ ...i, serial_text: (i.serial_numbers || []).join('\n') })) }
          : { supplier_id: '', note: '', items: [{ product_id: '', quantity: 1, unit_cost: 0, serial_text: '' }] };
      if (type === 'templates' && !row)
        initial = {
          name: '',
          category_id: '',
          fields: [{ key: '', type: 'text', required: false, unit: '', options: [] }],
        };
      if (type === 'serials') initial = { product_id: '', serial_text: '' };
      if (type === 'assign') initial = { order_id: '', order_item_id: '' };
      if (type === 'retire') initial = { reason: '' };
      if (type === 'warranties') initial = { serial_id: '', customer_name: '', phone: '', issue: '' };
      if (type === 'warranty-status') initial = { status: warrantyNext[row!.status]?.[0] || '', resolution: '' };
      if (type === 'shipments')
        initial = { order_id: '', carrier: '', tracking_number: '', estimated_delivery: '', note: '' };
      if (type === 'shipment-status') initial = { status: shipNext[row!.status]?.[0] || '', location: '', note: '' };
      if (type === 'returns') initial = { order_id: '', order_item_id: '', quantity: 1, reason: '' };
      if (type === 'return-status')
        initial = {
          status:
            returnNext[row!.status]?.find(
              (s) => isAdmin || !['approved', 'rejected', 'refunded', 'closed'].includes(s),
            ) || '',
          refund_amount: row!.refund_amount,
          restock: false,
          serial_ids: [],
          note: '',
          refund_reference: '',
        };
      if (type === 'movements') initial = { product_id: '', stock: 0, reason: '' };
      setForm(initial);
      setModal({
        type,
        row,
        readOnly,
        title: overrideTitle || (row ? `Cập nhật ${info.title.toLowerCase()}` : info.add || info.title),
      });
    },
    [info, isAdmin],
  );

  const showReceipt = async (row: Row) => {
    try {
      const detail = await api.get<Row>(`receipts/${row.id}`);
      open('receipts', detail, `Phiếu nhập ${row.receipt_code}`, row.status !== 'draft');
    } catch (err) {
      toast.error((err as Error).message);
    }
  };
  const submit = async () => {
    if (!modal || busy || modal.readOnly) return;
    setBusy(true);
    setModalError('');
    try {
      const { type, row } = modal;
      if (['suppliers', 'brands', 'templates'].includes(type))
        await api.save(`${type}${row ? `/${row.id}` : ''}`, form, row ? 'put' : 'post');
      else if (type === 'receipts')
        await api.save(
          `receipts${row ? `/${row.id}` : ''}`,
          {
            ...form,
            items: form.items.map((i: Row) => ({
              product_id: i.product_id,
              quantity: i.quantity,
              unit_cost: i.unit_cost,
              serial_numbers: splitSerials(i.serial_text || ''),
            })),
          },
          row ? 'put' : 'post',
        );
      else if (type === 'receive' || type === 'cancel-receipt')
        await api.save(`receipts/${row!.id}/${type === 'receive' ? 'receive' : 'cancel'}`);
      else if (type === 'movements') await api.save('adjustments', form);
      else if (type === 'serials')
        await api.save('serials', {
          product_id: form.product_id,
          serial_numbers: splitSerials(form.serial_text || ''),
        });
      else if (type === 'assign' || type === 'retire') await api.save(`serials/${row!.id}/${type}`, form);
      else if (type === 'warranties' || type === 'shipments' || type === 'returns') await api.save(type, form);
      else if (type === 'warranty-status') await api.save(`warranties/${row!.id}`, form, 'patch');
      else if (type === 'shipment-status') await api.save(`shipments/${row!.id}`, form, 'patch');
      else if (type === 'return-status') await api.save(`returns/${row!.id}`, form, 'patch');
      toast.success('Đã lưu thành công');
      setModal(null);
      setReload((r) => r + 1);
    } catch (err) {
      setModalError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const actionButton = (label: string, fn: () => void) => (
    <button
      key={label}
      disabled={loading}
      type="button"
      onClick={fn}
      className="whitespace-nowrap rounded-md border border-slate-200 px-2 py-1 text-xs text-blue-700 hover:bg-blue-50"
    >
      {label}
    </button>
  );
  const actions = (row: Row): React.ReactNode => {
    if (['suppliers', 'brands', 'templates'].includes(kind))
      return isAdmin ? actionButton('Sửa', () => open(kind, row)) : null;
    if (kind === 'receipts')
      return (
        <>
          {actionButton('Chi tiết', () => void showReceipt(row))}
          {row.status === 'draft' && (
            <>
              {isAdmin && actionButton('Nhập kho', () => open('receive', row, `Xác nhận nhập kho ${row.receipt_code}`))}
              {actionButton('Hủy nháp', () => open('cancel-receipt', row, `Hủy ${row.receipt_code}`))}
            </>
          )}
        </>
      );
    if (kind === 'serials')
      return row.status === 'in_stock' ? (
        <>
          {actionButton('Gán đơn', () => open('assign', row, `Gán serial ${row.serial_number}`))}
          {isAdmin && actionButton('Thu hồi', () => open('retire', row, 'Thu hồi serial và giảm tồn'))}
        </>
      ) : null;
    if (kind === 'warranties')
      return warrantyNext[row.status]?.length
        ? actionButton('Xử lý', () => open('warranty-status', row, `Xử lý ${row.ticket_code}`))
        : row.resolution || '—';
    if (kind === 'shipments')
      return (
        <>
          {actionButton('Lịch sử', () => open('shipment-history', row, `Lịch sử ${row.tracking_number}`, true))}
          {shipNext[row.status]?.length
            ? actionButton('Cập nhật', () => open('shipment-status', row, 'Cập nhật vận chuyển'))
            : null}
        </>
      );
    if (kind === 'returns')
      return (
        <>
          {actionButton('Chi tiết', () => open('return-detail', row, `Đổi trả ${row.return_code}`, true))}
          {returnNext[row.status]?.some(
            (s) => isAdmin || !['approved', 'rejected', 'refunded', 'closed'].includes(s),
          ) && actionButton('Xử lý', () => open('return-status', row, `Xử lý ${row.return_code}`))}
        </>
      );
    if (kind === 'audit')
      return actionButton('Chi tiết', () => open('audit-detail', row, row.summary || 'Chi tiết nhật ký', true));
    return null;
  };

  const columns: { label: string; value: (r: Row) => React.ReactNode }[] = {
    suppliers: [
      {
        label: 'Mã / Nhà cung cấp',
        value: (r: Row) => (
          <>
            <b>{r.code}</b>
            <div>{r.name}</div>
          </>
        ),
      },
      {
        label: 'Liên hệ',
        value: (r: Row) => (
          <>
            {r.contact_name}
            <div>{r.phone}</div>
            <div className="text-xs text-slate-400">{r.email}</div>
          </>
        ),
      },
      {
        label: 'Địa chỉ / MST',
        value: (r: Row) => (
          <>
            {r.address}
            <div className="text-xs text-slate-400">{r.tax_code}</div>
          </>
        ),
      },
      { label: 'Hoạt động', value: (r: Row) => (Number(r.is_active) ? 'Đang hợp tác' : 'Ngừng hợp tác') },
    ],
    brands: [
      { label: 'Tên hãng', value: (r: Row) => <b>{r.name}</b> },
      { label: 'Website', value: (r: Row) => r.website || '—' },
      { label: 'Trạng thái', value: (r: Row) => (Number(r.is_active) ? 'Đang hoạt động' : 'Đã ẩn') },
    ],
    templates: [
      { label: 'Tên mẫu', value: (r: Row) => <b>{r.name}</b> },
      { label: 'Danh mục', value: (r: Row) => r.category_name },
      {
        label: 'Thông số',
        value: (r: Row) => (
          <span className="text-xs">{r.fields.map((f: Row) => `${f.key}${f.required ? '*' : ''}`).join(' · ')}</span>
        ),
      },
    ],
    receipts: [
      {
        label: 'Phiếu nhập',
        value: (r: Row) => (
          <>
            <b>{r.receipt_code}</b>
            <div className="text-xs text-slate-400">{dateTime(r.created_at)}</div>
          </>
        ),
      },
      { label: 'Nhà cung cấp', value: (r: Row) => r.supplier_name },
      { label: 'Tổng tiền', value: (r: Row) => money(r.total) },
      { label: 'Trạng thái', value: (r: Row) => <Status value={r.status} /> },
    ],
    movements: [
      { label: 'Thời gian', value: (r: Row) => dateTime(r.created_at) },
      {
        label: 'Sản phẩm',
        value: (r: Row) => (
          <>
            {r.product_name}
            <div className="text-xs text-slate-400">{r.sku}</div>
          </>
        ),
      },
      {
        label: 'Nghiệp vụ',
        value: (r: Row) => (
          <>
            {labels[r.kind] || r.kind}
            <div className="text-xs text-slate-400">
              {r.reference_type} #{r.reference_id}
            </div>
          </>
        ),
      },
      {
        label: 'Thay đổi tồn',
        value: (r: Row) => (
          <>
            <strong className={Number(r.quantity) > 0 ? 'text-green-600' : 'text-red-600'}>
              {Number(r.quantity) > 0 ? '+' : ''}
              {r.quantity}
            </strong>
            <div className="text-xs">
              {r.before_stock} → {r.after_stock}
            </div>
          </>
        ),
      },
      {
        label: 'Người / Lý do',
        value: (r: Row) => (
          <>
            {r.actor_name || 'Hệ thống'}
            <div className="max-w-xs text-xs text-slate-500">{r.reason}</div>
          </>
        ),
      },
    ],
    serials: [
      {
        label: 'Serial / sản phẩm',
        value: (r: Row) => (
          <>
            <b>{r.serial_number}</b>
            <div className="text-xs">{r.product_name}</div>
          </>
        ),
      },
      {
        label: 'Đơn bán',
        value: (r: Row) => (
          <>
            {r.order_code || '—'}
            <div className="text-xs text-slate-400">{r.customer_name}</div>
          </>
        ),
      },
      { label: 'Hạn bảo hành', value: (r: Row) => dateTime(r.warranty_expires_at) },
      { label: 'Trạng thái', value: (r: Row) => <Status value={r.status} /> },
    ],
    warranties: [
      {
        label: 'Phiếu / serial',
        value: (r: Row) => (
          <>
            <b>{r.ticket_code}</b>
            <div className="text-xs">
              {r.serial_number} · {r.product_name}
            </div>
          </>
        ),
      },
      {
        label: 'Khách hàng',
        value: (r: Row) => (
          <>
            {r.customer_name}
            <div className="text-xs">{r.phone}</div>
          </>
        ),
      },
      {
        label: 'Lỗi',
        value: (r: Row) => <span className="block max-w-xs whitespace-pre-wrap text-xs">{r.issue}</span>,
      },
      { label: 'Bảo hành', value: (r: Row) => (Number(r.covered_by_warranty) ? 'Trong hạn' : 'Ngoài hạn') },
      { label: 'Trạng thái', value: (r: Row) => <Status value={r.status} /> },
    ],
    shipments: [
      {
        label: 'Vận đơn',
        value: (r: Row) => (
          <>
            <b>{r.tracking_number}</b>
            <div className="text-xs">{r.carrier}</div>
          </>
        ),
      },
      {
        label: 'Đơn / Khách',
        value: (r: Row) => (
          <>
            {r.order_code}
            <div className="text-xs">
              {r.customer_name} · {r.customer_phone}
            </div>
          </>
        ),
      },
      { label: 'Dự kiến giao', value: (r: Row) => dateTime(r.estimated_delivery) },
      { label: 'Trạng thái', value: (r: Row) => <Status value={r.status} /> },
    ],
    returns: [
      {
        label: 'Phiếu / Đơn',
        value: (r: Row) => (
          <>
            <b>{r.return_code}</b>
            <div className="text-xs">{r.order_code}</div>
          </>
        ),
      },
      {
        label: 'Hàng trả',
        value: (r: Row) => (
          <>
            {r.product_name}
            <div className="text-xs">Số lượng: {r.quantity}</div>
          </>
        ),
      },
      { label: 'Khách hàng', value: (r: Row) => r.customer_name },
      { label: 'Tiền hoàn', value: (r: Row) => money(r.refund_amount) },
      { label: 'Trạng thái', value: (r: Row) => <Status value={r.status} /> },
    ],
    audit: [
      { label: 'Thời gian', value: (r: Row) => dateTime(r.created_at) },
      { label: 'Người thao tác', value: (r: Row) => r.actor_name },
      { label: 'Hành động', value: (r: Row) => r.action },
      { label: 'Đối tượng', value: (r: Row) => `${r.entity_type}${r.entity_id ? ` #${r.entity_id}` : ''}` },
      { label: 'Nội dung', value: (r: Row) => <span className="block max-w-sm text-xs">{r.summary}</span> },
    ],
  }[kind];

  const textField = (key: string, label: string, options: Record<string, any> = {}) => (
    <TextField key={key} label={label} value={form[key]} onChange={(v) => set(key, v)} {...options} />
  );
  const productSelect = (key = 'product_id') => (
    <SelectField
      label="Sản phẩm"
      value={form[key]}
      onChange={(v) => set(key, v)}
      items={lookups.products}
      text={(p) => `${p.sku || `#${p.id}`} · ${p.name} (tồn ${p.stock})`}
    />
  );
  const orderSelect = () => (
    <SelectField
      label="Đơn hàng"
      value={form.order_id}
      onChange={(v) => {
        set('order_id', v);
        set('order_item_id', '');
      }}
      items={lookups.orders}
      text={(o) => `${o.order_code} · ${o.customer_name} · ${labels[o.status] || o.status}`}
    />
  );
  const statusSelect = (options: string[]) => (
    <SelectField
      label="Chuyển sang trạng thái"
      value={form.status}
      onChange={(v) => set('status', v)}
      items={options.map((s) => ({ id: s, name: labels[s] || s }))}
    />
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{info.title}</h1>
        </div>
        <div className="flex gap-2">
          <button type="button" className={buttonClass} onClick={() => setReload((n) => n + 1)} aria-label="Làm mới">
            <ArrowPathIcon className="h-4 w-4" />
          </button>
          {info.add && (!adminOnlyAdd.has(kind) || isAdmin) && (
            <button className={primaryClass} onClick={() => open(kind)}>
              <PlusIcon className="h-4 w-4" />
              {info.add}
            </button>
          )}
        </div>
      </div>
      <div className="frost-card flex flex-wrap items-end gap-3 p-4">
        <div className="min-w-[180px] flex-1">
          <TextField label="Tìm kiếm" value={search} onChange={setSearch} placeholder={info.searchPlaceholder} />
        </div>
        {info.statuses && (
          <div className="min-w-[160px]">
            <Field label="Trạng thái">
              <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
                <option value="">Tất cả</option>
                {info.statuses.map((s) => (
                  <option key={s} value={s}>
                    {s === 'active' ? 'Đang xử lý (tất cả)' : labels[s] || s}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        )}
        {['movements', 'serials'].includes(kind) && (
          <div className="min-w-[180px] max-w-sm">
            <SelectField
              label="Lọc sản phẩm"
              value={productId}
              onChange={setProductId}
              items={lookups.products}
              required={false}
            />
          </div>
        )}
        {['receipts', 'movements', 'warranties', 'returns', 'shipments', 'audit'].includes(kind) && (
          <>
            <TextField label="Từ ngày" value={from} onChange={setFrom} type="date" />
            <TextField label="Đến ngày" value={to} onChange={setTo} type="date" />
          </>
        )}
      </div>
      {error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
          <button onClick={() => setReload((n) => n + 1)} className="ml-3 underline">
            Thử lại
          </button>
        </div>
      )}
      <TableView key={kind} id={kind} columns={[...columns.map((c) => c.label), 'Thao tác']}>
        <div className="frost-card overflow-hidden" aria-busy={loading}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  {columns.map((col) => (
                    <th
                      key={col.label}
                      className={`whitespace-nowrap px-4 py-3 ${['Tổng tiền', 'Tiền hoàn'].includes(col.label) ? 'text-right' : ''}`}
                    >
                      {col.label}
                    </th>
                  ))}
                  <th className="px-4 py-3">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading && !data.items.length ? (
                  <tr>
                    <td colSpan={columns.length + 1} className="p-10 text-center text-slate-400">
                      Đang tải…
                    </td>
                  </tr>
                ) : !data.items.length ? (
                  <tr>
                    <td colSpan={columns.length + 1} className="p-10 text-center text-slate-400">
                      Chưa có dữ liệu phù hợp
                    </td>
                  </tr>
                ) : (
                  data.items.map((row) => (
                    <tr key={row.id} className="text-slate-700 hover:bg-slate-50/60">
                      {columns.map((col) => (
                        <td
                          key={col.label}
                          className={`px-4 py-3 align-top ${['Tổng tiền', 'Tiền hoàn'].includes(col.label) ? 'text-right tabular-nums' : ''}`}
                        >
                          {col.value(row)}
                        </td>
                      ))}
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1.5">{actions(row)}</div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between gap-2 border-t border-slate-200 px-4 py-3 text-xs text-slate-500">
            <span>
              {data.total} dòng · trang {page}/{Math.max(1, Math.ceil(data.total / 20))}
            </span>
            <div className="flex gap-2">
              <button className={buttonClass} disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)}>
                Trước
              </button>
              <button
                className={buttonClass}
                disabled={page * 20 >= data.total || loading}
                onClick={() => setPage((p) => p + 1)}
              >
                Sau
              </button>
            </div>
          </div>
        </div>
      </TableView>

      {modal && (
        <OperationModal
          title={modal.title}
          busy={busy}
          onClose={() => setModal(null)}
          onSubmit={() => void submit()}
          error={modalError}
          readOnly={modal.readOnly}
          submitLabel={
            modal.type === 'receive'
              ? 'Xác nhận nhập kho'
              : modal.type === 'return-status' && form.status === 'refunded'
                ? 'Ghi nhận đã hoàn tiền'
                : 'Lưu'
          }
        >
          {modal.type === 'suppliers' && (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                {textField('code', 'Mã nhà cung cấp', { required: true })}
                {textField('name', 'Tên nhà cung cấp', { required: true })}
                {textField('contact_name', 'Người liên hệ')}
                {textField('phone', 'Điện thoại')}
                {textField('email', 'Email', { type: 'email' })}
                {textField('tax_code', 'Mã số thuế')}
              </div>
              {textField('address', 'Địa chỉ')}
              {textField('notes', 'Ghi chú', { textarea: true })}
              <label className="flex gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={!!form.is_active}
                  onChange={(e) => set('is_active', e.target.checked)}
                />
                Đang hợp tác
              </label>
            </>
          )}
          {modal.type === 'brands' && (
            <>
              {textField('name', 'Tên thương hiệu', { required: true })}
              {textField('website', 'Website', { type: 'url' })}
              <label className="flex gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={!!form.is_active}
                  onChange={(e) => set('is_active', e.target.checked)}
                />
                Đang hoạt động
              </label>
            </>
          )}
          {modal.type === 'templates' && (
            <>
              {textField('name', 'Tên mẫu', { required: true })}
              <SelectField
                label="Danh mục áp dụng"
                value={form.category_id}
                onChange={(v) => set('category_id', v)}
                items={lookups.categories}
              />
              <p className="text-xs text-slate-500">
                Mẫu đang được sản phẩm sử dụng chỉ đổi tên; tạo mẫu mới nếu cần đổi cấu trúc.
              </p>
              {(form.fields || []).map((field: Row, index: number) => (
                <div key={index} className="space-y-2 rounded-lg border border-slate-200 p-3">
                  <div className="grid gap-2 sm:grid-cols-3">
                    <TextField
                      label="Tên thông số"
                      value={field.key}
                      required
                      onChange={(v) =>
                        set(
                          'fields',
                          form.fields.map((f: Row, i: number) => (i === index ? { ...f, key: v } : f)),
                        )
                      }
                    />
                    <Field label="Kiểu dữ liệu">
                      <select
                        className={inputClass}
                        value={field.type}
                        onChange={(e) =>
                          set(
                            'fields',
                            form.fields.map((f: Row, i: number) => (i === index ? { ...f, type: e.target.value } : f)),
                          )
                        }
                      >
                        <option value="text">Văn bản</option>
                        <option value="number">Số không âm</option>
                        <option value="select">Danh sách chọn</option>
                      </select>
                    </Field>
                    <TextField
                      label="Đơn vị"
                      value={field.unit}
                      onChange={(v) =>
                        set(
                          'fields',
                          form.fields.map((f: Row, i: number) => (i === index ? { ...f, unit: v } : f)),
                        )
                      }
                    />
                  </div>
                  {field.type === 'select' && (
                    <TextField
                      label="Lựa chọn, ngăn cách bằng dấu phẩy"
                      value={(field.options || []).join(',')}
                      required
                      onChange={(v) =>
                        set(
                          'fields',
                          form.fields.map((f: Row, i: number) =>
                            i === index ? { ...f, options: v.split(',').map((x) => x.trim()) } : f,
                          ),
                        )
                      }
                    />
                  )}
                  <div className="flex justify-between">
                    <label className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={!!field.required}
                        onChange={(e) =>
                          set(
                            'fields',
                            form.fields.map((f: Row, i: number) =>
                              i === index ? { ...f, required: e.target.checked } : f,
                            ),
                          )
                        }
                      />
                      Bắt buộc
                    </label>
                    <button
                      type="button"
                      disabled={form.fields.length < 2}
                      onClick={() =>
                        set(
                          'fields',
                          form.fields.filter((_: Row, i: number) => i !== index),
                        )
                      }
                      className="text-xs text-red-600"
                    >
                      Xóa trường
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                className={buttonClass}
                onClick={() =>
                  set('fields', [...form.fields, { key: '', type: 'text', unit: '', required: false, options: [] }])
                }
              >
                Thêm thông số
              </button>
            </>
          )}
          {modal.type === 'receipts' && (
            <>
              <SelectField
                label="Nhà cung cấp"
                value={form.supplier_id}
                onChange={(v) => set('supplier_id', v)}
                items={lookups.suppliers.filter((s) => Number(s.is_active) || s.id === Number(form.supplier_id))}
              />
              {textField('note', 'Ghi chú', { textarea: true })}
              {(form.items || []).map((item: Row, index: number) => (
                <div key={index} className="space-y-3 rounded-xl border border-slate-200 p-3">
                  <SelectField
                    label={`Sản phẩm dòng ${index + 1}`}
                    value={item.product_id}
                    items={lookups.products}
                    onChange={(v) =>
                      set(
                        'items',
                        form.items.map((r: Row, i: number) => (i === index ? { ...r, product_id: v } : r)),
                      )
                    }
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <TextField
                      label="Số lượng"
                      type="number"
                      min={1}
                      max={10000}
                      required
                      value={item.quantity}
                      onChange={(v) =>
                        set(
                          'items',
                          form.items.map((r: Row, i: number) => (i === index ? { ...r, quantity: v } : r)),
                        )
                      }
                    />
                    <TextField
                      label="Giá nhập / đơn vị (VNĐ)"
                      type="number"
                      min={0}
                      required
                      value={item.unit_cost}
                      onChange={(v) =>
                        set(
                          'items',
                          form.items.map((r: Row, i: number) => (i === index ? { ...r, unit_cost: v } : r)),
                        )
                      }
                    />
                  </div>
                  <TextField
                    label="Serial (mỗi dòng một số, bắt buộc nếu hàng theo serial)"
                    textarea
                    value={item.serial_text}
                    onChange={(v) =>
                      set(
                        'items',
                        form.items.map((r: Row, i: number) => (i === index ? { ...r, serial_text: v } : r)),
                      )
                    }
                  />
                  <div className="flex justify-between text-sm">
                    <b>{money(Number(item.quantity) * Number(item.unit_cost))}</b>
                    <button
                      type="button"
                      disabled={form.items.length === 1}
                      onClick={() =>
                        set(
                          'items',
                          form.items.filter((_: Row, i: number) => i !== index),
                        )
                      }
                      className="text-red-600"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              {!modal.readOnly && (
                <button
                  type="button"
                  className={buttonClass}
                  onClick={() =>
                    set('items', [...form.items, { product_id: '', quantity: 1, unit_cost: 0, serial_text: '' }])
                  }
                >
                  Thêm dòng hàng
                </button>
              )}
              <p className="text-right font-semibold">
                Tổng:{' '}
                {money(
                  (form.items || []).reduce((n: number, i: Row) => n + Number(i.quantity) * Number(i.unit_cost), 0),
                )}
              </p>
            </>
          )}
          {modal.type === 'receive' && (
            <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
              Xác nhận đã nhận đủ hàng của phiếu <b>{modal.row!.receipt_code}</b>. Hệ thống sẽ cộng tồn kho và đăng ký
              serial trong cùng một giao dịch. Phiếu đã nhập không sửa hoặc nhập lại được.
            </p>
          )}
          {modal.type === 'cancel-receipt' && (
            <p className="text-sm text-slate-600">
              Hủy phiếu nháp {modal.row!.receipt_code}? Thao tác không thay đổi tồn kho.
            </p>
          )}
          {modal.type === 'movements' && (
            <>
              {productSelect()}
              {textField('stock', 'Tồn kho thực tế sau điều chỉnh', { type: 'number', min: 0, required: true })}
              {textField('reason', 'Lý do kiểm kê / điều chỉnh', { required: true, textarea: true })}
              <p className="text-xs text-slate-500">
                Hàng theo serial phải điều chỉnh bằng phiếu nhập hoặc thu hồi serial.
              </p>
            </>
          )}
          {modal.type === 'serials' && (
            <>
              {productSelect()}
              {textField('serial_text', 'Danh sách serial (mỗi dòng một số)', { required: true, textarea: true })}
              <p className="rounded-lg bg-blue-50 p-3 text-xs text-blue-700">
                Dùng cho hàng đã có tồn nhưng chưa đăng ký serial. Thao tác này không cộng thêm tồn kho. Hàng mới mua về
                cần lập phiếu nhập.
              </p>
            </>
          )}
          {modal.type === 'assign' && (
            <>
              {orderSelect()}
              <SelectField
                label="Dòng hàng trong đơn"
                value={form.order_item_id}
                onChange={(v) => set('order_item_id', v)}
                items={orderItems.filter((i) => Number(i.product_id) === Number(modal.row!.product_id))}
                text={(i) => `${i.product_name} · số lượng ${i.quantity}`}
              />
              <p className="text-xs text-slate-500">
                Hạn bảo hành bắt đầu từ thời điểm gán serial, theo số tháng cài đặt trên sản phẩm.
              </p>
            </>
          )}
          {modal.type === 'retire' && (
            <>
              {textField('reason', 'Lý do thu hồi khỏi kho', { required: true, textarea: true })}
              <p className="text-sm text-amber-700">
                Serial {modal.row!.serial_number} sẽ không còn bán được và tồn kho giảm 1.
              </p>
            </>
          )}
          {modal.type === 'warranties' && (
            <>
              <TextField label="Tìm serial đã bán" value={serialSearch} onChange={setSerialSearch} />
              <SelectField
                label="Serial tiếp nhận"
                value={form.serial_id}
                onChange={(v) => set('serial_id', v)}
                items={serialChoices}
                text={(s) => `${s.serial_number} · ${s.product_name} · ${s.order_code}`}
              />
              {textField('customer_name', 'Tên khách (trống: lấy từ đơn)')}
              {textField('phone', 'Điện thoại (trống: lấy từ đơn)')}
              {textField('issue', 'Mô tả lỗi / tình trạng tiếp nhận', { required: true, textarea: true })}
            </>
          )}
          {modal.type === 'warranty-status' && (
            <>
              {statusSelect(warrantyNext[modal.row!.status] || [])}
              {textField('resolution', 'Kết quả / ghi chú xử lý', {
                textarea: true,
                required: ['resolved', 'rejected'].includes(form.status),
              })}
            </>
          )}
          {modal.type === 'shipments' && (
            <>
              {orderSelect()}
              <div className="grid gap-3 sm:grid-cols-2">
                {textField('carrier', 'Đơn vị vận chuyển', { required: true })}
                {textField('tracking_number', 'Mã vận đơn', { required: true })}
              </div>
              {textField('estimated_delivery', 'Ngày dự kiến giao', { type: 'date' })}
              {textField('note', 'Ghi chú', { textarea: true })}
            </>
          )}
          {modal.type === 'shipment-status' && (
            <>
              {statusSelect(shipNext[modal.row!.status] || [])}
              {textField('location', 'Vị trí hiện tại')}
              {textField('note', 'Ghi chú sự kiện', { textarea: true })}
              <p className="text-xs text-slate-500">
                Bàn giao sẽ chuyển đơn sang đang giao; giao thành công sẽ chuyển đơn sang đã giao và ghi nhận thu tiền
                với COD.
              </p>
            </>
          )}
          {modal.type === 'shipment-history' && (
            <>
              <p className="text-sm">
                {modal.row!.customer_name} · {modal.row!.customer_phone}
                <br />
                {modal.row!.customer_address}, {modal.row!.customer_city}
              </p>
              <ol className="space-y-3">
                {(modal.row!.tracking_data || []).map((event: Row, index: number) => (
                  <li key={index} className="rounded-lg border border-slate-200 p-3">
                    <Status value={event.status} />
                    <p className="mt-1 text-xs text-slate-500">
                      {dateTime(event.at)} · {event.by}
                    </p>
                    <p className="mt-1 text-sm">{event.note}</p>
                  </li>
                ))}
              </ol>
            </>
          )}
          {modal.type === 'returns' && (
            <>
              {orderSelect()}
              <SelectField
                label="Hàng cần trả"
                value={form.order_item_id}
                onChange={(v) => set('order_item_id', v)}
                items={orderItems}
                text={(i) => `${i.product_name} · đã mua ${i.quantity} · ${money(i.price)}`}
              />
              {textField('quantity', 'Số lượng trả', { type: 'number', min: 1, required: true })}
              {textField('reason', 'Lý do đổi trả', { textarea: true, required: true })}
              <p className="text-xs text-slate-500">
                Tiền hoàn dự kiến được tính theo giá mua sau phân bổ giảm giá, chưa gồm phí vận chuyển. Quản trị viên
                duyệt số tiền thực tế.
              </p>
            </>
          )}
          {modal.type === 'return-status' && (
            <>
              {statusSelect(
                (returnNext[modal.row!.status] || []).filter(
                  (s) => isAdmin || !['approved', 'rejected', 'refunded', 'closed'].includes(s),
                ),
              )}
              {form.status === 'approved' &&
                textField('refund_amount', 'Số tiền duyệt hoàn (VNĐ)', { type: 'number', min: 0, required: true })}
              {form.status === 'received' && (
                <>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={!!form.restock}
                      onChange={(e) => set('restock', e.target.checked)}
                    />
                    Hàng còn bán được — nhập lại kho
                  </label>
                  <p className="text-xs text-slate-500">
                    Hàng hỏng không chọn nhập lại kho. Nếu hàng theo serial, cần chọn đủ serial trả bên dưới.
                  </p>
                  <div className="max-h-48 space-y-2 overflow-auto rounded-lg border border-slate-200 p-3">
                    {serialChoices.map((s) => (
                      <label key={s.id} className="flex gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={(form.serial_ids || []).includes(s.id)}
                          onChange={(e) =>
                            set(
                              'serial_ids',
                              e.target.checked
                                ? [...(form.serial_ids || []), s.id]
                                : form.serial_ids.filter((i: number) => i !== s.id),
                            )
                          }
                        />
                        {s.serial_number}
                      </label>
                    ))}
                    {!serialChoices.length && (
                      <p className="text-xs text-slate-400">Không có serial đã bán thuộc dòng hàng này.</p>
                    )}
                  </div>
                </>
              )}
              {form.status === 'refunded' && (
                <>
                  <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                    Chỉ xác nhận sau khi bạn đã thực sự hoàn {money(modal.row!.refund_amount)} cho khách. Hệ thống chỉ
                    ghi nhận, không tự chuyển tiền.
                  </p>
                  {textField('refund_reference', 'Mã giao dịch / biên nhận hoàn tiền', { required: true })}
                </>
              )}
              {textField('note', 'Ghi chú xử lý', {
                textarea: true,
                required: ['rejected', 'cancelled'].includes(form.status),
              })}
            </>
          )}
          {modal.type === 'return-detail' && (
            <dl className="space-y-2 text-sm">
              <div>
                <b>Khách:</b> {modal.row!.customer_name}
              </div>
              <div>
                <b>Sản phẩm:</b> {modal.row!.product_name} × {modal.row!.quantity}
              </div>
              <div>
                <b>Lý do:</b> {modal.row!.reason}
              </div>
              <div>
                <b>Nhập lại kho:</b> {Number(modal.row!.restock) ? 'Có' : 'Không'}
              </div>
              <div>
                <b>Số tiền:</b> {money(modal.row!.refund_amount)}
              </div>
              <div>
                <b>Biên nhận:</b> {modal.row!.refund_reference || '—'}
              </div>
              <div>
                <b>Ghi chú:</b> {modal.row!.note || '—'}
              </div>
            </dl>
          )}
          {modal.type === 'audit-detail' && (
            <>
              <p className="text-sm">
                {modal.row!.actor_name} · {dateTime(modal.row!.created_at)}
                <br />
                {modal.row!.action} · {modal.row!.entity_type} #{modal.row!.entity_id}
              </p>
              <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-xs text-slate-700">
                {JSON.stringify(modal.row!.changes, null, 2) || 'Không có dữ liệu thay đổi chi tiết'}
              </pre>
            </>
          )}
        </OperationModal>
      )}
    </div>
  );
};

export const CatalogStandardsPage: React.FC = () => {
  const [tab, setTab] = useState<'brands' | 'templates'>('brands');
  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        {(['brands', 'templates'] as const).map((s) => (
          <button key={s} onClick={() => setTab(s)} className={tab === s ? primaryClass : buttonClass}>
            {meta[s].title}
          </button>
        ))}
      </div>
      <OperationsPage key={tab} kind={tab} />
    </div>
  );
};
export const WarrantyManagementPage: React.FC = () => {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'warranties' ? 'warranties' : 'serials';
  const setTab = (value: 'serials' | 'warranties') => {
    const next = new URLSearchParams(params);
    next.set('tab', value);
    next.delete('status');
    setParams(next, { replace: true });
  };
  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        {(['serials', 'warranties'] as const).map((s) => (
          <button key={s} onClick={() => setTab(s)} className={tab === s ? primaryClass : buttonClass}>
            {meta[s].title}
          </button>
        ))}
      </div>
      <OperationsPage key={tab} kind={tab} />
    </div>
  );
};

export default OperationsPage;
