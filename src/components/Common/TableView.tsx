import React, { useId, useState } from 'react';

/** Per-table presentation preferences; the identity and action columns stay visible. */
export default function TableView({
  id,
  columns,
  children,
}: {
  id: string;
  columns: string[];
  children: React.ReactNode;
}) {
  const scope = `table-${useId().replace(/[^a-z0-9]/gi, '')}`;
  const key = `shoppc.table.${id}`;
  const [prefs, setPrefs] = useState<{ compact: boolean; hidden: string[] }>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(key) || '{}');
      return {
        compact: saved.compact === true,
        hidden: Array.isArray(saved.hidden) ? saved.hidden.filter((v: unknown) => typeof v === 'string') : [],
      };
    } catch {
      return { compact: false, hidden: [] };
    }
  });
  const update = (next: typeof prefs) => {
    setPrefs(next);
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      /* storage can be disabled */
    }
  };
  const hidden = columns.flatMap((label, i) =>
    i > 0 && i < columns.length - 1 && prefs.hidden.includes(label) ? [i + 1] : [],
  );
  return (
    <section id={scope} className="table-view min-w-0" aria-label="Bảng dữ liệu">
      <div className="mb-3 flex flex-wrap items-center justify-end gap-3 text-xs text-slate-600">
        <label className="flex items-center gap-2">
          Mật độ dòng
          <select
            aria-label="Mật độ dòng"
            value={prefs.compact ? 'compact' : 'normal'}
            onChange={(e) => update({ ...prefs, compact: e.target.value === 'compact' })}
            className="rounded-lg border border-slate-200 bg-white px-2 py-2"
          >
            <option value="normal">Thoải mái</option>
            <option value="compact">Gọn</option>
          </select>
        </label>
        <details className="relative">
          <summary className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2">
            Cột hiển thị
          </summary>
          <div className="mt-2 min-w-56 space-y-2 rounded-xl border border-slate-200 bg-white p-4 shadow-lg">
            {columns.map((label, i) => (
              <label key={label} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  disabled={i === 0 || i === columns.length - 1}
                  checked={i === 0 || i === columns.length - 1 || !prefs.hidden.includes(label)}
                  onChange={(e) =>
                    update({
                      ...prefs,
                      hidden: e.target.checked ? prefs.hidden.filter((h) => h !== label) : [...prefs.hidden, label],
                    })
                  }
                />
                {label}
              </label>
            ))}
          </div>
        </details>
      </div>
      <style>{`#${scope} .overflow-x-auto{max-height:70vh;overflow:auto} #${scope} thead{position:sticky;top:0;z-index:10} #${scope} th,#${scope} td{${prefs.compact ? 'padding-top:.5rem;padding-bottom:.5rem;' : ''}} ${hidden.map((n) => `#${scope} tr>*:nth-child(${n}):not([colspan]){display:none}`).join(' ')}`}</style>
      {children}
    </section>
  );
}
