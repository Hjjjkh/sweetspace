import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';

// AI 功能按钮组件
// 支持：analyze-mood, generate-photo-desc, polish-message, plan-date, relationship-insight, generate-topic
export default function AIButton({ 
  type = 'generate', 
  onGenerate, 
  label,
  disabled = false,
  data = {},
  className = ''
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const labels = {
    analyze: 'AI 分析',
    generate: 'AI 生成',
    polish: 'AI 润色',
    plan: 'AI 策划',
    insight: 'AI 洞察',
    topic: 'AI 话题'
  };

  const endpoints = {
    analyze: '/api/ai/analyze-mood',
    generate: '/api/ai/generate-photo-desc',
    polish: '/api/ai/polish-message',
    plan: '/api/ai/plan-date',
    insight: '/api/ai/relationship-insight',
    topic: '/api/ai/generate-topic'
  };

  const handleClick = async () => {
    if (loading || disabled) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(endpoints[type], {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'AI 生成失败');
      }

      if (onGenerate) {
        onGenerate(result);
      }
    } catch (err) {
      setError(err.message);
      console.error('AI Button Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="inline-block relative">
      <button
        onClick={handleClick}
        disabled={loading || disabled}
        className={`
          inline-flex items-center gap-1.5 px-3 py-1.5
          bg-gradient-to-r from-purple-500 to-pink-500
          hover:from-purple-600 hover:to-pink-600
          disabled:from-gray-400 disabled:to-gray-500
          text-white text-sm font-medium rounded-lg
          transition-all duration-200
          shadow-lg hover:shadow-xl
          disabled:cursor-not-allowed
          ${className}
        `}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Sparkles className="w-4 h-4" />
        )}
        <span>{label || labels[type]}</span>
      </button>

      {error && (
        <div className="absolute top-full left-0 mt-1 px-3 py-2
          bg-red-50 text-red-700 text-xs rounded-lg shadow-lg
          border border-red-200 z-50 whitespace-nowrap
        ">
          {error}
        </div>
      )}
    </div>
  );
}

/**
 * AI 生成内容显示组件
 */
export function AIGeneratedContent({ content, fromCache, onDismiss }) {
  if (!content) return null;

  return (
    <div className="mt-4 p-4 bg-gradient-to-br from-purple-50 to-pink-50
      border border-purple-200 rounded-xl
    ">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-500" />
          <span className="text-xs font-medium text-purple-700">
            AI 生成内容
          </span>
          {fromCache && (
            <span className="text-xs text-gray-500">(来自缓存)</span>
          )}
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        )}
      </div>
      <div className="text-sm text-gray-800 whitespace-pre-wrap">
        {content}
      </div>
    </div>
  );
}

/**
 * AI 使用量显示组件
 */
export function AIUsageBadge({ usage, limit }) {
  const percentage = (usage / limit) * 100;
  const color = percentage > 80 ? 'text-red-600' : percentage > 50 ? 'text-yellow-600' : 'text-green-600';

  return (
    <div className="flex items-center gap-2 text-xs">
      <Sparkles className="w-3 h-3 text-purple-500" />
      <span className={`font-medium ${color}`}>
        {usage}/{limit}
      </span>
      <span className="text-gray-500">今日 AI 使用量</span>
    </div>
  );
}
