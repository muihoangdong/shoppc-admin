import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowTrendingDownIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';

interface KpiCardProps {
  label: string;
  value: React.ReactNode;
  unit?: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  tone?: 'blue' | 'cyan' | 'purple' | 'red';
  /** % thay đổi so với kỳ trước (null = không so sánh được) */
  delta?: number | null;
  deltaLabel?: string;
  footer?: React.ReactNode;
  to?: string;
}

const TONES = {
  blue: 'bg-blue-50 text-blue-600 border-blue-200',
  cyan: 'bg-sky-50 text-sky-600 border-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/30',
  purple: 'bg-purple-50 text-purple-600 border-purple-200',
  red: 'bg-red-50 text-red-600 border-red-200',
};

/** Thẻ số liệu chính của dashboard: nhãn mono, số lớn, biểu tượng, % so với kỳ trước. */
export const KpiCard: React.FC<KpiCardProps> = ({ label, value, unit, icon: Icon, tone = 'blue', delta, deltaLabel, footer, to }) => {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="frost-label !text-[10px]">{label}</p>
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${TONES[tone]}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-1 flex items-baseline gap-1.5">
        <span className={`truncate text-2xl font-bold tabular-nums ${tone === 'red' ? 'text-red-600' : 'text-slate-900'}`}>{value}</span>
        {unit && <span className="text-sm text-slate-500">{unit}</span>}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        {delta !== undefined && delta !== null && Number.isFinite(delta) && (
          <span
            className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[11px] font-semibold ${
              delta >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
            }`}
          >
            {delta >= 0 ? <ArrowTrendingUpIcon className="h-3.5 w-3.5" /> : <ArrowTrendingDownIcon className="h-3.5 w-3.5" />}
            {delta >= 0 ? '+' : ''}
            {delta.toFixed(1)}%
          </span>
        )}
        {deltaLabel && <span>{deltaLabel}</span>}
        {footer}
      </div>
    </>
  );
  const cls = 'frost-card block p-5';
  return to ? (
    <Link to={to} className={`${cls} transition hover:border-blue-300 hover:shadow-md`}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
};
