import React from 'react';

interface PaginationProps {
  page: number;
  pages: number;
  total: number;
  pageSize: number;
  onChange: (page: number) => void;
  /** Tên đơn vị để hiển thị, ví dụ "đơn", "sản phẩm". */
  unit?: string;
}

/** Dãy số trang gọn: luôn có trang đầu/cuối, quanh trang hiện tại 1 trang, dùng "…" cho phần bị lược. */
export const pageWindow = (page: number, pages: number): (number | '…')[] => {
  const set = new Set<number>([1, pages, page - 1, page, page + 1]);
  const nums = [...set].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);
  const out: (number | '…')[] = [];
  nums.forEach((n, i) => {
    if (i > 0 && n - nums[i - 1] > 1) out.push('…');
    out.push(n);
  });
  return out;
};

const Pagination: React.FC<PaginationProps> = ({ page, pages, total, pageSize, onChange, unit = 'mục' }) => {
  if (total === 0) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const btn = 'rounded-lg border px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-40';

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t bg-white px-4 py-3">
      <p className="text-sm text-gray-600">
        Hiển thị {from}–{to} trong {total} {unit}
      </p>
      {pages > 1 && (
        <nav aria-label="Phân trang" className="flex items-center gap-1">
          <button className={`${btn} hover:bg-gray-50`} disabled={page <= 1} onClick={() => onChange(page - 1)}>
            Trước
          </button>
          {pageWindow(page, pages).map((n, i) =>
            n === '…' ? (
              <span key={`gap-${i}`} className="px-2 text-gray-400">
                …
              </span>
            ) : (
              <button
                key={n}
                aria-current={n === page ? 'page' : undefined}
                onClick={() => onChange(n)}
                className={`${btn} ${n === page ? 'border-blue-600 bg-blue-600 text-white' : 'hover:bg-gray-50'}`}
              >
                {n}
              </button>
            )
          )}
          <button className={`${btn} hover:bg-gray-50`} disabled={page >= pages} onClick={() => onChange(page + 1)}>
            Sau
          </button>
        </nav>
      )}
    </div>
  );
};

export default Pagination;
