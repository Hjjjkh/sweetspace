import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../hooks/useAuth';
import { useAuth } from '../hooks/useAuth';
import { format, differenceInDays } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export default function HomePage() {
  const { user } = useAuth();
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 欢迎区域 */}
      <div className="card bg-gradient-to-r from-primary-500 to-pink-500 text-white">
        <h2 className="text-2xl font-bold mb-2">
          早安，{user?.name} ☀️
        </h2>
        <p className="opacity-90">
          这是你们在一起的第 {overview?.days_together || 0} 天
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          icon="📅" 
          label="共同回忆" 
          value={overview?.total_events || 0} 
        />
        <StatCard 
          icon="💌" 
          label="留言条数" 
          value={overview?.total_messages || 0} 
        />
        <StatCard 
          icon="😊" 
          label="心情记录" 
          value={overview?.recent_moods?.length || 0} 
        />
        <StatCard 
          icon="🔥" 
          label="连续互动" 
          value={overview?.streak_days || 0} 
        />
      </div>

      {/* 最近情绪 */}
      {overview?.recent_moods?.length > 0 && (
        <div className="card">
          <h3 className="section-title">最近心情</h3>
          <div className="space-y-3">
            {overview.recent_moods.slice(0, 5).map((mood, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">
                    {getMoodEmoji(mood.mood_type)}
                  </span>
                  <div>
                    <p className="font-medium">{mood.name}</p>
                    <p className="text-sm text-gray-500">
                      {format(new Date(mood.date), 'PPP', { locale: zhCN })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary-500 h-2 rounded-full"
                      style={{ width: `${(mood.mood_score / 10) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-600">
                    {mood.mood_score}/10
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 快捷操作 */}
      <div className="card">
        <h3 className="section-title">快捷操作</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <QuickAction 
            icon="✍️" 
            label="记录今天" 
            link="/moods" 
          />
          <QuickAction 
            icon="💝" 
            label="写留言" 
            link="/messages" 
          />
          <QuickAction 
            icon="📸" 
            label="传照片" 
            link="/gallery" 
          />
        </div>
      </div>

      {/* 即将到来 */}
      {overview?.upcoming_anniversaries?.length > 0 && (
        <div className="card bg-gradient-to-r from-pink-100 to-red-100">
          <h3 className="section-title">💕 即将到来的纪念日</h3>
          {overview.upcoming_anniversaries.map((anni, idx) => (
            <div key={idx} className="text-center py-4">
              <p className="text-lg font-bold text-gray-800">
                {anni.name}
              </p>
              <p className="text-4xl font-bold text-primary-600 my-2">
                {anni.days_until}
              </p>
              <p className="text-gray-600">天后</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <div className="card text-center p-4">
      <div className="text-4xl mb-2">{icon}</div>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
}

function QuickAction({ icon, label, link }) {
  return (
    <Link to={link} className="flex flex-col items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
      <span className="text-3xl mb-2">{icon}</span>
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </Link>
  );
}

function getMoodEmoji(moodType) {
  const moodMap = {
    happy: '😊',
    love: '😍',
    excited: '🤩',
    neutral: '😐',
    tired: '😴',
    sad: '😢',
    stressed: '😰'
  };
  return moodMap[moodType] || '😊';
}
