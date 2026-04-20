import React, { useState, useEffect } from 'react';
import { api, useAuth } from '../hooks/useAuth';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Mail, Send, Inbox, Clock, Check, Plus, X, Eye, Sparkles } from 'lucide-react';

export default function MessagesPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [messageType, setMessageType] = useState('all');
  const [newMessage, setNewMessage] = useState({
    content: '',
    reveal_at: ''
  });
  const [polishedVersions, setPolishedVersions] = useState({});
  const [showPolish, setShowPolish] = useState(false);
  const [polishLoading, setPolishLoading] = useState(false);

  useEffect(() => {
    fetchMessages();
  }, [messageType]);

  async function fetchMessages() {
    try {
      const response = await api.get('/messages', { 
        params: { type: messageType } 
      });
      if (response.data.success) {
        setMessages(response.data.data.messages);
      }
    } catch (error) {
      console.error('Fetch messages error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const payload = {
        content: newMessage.content,
        reveal_at: newMessage.reveal_at ? new Date(newMessage.reveal_at).getTime() / 1000 : null
      };
      
      const response = await api.post('/messages', payload);
      if (response.data.success) {
        await fetchMessages();
        setShowForm(false);
        setNewMessage({ content: '', reveal_at: '' });
      }
    } catch (error) {
      console.error('Create message error:', error);
      alert('发送失败，请重试');
    }
  }

  async function handlePolishMessage() {
    if (!newMessage.content.trim()) {
      alert('请先输入留言内容');
      return;
    }

    setPolishLoading(true);
    try {
      const response = await fetch('/api/ai/polish-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          draft: newMessage.content,
          styles: ['温馨', '幽默', '深情']
        })
      });

      const result = await response.json();
      if (result.success) {
        setPolishedVersions(result.polished);
        setShowPolish(true);
      }
    } catch (error) {
      console.error('Polish error:', error);
      alert('AI 润色失败，请稍后重试');
    } finally {
      setPolishLoading(false);
    }
  }

  function applyPolishedVersion(version, content) {
    setNewMessage({ ...newMessage, content });
    setShowPolish(false);
    setPolishedVersions({});
  }

  async function handleRead(messageId) {
    try {
      await api.put(`/messages/${messageId}/read`);
      fetchMessages();
    } catch (error) {
      console.error('Mark read error:', error);
    }
  }

  const typeConfigs = {
    all: { label: '全部留言', icon: Mail },
    received: { label: '收到的', icon: Inbox },
    sent: { label: '我发送的', icon: Send }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 font-display flex items-center">
          <Mail className="w-7 h-7 mr-3 text-primary-500" />
          留言板
        </h2>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="flex items-center space-x-2 bg-gradient-to-r from-primary-500 to-pink-500 text-white px-4 py-2.5 rounded-xl font-medium shadow-lg hover:shadow-floating transition-all duration-300 cursor-pointer hover:-translate-y-0.5"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">{showForm ? '取消' : '写留言'}</span>
        </button>
      </div>

      {/* 类型切换 */}
      <div className="flex space-x-2 overflow-x-auto pb-2">
        {Object.entries(typeConfigs).map(([key, config]) => {
          const Icon = config.icon;
          return (
            <button
              key={key}
              onClick={() => setMessageType(key)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all duration-200 cursor-pointer ${
                messageType === key
                  ? 'bg-gradient-to-r from-primary-500 to-pink-500 text-white shadow-md'
                  : 'bg-white/70 backdrop-blur-glass border border-rose-border text-gray-600 hover:bg-white/90'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{config.label}</span>
            </button>
          );
        })}
      </div>

      {/* 写留言表单 */}
      {showForm && (
        <div className="bg-white/70 backdrop-blur-glass border border-rose-border rounded-2xl p-6 shadow-glass animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800 font-display flex items-center">
              <Send className="w-5 h-5 mr-2 text-primary-500" />
              写留言
            </h3>
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
                留言内容 *
              </label>
              <textarea
                required
                className="w-full px-4 py-2.5 bg-white/50 border border-rose-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent transition-all duration-200"
                rows="4"
                value={newMessage.content}
                onChange={(e) => setNewMessage({...newMessage, content: e.target.value})}
                placeholder="写下你想对 TA 说的话..."
              />
              
              {/* AI 润色按钮 */}
              <div className="mt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handlePolishMessage}
                  disabled={!newMessage.content.trim() || polishLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm
                    bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg
                    hover:from-purple-600 hover:to-pink-600
                    disabled:from-gray-400 disabled:to-gray-500
                    transition-all cursor-pointer shadow-md hover:shadow-lg
                  "
                >
                  {polishLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  <span>AI 润色</span>
                </button>
                <span className="text-xs text-gray-500">提供 3 种不同风格建议</span>
              </div>
            </div>

            {/* AI 润色结果 */}
            {showPolish && Object.keys(polishedVersions).length > 0 && (
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    <span className="text-sm font-medium text-purple-700">AI 润色建议</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPolish(false);
                      setPolishedVersions({});
                    }}
                    className="text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-3">
                  {Object.entries(polishedVersions).map(([style, content]) => (
                    <div key={style} className="bg-white/70 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-purple-600">{style}版本</span>
                        <button
                          type="button"
                          onClick={() => applyPolishedVersion(style, content)}
                          className="text-xs px-2 py-1 bg-purple-500 text-white rounded hover:bg-purple-600 cursor-pointer"
                        >
                          使用此版本
                        </button>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center">
                <Clock className="w-4 h-4 mr-1.5 text-gray-500" />
                定时解锁 (可选)
              </label>
              <input
                type="datetime-local"
                className="w-full px-4 py-2.5 bg-white/50 border border-rose-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent transition-all duration-200"
                value={newMessage.reveal_at}
                onChange={(e) => setNewMessage({...newMessage, reveal_at: e.target.value})}
              />
              <p className="text-xs text-gray-500 mt-1.5">
                设置后，留言将在指定时间才会对 TA 可见
              </p>
            </div>

            <button type="submit" className="w-full bg-gradient-to-r from-primary-500 to-pink-500 text-white font-medium py-3 rounded-xl shadow-lg hover:shadow-floating transition-all duration-300 cursor-pointer hover:-translate-y-0.5 flex items-center justify-center space-x-2">
              <Send className="w-4 h-4" />
              <span>发送留言</span>
            </button>
          </form>
        </div>
      )}

      {/* 留言列表 */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin"></div>
          </div>
        </div>
      ) : messages.length === 0 ? (
        <div className="bg-white/70 backdrop-blur-glass border border-rose-border rounded-2xl p-12 text-center shadow-glass">
          <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-rose-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-600 font-medium">还没有留言哦~</p>
          <p className="text-sm text-gray-500 mt-2">写下你们之间的第一封留言吧</p>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((msg) => (
            <div 
              key={msg.id}
              className={`bg-white/70 backdrop-blur-glass border border-rose-border rounded-2xl p-5 shadow-glass hover:shadow-floating transition-all duration-300 relative overflow-hidden ${
                !msg.is_read ? 'ring-2 ring-primary-300' : ''
              }`}
            >
              {!msg.is_read && (
                <div className="absolute top-0 right-0 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold px-3 py-1.5 rounded-bl-xl flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>新</span>
                </div>
              )}

              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-pink-400 rounded-xl flex items-center justify-center shadow-md">
                    <Mail className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">
                      {messageType === 'received' ? msg.sender_name : 'TA'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(msg.created_at * 1000), 'MM/dd HH:mm', { locale: zhCN })}
                    </p>
                  </div>
                </div>

                {!msg.is_read && messageType === 'received' && (
                  <button
                    onClick={() => handleRead(msg.id)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-primary-500 to-pink-500 text-white text-xs font-medium rounded-lg hover:shadow-md transition-all duration-200 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>已读</span>
                  </button>
                )}
              </div>

              <div className="bg-white/60 rounded-xl p-4 mb-3">
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              </div>

              {msg.reveal_at && (
                <div className="flex items-center text-xs text-gray-500 bg-primary-50/50 rounded-lg px-3 py-2">
                  <Clock className="w-3.5 h-3.5 mr-2" />
                  <span>解锁时间：{format(new Date(msg.reveal_at * 1000), 'yyyy-MM-dd HH:mm', { locale: zhCN })}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
