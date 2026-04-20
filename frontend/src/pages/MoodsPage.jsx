import React, { useState, useEffect } from 'react';
import { api, useAuth } from '../hooks/useAuth';
import { format, eachDayOfInterval, subDays } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Smile, Heart, Zap, Minus, Coffee, Frown, AlertCircle, TrendingUp, Sparkles } from 'lucide-react';
import AIButton, { AIGeneratedContent } from '../components/AIButton';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

const moodOptions = [
  { type: 'love', label: '甜蜜', icon: Heart, color: 'from-pink-400 to-rose-400', score: 10 },
  { type: 'happy', label: '开心', icon: Smile, color: 'from-yellow-400 to-orange-400', score: 9 },
  { type: 'excited', label: '兴奋', icon: Zap, color: 'from-purple-400 to-pink-400', score: 8 },
  { type: 'neutral', label: '平静', icon: Minus, color: 'from-gray-400 to-gray-500', score: 5 },
  { type: 'tired', label: '疲惫', icon: Coffee, color: 'from-blue-400 to-cyan-400', score: 4 },
  { type: 'sad', label: '难过', icon: Frown, color: 'from-indigo-400 to-blue-500', score: 3 },
  { type: 'stressed', label: '压力', icon: AlertCircle, color: 'from-red-400 to-orange-400', score: 3 }
];

export default function MoodsPage() {
  const { user } = useAuth();
  const [moods, setMoods] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMood, setSelectedMood] = useState(null);
  const [note, setNote] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

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
      const mood = moodOptions.find(m => m.type === selectedMood);
      const response = await api.post('/moods', {
        mood_type: selectedMood,
        mood_score: mood?.score || 5,
        note: note || null
      });

      if (response.data.success) {
        await fetchMoods();
        setSelectedMood(null);
        setNote('');
      }
    } catch (error) {
      if (error.response?.status === 409) {
        alert('今天已经记录过心情了，明天再来吧~');
      } else {
        alert('记录失败，请重试');
      }
    }
  }

  async function handleAiAnalysis() {
    setAiLoading(true);
    try {
      const moodData = moods.map(m => ({
        date: m.record_date,
        type: m.mood_type,
        score: m.mood_score,
        note: m.note
      }));

      const response = await fetch('/api/ai/analyze-mood', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          days: 30,
          moodData
        })
      });

      const result = await response.json();
      if (result.success) {
        setAiAnalysis(result.analysis);
      }
    } catch (error) {
      console.error('AI analysis error:', error);
      alert('AI 分析失败，请稍后重试');
    } finally {
      setAiLoading(false);
    }
  }

  function getMoodColor(type) {
    return moodOptions.find(m => m.type === type)?.color || 'from-gray-400 to-gray-500';
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 font-display flex items-center">
          <TrendingUp className="w-7 h-7 mr-3 text-primary-500" />
          心情日记
        </h2>
        <AIButton
          type="analyze"
          label="AI 情感分析"
          disabled={moods.length === 0 || aiLoading}
          onClick={handleAiAnalysis}
        />
      </div>

      {/* 今日心情记录 */}
      <div className="bg-white/70 backdrop-blur-glass border border-rose-border rounded-2xl p-6 shadow-glass">
        <h3 className="text-lg font-bold text-gray-800 font-display mb-4 flex items-center">
          <Smile className="w-5 h-5 mr-2 text-primary-500" />
          今天的心情如何？
        </h3>
        
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 mb-5">
          {moodOptions.map((mood) => {
            const Icon = mood.icon;
            return (
              <button
                key={mood.type}
                onClick={() => setSelectedMood(mood.type)}
                className={`flex flex-col items-center p-3 rounded-xl transition-all duration-200 cursor-pointer ${
                  selectedMood === mood.type
                    ? `bg-gradient-to-br ${mood.color} text-white scale-110 shadow-lg -translate-y-1`
                    : 'bg-white/50 border border-rose-border text-gray-600 hover:bg-white/70 hover:scale-105'
                }`}
              >
                <Icon className="w-7 h-7 mb-1" strokeWidth={2.5} />
                <span className="text-xs font-medium">{mood.label}</span>
              </button>
            );
          })}
        </div>

        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            想记录些什么吗？(可选)
          </label>
          <textarea
            className="w-full px-4 py-2.5 bg-white/50 border border-rose-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent transition-all duration-200"
            rows="2"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="记录下今天的心情故事..."
          />
        </div>

        <button
          onClick={handleSubmitMood}
          disabled={!selectedMood}
          className={`w-full font-medium py-3 rounded-xl shadow-lg transition-all duration-300 cursor-pointer flex items-center justify-center space-x-2 ${
            selectedMood
              ? 'bg-gradient-to-r from-primary-500 to-pink-500 text-white hover:shadow-floating hover:-translate-y-0.5'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          <Heart className={`w-5 h-5 ${selectedMood ? 'fill-current' : ''}`} />
          <span>记录今天的心情</span>
        </button>
      </div>

      {/* 情绪趋势图 */}
      <div className="bg-white/70 backdrop-blur-glass border border-rose-border rounded-2xl p-6 shadow-glass">
        <h3 className="text-lg font-bold text-gray-800 font-display mb-4 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-primary-500" />
          30 天情绪趋势
        </h3>
        
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin"></div>
            </div>
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  domain={[0, 10]} 
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(244, 63, 94, 0.2)',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value) => [`${value}/10`, '心情分数']}
                />
                <Area 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#ec4899" 
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorScore)"
                  dot={{ fill: '#ec4899', strokeWidth: 2, r: 4, stroke: '#fff' }}
                  activeDot={{ r: 6, strokeWidth: 3 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* AI 情感分析结果 */}
        {aiAnalysis && (
          <AIGeneratedContent
            content={aiAnalysis}
            fromCache={false}
            onDismiss={() => setAiAnalysis(null)}
          />
        )}
      </div>

      {/* 历史记录 */}
      <div className="bg-white/70 backdrop-blur-glass border border-rose-border rounded-2xl p-6 shadow-glass">
        <h3 className="text-lg font-bold text-gray-800 font-display mb-4 flex items-center">
          <Heart className="w-5 h-5 mr-2 text-primary-500" />
          最近记录
        </h3>
        
        {moods.length === 0 ? (
          <p className="text-gray-500 text-center py-8">还没有心情记录</p>
        ) : (
          <div className="space-y-2">
            {moods.slice(0, 10).map((mood) => {
              const moodConfig = moodOptions.find(m => m.type === mood.mood_type) || moodOptions[0];
              const MoodIcon = moodConfig.icon;
              
              return (
                <div 
                  key={mood.id}
                  className="flex items-center space-x-4 p-4 bg-white/50 rounded-xl hover:bg-white/70 transition-all duration-200 cursor-pointer"
                >
                  <div className={`w-12 h-12 bg-gradient-to-br ${moodConfig.color} rounded-xl flex items-center justify-center shadow-md`}>
                    <MoodIcon className="w-6 h-6 text-white" strokeWidth={2.5} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-bold text-gray-800">
                        {mood.user_name}
                      </p>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200/50 rounded-full h-2.5">
                          <div 
                            className={`h-2.5 rounded-full bg-gradient-to-r ${moodConfig.color} transition-all duration-500`}
                            style={{ width: `${(mood.mood_score / 10) * 100}%` }}
                          ></div>
                        </div>
                        <p className="text-sm font-bold text-gray-700 w-10 text-right">
                          {mood.mood_score}
                        </p>
                      </div>
                    </div>
                    {mood.note && (
                      <p className="text-sm text-gray-600 line-clamp-1">{mood.note}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {format(new Date(mood.record_date), 'yyyy 年 MM 月 dd 日', { locale: zhCN })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
