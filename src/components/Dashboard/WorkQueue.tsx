import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { operationsService, OperationList } from '../../services/operationsService';

export default function WorkQueue({
  pending,
  lowStock,
  refreshKey,
}: {
  pending: number;
  lowStock: number;
  refreshKey: string;
}) {
  const [counts, setCounts] = useState<{ returns?: number; warranties?: number }>({});
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let alive = true;
    setFailed(false);
    setCounts({});
    Promise.allSettled([
      operationsService.get<OperationList>('returns', { status: 'requested', limit: 1 }),
      Promise.all(
        ['received', 'diagnosing', 'repairing'].map((status) =>
          operationsService.get<OperationList>('warranties', { status, limit: 1 }),
        ),
      ),
    ]).then(([returns, warranties]) => {
      if (!alive) return;
      setCounts({
        returns: returns.status === 'fulfilled' ? returns.value.total : undefined,
        warranties:
          warranties.status === 'fulfilled' ? warranties.value.reduce((sum, list) => sum + list.total, 0) : undefined,
      });
      setFailed(returns.status === 'rejected' || warranties.status === 'rejected');
    });
    return () => {
      alive = false;
    };
  }, [refreshKey, retry]);
  return (
    <section aria-labelledby="work-queue-title" className="rounded-2xl bg-white p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 id="work-queue-title" className="text-lg font-semibold text-slate-900">
          Việc cần xử lý
        </h2>
        <p className="text-xs text-slate-500">Toàn bộ thời gian</p>
      </div>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          {
            label: 'Đơn chờ xác nhận',
            count: pending,
            to: '/admin/orders?status=pending',
            description: 'Kiểm tra và xác nhận đơn',
          },
          {
            label: 'Sản phẩm sắp hết',
            count: lowStock,
            to: '/admin/products?stock=low',
            description: 'Xem hàng cần nhập thêm',
          },
          {
            label: 'Đổi trả chờ duyệt',
            count: counts.returns,
            to: '/admin/returns?status=requested',
            description: 'Xem yêu cầu từ khách',
          },
          {
            label: 'Bảo hành đang xử lý',
            count: counts.warranties,
            to: '/admin/warranty?tab=warranties&status=active',
            description: 'Tiếp nhận, kiểm tra, sửa chữa',
          },
        ].map((item) => (
          <Link key={item.to} to={item.to} className="rounded-xl bg-slate-50 p-4 transition-colors hover:bg-blue-50">
            <p className="text-xs font-medium text-slate-600">{item.label}</p>
            <p aria-live="polite" className="my-2 text-3xl font-semibold tabular-nums text-blue-600">
              {item.count ?? (failed ? '—' : '…')}
            </p>
            <p className="text-xs text-slate-500">{item.description} →</p>
          </Link>
        ))}
      </div>
      {failed && (
        <p role="alert" className="mt-3 text-xs text-red-600">
          Chưa tải được số liệu đổi trả hoặc bảo hành.{' '}
          <button type="button" onClick={() => setRetry((v) => v + 1)} className="underline">
            Thử lại
          </button>
        </p>
      )}
    </section>
  );
}
