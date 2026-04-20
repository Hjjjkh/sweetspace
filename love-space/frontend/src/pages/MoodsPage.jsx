import React, { useState, useEffect } from 'react';
import { api } from '../hooks/useAuth';
import { format, eachDayOfInterval, subDays } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useAuth } from '../hooks/useAuth';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

const moodOptions = [
  { type: 'love', label: '甜蜜', emoji: '😍' },
  { type: 'happy', label: '开心', emoji: '😊' },
  { type: 'excited', label: '兴奋', emoji: '🤩' },
  { type: 'neutral', label: '平静', emoji: '😐' },
  { type: 'tired', label: '疲惫', emoji: '😴' },
  { type: 'sad', label: '难过', emoji: '😢' },
  { type: 'stressed', label: '压力', emoji: '😰' }
];

export default function MoodsPage() {
  const { user } = useAuth();
  const [moods, setMoods] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMood, setSelectedMood] = useState(null);
  const [note, setNote] = useState('');

  useEffect(() => {
    fetchMoods();
  }, []);

  async function fetchMoods() {
    try {
      const response = await api.get('/moods');
      if (response.data.success) {
        const moodsData = response.data.data.moods;
        setMoods(moodsData);
        generateChartData(moodsData);
      }
    } catch (error) {
      console.error('Fetch moods error:', error);
    } finally {
      setLoading(false);
    }
  }

  function generateChartData(moodsData) {
    // 生成 30 天气情绪趋势数据
    const days = eachDayOfInterval({
      start: subDays(new Date(), 29),
      end: new Date()
    });

    const data = days.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const dayMood = moodsData.find(m => m.record_date === dateStr);
      
      return {
        date: format(day, 'MM/dd'),
        score: dayMood?.mood_score || null,
        type: dayMood?.mood_type
      };
    });

    setChartData(data);
  }

  async function handleSubmitMood() {
    if (!selectedMood) return;

    try {
      const response = await api.post('/moods', {
        mood_type: selectedMood,
        mood_score: calculateScore(selectedMood),
        note: note || null
      });

      if (response.data.success) {
        await fetchMoods();
        setSelectedMood(null);
        setNote('');
        alert('心情记录成功！');
      }
    } catch (error) {
      if (error.response?.status === 409) {
        alert('今天已经记录过心情了，明天再来吧~');
      } else {
        alert('记录失败，请重试');
      }
    }
  }

  function calculateScore(moodType) {
    const scores = {
      love: 10,
      happy: 9,
      excited: 8,
      neutral: 5,
      tired: 4,
      sad: 3,
      stressed: 3
    };
    return scores[moodType] || 5;
  }

  function getMoodEmoji(type) {
    return moodOptions.find(m => m.type === type)?.emoji || '😊';
  }

  return (
    <div className="space-y-6">
      <h2 className="section-title">😊 心情日记</h2>

      {/* 今日心情记录 */}
      <div className="card">
        <h3 className="text-lg font-bold text-gray-800 mb-4">今天的心情如何？</h3>
        
        <div className="grid grid-cols-4 md:grid-cols-7 gap-2 mb-4">
          {moodOptions.map((mood) => (
            <button
              key={mood.type}
              onClick={() => setSelectedMood(mood.type)}
              className={`flex flex-col items-center p-3 rounded-xl transition-all ${
                selectedMood === mood.type
                  ? 'bg-primary-500 text-white scale-110 shadow-lg'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              <span className="text-3xl mb-1">{mood.emoji}</span>
              <span className="text-xs font-medium">{mood.label}</span>
            </button>
          ))}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            想记录些什么吗？(可选)
          </label>
          <textarea
            className="input-field"
            rows="2"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="记录下今天的心情故事..."
          />
        </div>

        <button
          onClick={handleSubmitMood}
          disabled={!selectedMood}
          className={`btn-primary w-full ${
            !selectedMood ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          记录今天的心情
        </button>
      </div>

      {/* 情绪趋势图 */}
      <div className="card">
        <h3 className="text-lg font-bold text-gray-800 mb-4">30 天情绪趋势</h3>
        
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 10]} />
                <Tooltip 
                  formatter={(value) => [`${value}/10`, '心情分数']}
                />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#ec4899" 
                  strokeWidth={3}
                  dot={{ fill: '#ec4899', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* 历史记录 */}
      <div className="card">
        <h3 className="text-lg font-bold text-gray-800 mb-4">最近记录</h3>
        
        {moods.length === 0 ? (
          <p className="text-gray-500 text-center py-4">还没有心情记录</p>
        ) : (
          <div className="space-y-2">
            {moods.slice(0, 10).map((mood) => (
              <div 
                key={mood.id}
                className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
              >
                <span className="text-2xl">{getMoodEmoji(mood.mood_type)}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-800">
                      {mood.user_name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {mood.mood_score}/10
                    </p>
                  </div>
                  {mood.note && (
                    <p className="text-sm text-gray-600 mt-1">{mood.note}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {format(new Date(mood.record_date), 'PPP', { locale: zhCN })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
