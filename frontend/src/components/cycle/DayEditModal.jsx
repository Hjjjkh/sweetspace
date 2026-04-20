import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { X, Droplet, Apple, Coffee, Dumbbell, Check } from 'lucide-react';

const moodOptions = [
  { type: 'love', label: '甜蜜', emoji: '😍' },
  { type: 'happy', label: '开心', emoji: '🙂' },
  { type: 'neutral', label: '平静', emoji: '😐' },
  { type: 'sad', label: '低落', emoji: '😢' }
];

const habitOptions = [
  { key: 'water', label: '多喝水', icon: Droplet },
  { key: 'fruit', label: '吃水果', icon: Apple },
  { key: 'breakfast', label: '吃早饭', icon: Coffee },
  { key: 'exercise', label: '运动', icon: Dumbbell },
  { key: 'bowel', label: '排便', icon: Check }
];

const flowOptions = [
  { value: 'none', label: '无' },
  { value: 'light', label: '少量' },
  { value: 'medium', label: '中等' },
  { value: 'heavy', label: '大量' }
];

/**
 * 每日记录编辑弹窗
 */
export default function DayEditModal({ day, onClose, onSave }) {
  const [formData, setFormData] = useState({
    date: day?.date,
    mood_type: day?.mood_type || '',
    mood_score: day?.mood_score || 5,
    flow_level: day?.flow_level || 'none',
    symptoms: [],
    habits: {
      water: day?.habits?.water || 0,
      fruit: day?.habits?.fruit || 0,
      breakfast: day?.habits?.breakfast || 0,
      exercise: day?.habits?.exercise || 0,
      bowel: day?.habits?.bowel || 0
    },
    note: day?.note || ''
  });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/cycle/daily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();
      if (result.success) {
        onSave(result.data);
      } else {
        alert('保存失败，请重试');
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('保存失败，请重试');
    } finally {
      setLoading(false);
    }
  }

  function toggleHabit(key) {
    setFormData(prev => ({
      ...prev,
      habits: {
        ...prev.habits,
        [key]: prev.habits[key] ? 0 : 1
      }
    }));
  }

  function toggleSymptom(symptom) {
    setFormData(prev => ({
      ...prev,
      symptoms: prev.symptoms.includes(symptom)
        ? prev.symptoms.filter(s => s !== symptom)
        : [...prev.symptoms, symptom]
    }));
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slide-up">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 p-5 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-800">
              记录健康
            </h3>
            <p className="text-sm text-gray-500">
              {format(new Date(day.date), 'yyyy 年 MM 月 dd 日 EEEE', { locale: zhCN })}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-6">
          {/* 周期信息 */}
          <div className="bg-gradient-to-r from-rose-50 to-pink-50 rounded-xl p-4 border border-rose-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">
                  周期第{day.cycle_day}天
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {getPhaseLabel(day.period_phase)}
                </p>
              </div>
              {day.is_period && (
                <div className="text-red-500">
                  <Droplet className="w-6 h-6" fill="currentColor" />
                </div>
              )}
            </div>
          </div>

          {/* 情绪选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              今天的情绪如何？
            </label>
            <div className="grid grid-cols-4 gap-3">
              {moodOptions.map(mood => (
                <button
                  key={mood.type}
                  type="button"
                  onClick={() => setFormData({ ...formData, mood_type: mood.type })}
                  className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all cursor-pointer ${
                    formData.mood_type === mood.type
                      ? 'border-rose-300 bg-rose-50 scale-105'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="text-3xl mb-1">{mood.emoji}</span>
                  <span className="text-xs text-gray-600">{mood.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 经期流量（仅在经期显示） */}
          {day.is_period && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                经血量
              </label>
              <div className="grid grid-cols-4 gap-2">
                {flowOptions.map(flow => (
                  <button
                    key={flow.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, flow_level: flow.value })}
                    className={`py-2.5 rounded-xl border-2 text-sm font-medium transition-all cursor-pointer ${
                      formData.flow_level === flow.value
                        ? 'border-red-300 bg-red-50 text-red-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {flow.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 生活习惯 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              今天完成了哪些习惯？
            </label>
            <div className="space-y-2">
              {habitOptions.map(habit => {
                const Icon = habit.icon;
                const checked = formData.habits[habit.key];
                return (
                  <button
                    key={habit.key}
                    type="button"
                    onClick={() => toggleHabit(habit.key)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all cursor-pointer ${
                      checked
                        ? 'border-green-300 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-5 h-5 ${checked ? 'text-green-600' : 'text-gray-400'}`} />
                      <span className={`text-sm font-medium ${checked ? 'text-green-700' : 'text-gray-600'}`}>
                        {habit.label}
                      </span>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      checked ? 'border-green-500 bg-green-500' : 'border-gray-300'
                    }`}>
                      {checked && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 备注 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              备注（可选）
            </label>
            <textarea
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-300"
              rows="2"
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              placeholder="记录下今天的特殊情况..."
            />
          </div>

          {/* Submit */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl font-medium shadow-lg hover:shadow-floating transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function getPhaseLabel(phase) {
  const labels = {
    period: '经期',
    follicular: '卵泡期',
    ovulation: '排卵期',
    luteal: '黄体期'
  };
  return labels[phase] || '';
}
