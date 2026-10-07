import React, { useState } from 'react';
import { SparklesIcon } from '@heroicons/react/24/outline';
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
    <div className="mt-6 rounded-lg border border-purple-200 bg-gradient-to-r from-purple-50 to-white p-6 shadow-sm" data-testid="ai-insights">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <SparklesIcon className="h-5 w-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-800">Phân tích nhanh bằng AI</h3>
        </div>
        <button
          onClick={() => void run()}
          disabled={loading}
          className="rounded-lg bg-purple-600 px-4 py-2 text-sm text-white transition hover:bg-purple-700 disabled:opacity-50"
        >
          {loading ? 'AI đang phân tích…' : text ? 'Phân tích lại' : 'Phân tích số liệu'}
        </button>
      </div>
      {!text && !error && !loading && <p className="mt-2 text-sm text-gray-500">AI đọc số liệu 7 ngày và 30 ngày gần nhất rồi nêu điểm đáng chú ý kèm việc nên làm.</p>}
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {error}
        </p>
      )}
      {text && (
        <div className="mt-4 text-sm text-gray-800">
          <RichText text={text} />
          <p className="mt-3 text-xs text-gray-400">Nhận xét do AI tạo từ số liệu hiện có, chỉ mang tính tham khảo.</p>
        </div>
      )}
    </div>
  );
};
