import React from 'react';
import { Link } from 'react-router-dom';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: 'blue' | 'green' | 'purple' | 'red' | 'yellow';
  /** Có thì cả thẻ là liên kết tới trang liên quan. */
  to?: string;
  hint?: string;
}

const colorClasses = {
  blue: 'bg-blue-100 text-blue-600',
  green: 'bg-green-100 text-green-600',
  purple: 'bg-purple-100 text-purple-600',
  red: 'bg-red-100 text-red-600',
  yellow: 'bg-yellow-100 text-yellow-600',
};

export const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon: Icon, color, to, hint }) => {
  const body = (
    <div className="flex items-center justify-between">
      <div className="min-w-0">
        <p className="text-gray-500 text-sm">{title}</p>
        <p className="text-2xl font-bold text-gray-800 mt-1 truncate">{value}</p>
        {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
      </div>
      <div className={`p-3 rounded-full shrink-0 ${colorClasses[color]}`}>
        <Icon className="h-6 w-6" />
      </div>
    </div>
  );

  const base = 'block bg-white rounded-lg shadow p-6';
  return to ? (
    <Link to={to} className={`${base} transition hover:shadow-md`}>
      {body}
    </Link>
  ) : (
    <div className={base}>{body}</div>
  );
};
