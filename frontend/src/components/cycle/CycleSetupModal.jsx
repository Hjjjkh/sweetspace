import { useState } from 'react';
import { format } from 'date-fns';
import { X } from 'lucide-react';

/**
 * 周期设置弹窗组件
 */
export default function CycleSetupModal({ onComplete, onClose }) {
  const [formData, setFormData] = useState({
    cycle_start_date: format(new Date(), 'yyyy-MM-dd'),
    cycle_length: 28,
    period_length: 5
  });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/cycle/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();
      if (result.success) {
        onComplete(result.data);
      } else {
        alert('设置失败，请重试');
      }
    } catch (error) {
      console.error('Setup error:', error);
      alert('设置失败，请重试');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-800">设置生理周期</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* 月经开始日期 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              本次月经开始日期
            </label>
            <input
              type="date"
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-300"
              value={formData.cycle_start_date}
              onChange={(e) => setFormData({ ...formData, cycle_start_date: e.target.value })}
            />
          </div>

          {/* 周期长度 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              周期长度（天）
            </label>
            <input
              type="number"
              min="21"
              max="35"
              value={formData.cycle_length}
              onChange={(e) => setFormData({ ...formData, cycle_length: parseInt(e.target.value) || 28 })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-300"
            />
            <p className="text-xs text-gray-500 mt-1">通常 21-35 天，平均 28 天</p>
          </div>

          {/* 经期长度 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              经期长度（天）
            </label>
            <input
              type="number"
              min="2"
              max="10"
              value={formData.period_length}
              onChange={(e) => setFormData({ ...formData, period_length: parseInt(e.target.value) || 5 })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-300"
            />
            <p className="text-xs text-gray-500 mt-1">通常 2-10 天，平均 3-7 天</p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-rose-500 to-pink-500 text-white font-medium py-3 rounded-xl shadow-lg hover:shadow-floating transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? '保存中...' : '开始记录'}
          </button>

          <p className="text-xs text-gray-500 text-center">
            设置后可随时修改，所有数据仅您可见
          </p>
        </form>
      </div>
    </div>
  );
}
