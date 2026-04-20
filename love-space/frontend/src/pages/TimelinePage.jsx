import React, { useState, useEffect } from 'react';
import { api } from '../hooks/useAuth';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

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

  const categories = {
    memory: '💭 美好回忆',
    anniversary: '🎉 纪念日',
    first_time: '⭐ 第一次',
    trip: '✈️ 旅行',
    other: '📝 其他'
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="section-title">💕 时间线</h2>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="btn-primary text-sm"
        >
          {showForm ? '取消' : '+ 添加回忆'}
        </button>
      </div>

      {/* 添加事件表单 */}
      {showForm && (
        <div className="card animate-fade-in">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                事件标题 *
              </label>
              <input
                type="text"
                required
                className="input-field"
                value={newEvent.title}
                onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                placeholder="例如：第一次约会"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                事件日期 *
              </label>
              <input
                type="date"
                required
                className="input-field"
                value={newEvent.event_date}
                onChange={(e) => setNewEvent({...newEvent, event_date: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                分类
              </label>
              <select
                className="input-field"
                value={newEvent.category}
                onChange={(e) => setNewEvent({...newEvent, category: e.target.value})}
              >
                {Object.entries(categories).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                描述
              </label>
              <textarea
                className="input-field"
                rows="3"
                value={newEvent.description}
                onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                placeholder="记录下这个特别的时刻..."
              />
            </div>

            <button type="submit" className="btn-primary w-full">
              保存回忆
            </button>
          </form>
        </div>
      )}

      {/* 时间线列表 */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      ) : events.length === 0 ? (
        <div className="card text-center py-12 text-gray-500">
          <p>还没有任何回忆，添加第一条记录吧 🌟</p>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event, idx) => (
            <div 
              key={event.id} 
              className="card relative pl-8 before:absolute before:left-3 before:top-10 before:bottom-0 before:w-0.5 before:bg-primary-200 animate-slide-up"
              style={{ animationDelay: `${idx * 0.1}s` }}
            >
              <div className="absolute left-0 top-10 w-6 h-6 bg-primary-500 rounded-full transform -translate-x-1/2 border-4 border-white shadow"></div>
              
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-lg">{categories[event.category]?.split(' ')[0]}</span>
                    <h3 className="text-lg font-bold text-gray-800">{event.title}</h3>
                  </div>
                  
                  {event.description && (
                    <p className="text-gray-600 mb-3">{event.description}</p>
                  )}
                  
                  <div className="text-sm text-gray-500">
                    {format(new Date(event.event_date), 'yyyy 年 MM 月 dd 日', { locale: zhCN })}
                    {event.user_name && (
                      <span className="ml-2">• {event.user_name}</span>
                    )}
                  </div>
                </div>

                {event.is_pinned && (
                  <span className="text-xl">📌</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
