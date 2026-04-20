import React, { useState, useEffect } from 'react';
import { api } from '../hooks/useAuth';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Calendar, Clock, MapPin, Tag, Star, Plus, X } from 'lucide-react';

const categories = {
  memory: { label: '美好回忆', icon: '💭', color: 'from-blue-400 to-cyan-400' },
  anniversary: { label: '纪念日', icon: '🎉', color: 'from-pink-400 to-rose-400' },
  first_time: { label: '第一次', icon: '⭐', color: 'from-yellow-400 to-orange-400' },
  trip: { label: '旅行', icon: '✈️', color: 'from-purple-400 to-pink-400' },
  other: { label: '其他', icon: '📝', color: 'from-gray-400 to-gray-500' }
};

export default function TimelinePage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    event_date: new Date().toISOString().split('T')[0],
    category: 'memory'
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  async function fetchEvents() {
    try {
      const response = await api.get('/events');
      if (response.data.success) {
        setEvents(response.data.data.events);
      }
    } catch (error) {
      console.error('Fetch events error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const response = await api.post('/events', newEvent);
      if (response.data.success) {
        await fetchEvents();
        setShowForm(false);
        setNewEvent({
          title: '',
          description: '',
          event_date: new Date().toISOString().split('T')[0],
          category: 'memory'
        });
      }
    } catch (error) {
      console.error('Create event error:', error);
      alert('创建失败，请重试');
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 font-display flex items-center">
          <Calendar className="w-7 h-7 mr-3 text-primary-500" />
          时间线
        </h2>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="flex items-center space-x-2 bg-gradient-to-r from-primary-500 to-pink-500 text-white px-4 py-2.5 rounded-xl font-medium shadow-lg hover:shadow-floating transition-all duration-300 cursor-pointer hover:-translate-y-0.5"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">{showForm ? '取消' : '添加回忆'}</span>
        </button>
      </div>

      {/* 添加事件表单 */}
      {showForm && (
        <div className="bg-white/70 backdrop-blur-glass border border-rose-border rounded-2xl p-6 shadow-glass animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800 font-display">添加新回忆</h3>
            <button
              onClick={() => setShowForm(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                事件标题 *
              </label>
              <input
                type="text"
                required
                className="w-full px-4 py-2.5 bg-white/50 border border-rose-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent transition-all duration-200"
                value={newEvent.title}
                onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                placeholder="例如：第一次约会"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                事件日期 *
              </label>
              <input
                type="date"
                required
                className="w-full px-4 py-2.5 bg-white/50 border border-rose-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent transition-all duration-200"
                value={newEvent.event_date}
                onChange={(e) => setNewEvent({...newEvent, event_date: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                分类
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {Object.entries(categories).map(([key, cat]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setNewEvent({...newEvent, category: key})}
                    className={`p-3 rounded-xl border transition-all duration-200 cursor-pointer ${
                      newEvent.category === key
                        ? `bg-gradient-to-br ${cat.color} text-white border-transparent shadow-md`
                        : 'bg-white/50 border-rose-border text-gray-600 hover:bg-white/70'
                    }`}
                  >
                    <div className="text-xl mb-0.5">{cat.icon}</div>
                    <div className="text-xs font-medium">{cat.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                描述
              </label>
              <textarea
                className="w-full px-4 py-2.5 bg-white/50 border border-rose-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent transition-all duration-200"
                rows="3"
                value={newEvent.description}
                onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                placeholder="记录下这个特别的时刻..."
              />
            </div>

            <button type="submit" className="w-full bg-gradient-to-r from-primary-500 to-pink-500 text-white font-medium py-3 rounded-xl shadow-lg hover:shadow-floating transition-all duration-300 cursor-pointer hover:-translate-y-0.5">
              保存回忆
            </button>
          </form>
        </div>
      )}

      {/* 时间线列表 */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin"></div>
          </div>
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white/70 backdrop-blur-glass border border-rose-border rounded-2xl p-12 text-center shadow-glass">
          <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-rose-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md">
            <Star className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-600 font-medium">还没有任何回忆，添加第一条记录吧</p>
          <p className="text-sm text-gray-500 mt-2">🌟</p>
        </div>
      ) : (
        <div className="relative space-y-6">
          {/* 时间线 */}
          <div className="absolute left-4 sm:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary-300 via-pink-300 to-rose-300"></div>
          
          {events.map((event, idx) => {
            const cat = categories[event.category] || categories.other;
            const isLeft = idx % 2 === 0;
            
            return (
              <div 
                key={event.id} 
                className={`relative flex items-center ${isLeft ? 'flex-row' : 'flex-row-reverse'} animate-slide-up`}
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                {/* 中心点 */}
                <div className={`absolute left-4 sm:left-1/2 w-4 h-4 -translate-x-1/2 rounded-full bg-gradient-to-br ${cat.color} shadow-lg border-4 border-white z-10`}></div>
                
                {/* 内容卡片 */}
                <div className={`ml-12 sm:ml-0 sm:w-[calc(50%-2rem)] ${isLeft ? 'sm:pr-8' : 'sm:pl-8 sm:ml-auto'}`}>
                  <div className="bg-white/70 backdrop-blur-glass border border-rose-border rounded-2xl p-5 shadow-glass hover:shadow-floating transition-all duration-300 cursor-pointer hover:-translate-y-1">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-xl">{cat.icon}</span>
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-medium bg-gradient-to-r ${cat.color} text-white`}>
                          {cat.label}
                        </span>
                      </div>
                      {event.is_pinned && (
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      )}
                    </div>
                    
                    <h3 className="text-lg font-bold text-gray-800 font-display mb-2">
                      {event.title}
                    </h3>
                    
                    {event.description && (
                      <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                        {event.description}
                      </p>
                    )}
                    
                    <div className="flex items-center text-xs text-gray-500">
                      <Calendar className="w-3.5 h-3.5 mr-1.5" />
                      {format(new Date(event.event_date), 'yyyy 年 MM 月 dd 日', { locale: zhCN })}
                      {event.user_name && (
                        <span className="ml-3 flex items-center">
                          <span className="w-5 h-5 bg-gradient-to-br from-primary-400 to-pink-400 rounded-full flex items-center justify-center text-white text-xs mr-1.5">
                            {event.user_name[0]?.toUpperCase()}
                          </span>
                          {event.user_name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
