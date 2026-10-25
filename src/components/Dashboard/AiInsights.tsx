import React, { useState } from 'react';
import { CpuChipIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { aiService } from '../../services/aiService';
import useAiStatus from '../../hooks/useAiStatus';
import RichText from '../Chatbot/RichText';

/** Nhận xét nhanh số liệu kinh doanh do AI viết (chỉ hiện khi server đã cấu hình AI). Chỉ gọi khi người dùng bấm. */
export const AiInsights: React.FC = () => {
  const enabled = useAiStatus();
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!enabled) return null;

  const run = async () => {
    setLoading(true);
    setError('');
    try {
      setText(await aiService.insights());
    } catch (err: any) {
      setError(err.message || 'AI chưa phân tích được số liệu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 via-surface to-blue-50 p-5 shadow-sm sm:p-6"
      data-testid="ai-insights"
    >
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-blue-200/30 blur-2xl" />
      <div className="relative flex flex-col gap-4 lg:flex-row lg:items-start">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/30">
          <CpuChipIcon className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-blue-700">
              <SparklesIcon className="h-3 w-3" /> AI Hardware Insights & Forecasting
            </span>
            <span className="text-[10px] text-slate-400">Phân tích 7 & 30 ngày gần nhất</span>
          </div>
          {!text && !error && !loading && (
            <p className="mt-2 text-sm text-slate-600">
              AI đọc số liệu bán hàng, tồn kho gần đây rồi nêu điểm đáng chú ý (sản phẩm tăng nhu cầu, nguy cơ hết hàng…) kèm đề xuất việc nên làm.
            </p>
          )}
          {loading && <p className="mt-2 animate-pulse text-sm text-slate-500">AI đang đọc số liệu và soạn nhận xét…</p>}
          {error && (
            <p role="alert" className="mt-2 text-sm text-red-600">
              {error}
            </p>
          )}
          {text && (
            <div className="mt-3 text-sm text-slate-800">
              <RichText text={text} />
              <p className="mt-3 text-xs text-slate-400">Nhận xét do AI tạo từ số liệu hiện có, chỉ mang tính tham khảo.</p>
            </div>
          )}
        </div>
        <button
          onClick={() => void run()}
          disabled={loading}
          className="shrink-0 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Đang phân tích…' : text ? 'Phân tích lại' : 'Phân tích số liệu'}
        </button>
      </div>
    </div>
  );
};
