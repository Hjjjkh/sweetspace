import { useState, useEffect } from 'react';
import { Sparkles, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';

export default function AISettingsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [cleared, setCleared] = useState(false);

  useEffect(() => {
    fetchAIStats();
  }, []);

  const fetchAIStats = async () => {
    try {
      const res = await fetch('/api/ai/usage');
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch AI stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearCache = async () => {
    if (!confirm('确定要清除所有 AI 缓存吗？这将导致下次需要重新生成。')) return;

    setClearing(true);
    try {
      const res = await fetch('/api/ai/clear-cache', { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setCleared(true);
        fetchAIStats();
        setTimeout(() => setCleared(false), 3000);
      }
    } catch (err) {
      console.error('Failed to clear cache:', err);
    } finally {
      setClearing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16
            bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl
            shadow-lg mb-4
          ">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            AI 设置
          </h1>
          <p className="text-gray-600">
            管理 AI 功能使用情况和缓存
          </p>
        </div>

        {/* AI  enabled check */}
        {!stats && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-yellow-900 mb-1">
                  AI 功能未启用
                </h3>
                <p className="text-sm text-yellow-700">
                  请联系管理员配置 OPENROUTER_API_KEY 环境变量
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        {stats && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* Today Usage */}
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <div className="text-sm text-gray-500 mb-1">今日使用</div>
                <div className="text-2xl font-bold text-gray-900">
                  {stats.today.requests} / {stats.today.limit}
                </div>
                <div className="mt-2 text-xs">
                  <span className={stats.today.remaining < 20 ? 'text-red-600' : 'text-green-600'}>
                    剩余 {stats.today.remaining} 次
                  </span>
                </div>
              </div>

              {/* Tokens */}
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <div className="text-sm text-gray-500 mb-1">今日 Token</div>
                <div className="text-2xl font-bold text-gray-900">
                  {stats.today.tokens.toLocaleString()}
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  约 {Math.round(stats.today.tokens / 1000)}K tokens
                </div>
              </div>

              {/* Cache Size */}
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <div className="text-sm text-gray-500 mb-1">AI 缓存</div>
                <div className="text-2xl font-bold text-gray-900">
                  {stats.cache.size}
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  缓存 {stats.cache.maxAge} 天
                </div>
              </div>
            </div>

            {/* Usage Progress */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">今日使用进度</span>
                <span className="text-sm text-gray-500">
                  {Math.round((stats.today.requests / stats.today.limit) * 100)}%
                </span>
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    stats.today.requests / stats.today.limit > 0.8
                      ? 'bg-red-500'
                      : stats.today.requests / stats.today.limit > 0.5
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                  }`}
                  style={{ width: `${(stats.today.requests / stats.today.limit) * 100}%` }}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-4">操作</h3>
              
              <div className="space-y-3">
                <button
                  onClick={handleClearCache}
                  disabled={clearing}
                  className="w-full flex items-center justify-center gap-2
                    px-4 py-2.5 border border-red-200 text-red-600
                    hover:bg-red-50 rounded-lg transition-colors
                    disabled:opacity-50 disabled:cursor-not-allowed
                  "
                >
                  {clearing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                      清除中...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      清除所有 AI 缓存
                    </>
                  )}
                </button>

                {cleared && (
                  <div className="flex items-center justify-center gap-2 text-green-600 text-sm">
                    <CheckCircle className="w-4 h-4" />
                    缓存已清除
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <h4 className="text-sm font-medium text-gray-700 mb-2">关于 AI 功能</h4>
                <ul className="text-xs text-gray-500 space-y-1">
                  <li>• 每人每天最多 {stats.today.limit} 次 AI 调用</li>
                  <li>• 生成的内容会缓存 {stats.cache.maxAge} 天</li>
                  <li>• 相同内容不会重复调用 API</li>
                  <li>• 留言润色不会保存隐私内容</li>
                </ul>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
