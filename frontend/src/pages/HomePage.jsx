import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, useAuth } from '../hooks/useAuth';
import { format, differenceInDays } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Calendar, Mail, Smile, Flame, Heart, Plus, Camera, Sparkles } from 'lucide-react';
import AIButton, { AIGeneratedContent } from '../components/AIButton';

export default function HomePage() {
  const { user } = useAuth();
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [weeklyInsight, setWeeklyInsight] = useState(null);
  const [insightLoading, setInsightLoading] = useState(false);

  useEffect(() => {
    fetchOverview();
  }, []);

  async function fetchOverview() {
    try {
      const response = await api.get('/overview');
      if (response.data.success) {
        setOverview(response.data.data);
      }
    } catch (error) {
      console.error('Fetch overview error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleWeeklyInsight() {
    if (insightLoading) return;
    
    setInsightLoading(true);
    try {
      const response = await fetch('/api/ai/relationship-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          days: 7,
          events: [],
          messages: [],
          moods: []
        })
      });

      const result = await response.json();
      if (result.success) {
        setWeeklyInsight(result.insight);
      }
    } catch (error) {
      console.error('Weekly insight error:', error);
    } finally {
      setInsightLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin"></div>
          <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-pink-400 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 欢迎区域 */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary-500 via-pink-500 to-rose-500 rounded-3xl p-6 sm:p-8 text-white shadow-floating">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/3 -translate-x-1/3"></div>
        <div className="relative z-10">
          <div className="flex items-center space-x-2 mb-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Heart className="w-5 h-5" fill="currentColor" />
            </div>
            <span className="text-sm font-medium bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
              {format(new Date(), 'EEEE, MMMM d', { locale: zhCN })}
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-3 font-display">
            {getGreeting()}, {user?.name}
          </h2>
          <p className="text-lg sm:text-xl opacity-95">
            这是你们相爱的第 <span className="font-bold text-2xl">{overview?.days_together || 0}</span> 天
          </p>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          icon={Calendar}
          iconBg="from-blue-400 to-cyan-400"
          label="共同回忆" 
          value={overview?.total_events || 0} 
        />
        <StatCard 
          icon={Mail}
          iconBg="from-pink-400 to-rose-400"
          label="留言条数" 
          value={overview?.total_messages || 0} 
        />
        <StatCard 
          icon={Smile}
          iconBg="from-yellow-400 to-orange-400"
          label="心情记录" 
          value={overview?.recent_moods?.length || 0} 
        />
        <StatCard 
          icon={Flame}
          iconBg="from-red-400 to-pink-400"
          label="连续互动" 
          value={overview?.streak_days || 0} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 最近情绪 */}
        {overview?.recent_moods?.length > 0 && (
          <div className="bg-white/70 backdrop-blur-glass border border-rose-border rounded-2xl p-6 shadow-glass">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800 font-display">最近心情</h3>
              <Link to="/moods" className="text-sm text-primary-600 hover:text-primary-700 font-medium cursor-pointer">
                查看全部 →
              </Link>
            </div>
            <div className="space-y-3">
              {overview.recent_moods.slice(0, 4).map((mood, idx) => (
                <div key={idx} className="flex items-center space-x-4 p-3 bg-white/50 rounded-xl hover:bg-white/70 transition-all duration-200 cursor-pointer">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-md ${
                    getMoodBgClass(mood.mood_type)
                  }`}>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{mood.name}</p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(mood.date), 'MMM d, yyyy', { locale: zhCN })}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-20 bg-gray-200/50 rounded-full h-2.5">
                      <div 
                        className={`h-2.5 rounded-full transition-all duration-500 ${getMoodProgressClass(mood.mood_score)}`}
                        style={{ width: `${(mood.mood_score / 10) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-bold text-gray-700 w-8 text-right">
                      {mood.mood_score}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 快捷操作 */}
        <div className="bg-white/70 backdrop-blur-glass border border-rose-border rounded-2xl p-6 shadow-glass">
          <h3 className="text-lg font-bold text-gray-800 font-display mb-4">快捷操作</h3>
          <div className="grid grid-cols-3 gap-3">
            <QuickAction 
              icon={Smile}
              iconBg="from-yellow-400 to-orange-400"
              label="记录今天" 
              link="/moods" 
            />
            <QuickAction 
              icon={Heart}
              iconBg="from-pink-400 to-rose-400"
              label="写留言" 
              link="/messages" 
            />
            <QuickAction 
              icon={Camera}
              iconBg="from-purple-400 to-pink-400"
              label="传照片" 
              link="/gallery" 
            />
          </div>
        </div>
      </div>

      {/* 即将到来 */}
      {overview?.upcoming_anniversaries?.length > 0 && (
        <div className="relative overflow-hidden bg-gradient-to-r from-pink-100 via-rose-100 to-red-100 rounded-2xl p-6 shadow-glass border border-rose-border">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/30 rounded-full -translate-y-1/2 translate-x-1/3"></div>
          <div className="relative z-10">
            <h3 className="text-lg font-bold text-gray-800 font-display mb-4 flex items-center">
              <Heart className="w-5 h-5 text-primary-500 mr-2" fill="currentColor" />
              即将到来的纪念日
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {overview.upcoming_anniversaries.map((anni, idx) => (
                <div key={idx} className="bg-white/60 backdrop-blur-sm rounded-xl p-4 text-center hover:bg-white/80 transition-all duration-200 cursor-pointer">
                  <p className="text-sm font-medium text-gray-600 mb-2">
                    {anni.name}
                  </p>
                  <p className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent mb-1">
                    {anni.days_until}
                  </p>
                  <p className="text-xs text-gray-500">天后</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* AI 关系周报 */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-2xl p-6 shadow-glass">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-600" />
            <h3 className="text-lg font-bold text-gray-800 font-display">本周关系洞察</h3>
          </div>
          <AIButton
            type="insight"
            label={weeklyInsight ? '重新生成' : '生成周报'}
            onClick={handleWeeklyInsight}
            disabled={insightLoading}
          />
        </div>
        
        {weeklyInsight ? (
          <AIGeneratedContent
            content={weeklyInsight}
            fromCache={false}
            onDismiss={() => setWeeklyInsight(null)}
          />
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Sparkles className="w-12 h-12 mx-auto mb-3 text-purple-400 opacity-50" />
            <p>点击生成你们的关系周报</p>
            <p className="text-xs mt-2">AI 会分析最近 7 天的心情、留言和事件，生成温暖的关系洞察</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, iconBg, label, value }) {
  return (
    <div className="bg-white/70 backdrop-blur-glass border border-rose-border rounded-2xl p-4 shadow-glass hover:shadow-floating transition-all duration-300 cursor-pointer hover:-translate-y-1">
      <div className={`w-12 h-12 bg-gradient-to-br ${iconBg} rounded-xl flex items-center justify-center shadow-md mb-3`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <p className="text-3xl font-bold text-gray-800 font-display mb-1">{value}</p>
      <p className="text-sm text-gray-500 font-medium">{label}</p>
    </div>
  );
}

function QuickAction({ icon: Icon, iconBg, label, link }) {
  return (
    <Link to={link} className="flex flex-col items-center p-4 bg-white/50 hover:bg-white/70 rounded-xl transition-all duration-200 cursor-pointer hover:-translate-y-1 hover:shadow-md group">
      <div className={`w-14 h-14 bg-gradient-to-br ${iconBg} rounded-2xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300 mb-3`}>
        <Icon className="w-7 h-7 text-white" />
      </div>
      <span className="text-sm font-medium text-gray-700 text-center">{label}</span>
    </Link>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 6) return '夜深了';
  if (hour < 9) return '早安';
  if (hour < 12) return '上午好';
  if (hour < 14) return '中午好';
  if (hour < 18) return '下午好';
  if (hour < 22) return '晚上好';
  return '晚安';
}

function getMoodBgClass(moodType) {
  const moodMap = {
    happy: 'bg-gradient-to-br from-yellow-400 to-orange-400',
    love: 'bg-gradient-to-br from-pink-400 to-rose-400',
    excited: 'bg-gradient-to-br from-purple-400 to-pink-400',
    neutral: 'bg-gradient-to-br from-gray-400 to-gray-500',
    tired: 'bg-gradient-to-br from-blue-400 to-cyan-400',
    sad: 'bg-gradient-to-br from-blue-500 to-indigo-500',
    stressed: 'bg-gradient-to-br from-red-400 to-orange-400'
  };
  return moodMap[moodType] || 'bg-gradient-to-br from-gray-400 to-gray-500';
}

function getMoodProgressClass(score) {
  if (score >= 8) return 'bg-gradient-to-r from-green-400 to-emerald-400';
  if (score >= 5) return 'bg-gradient-to-r from-yellow-400 to-orange-400';
  return 'bg-gradient-to-r from-red-400 to-rose-400';
}
