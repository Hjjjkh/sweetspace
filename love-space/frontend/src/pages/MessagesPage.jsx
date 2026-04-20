import React, { useState, useEffect } from 'react';
import { api } from '../hooks/useAuth';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useAuth } from '../hooks/useAuth';

export default function MessagesPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [messageType, setMessageType] = useState('all'); // all, received, sent
  const [newMessage, setNewMessage] = useState({
    content: '',
    reveal_at: ''
  });

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

  async function handleRead(messageId) {
    try {
      await api.put(`/messages/${messageId}/read`);
      fetchMessages();
    } catch (error) {
      console.error('Mark read error:', error);
    }
  }

  const typeLabels = {
    all: '全部留言',
    received: '收到的',
    sent: '我发送的'
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="section-title">💌 留言板</h2>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="btn-primary text-sm"
        >
          {showForm ? '取消' : '+ 写留言'}
        </button>
      </div>

      {/* 类型切换 */}
      <div className="flex space-x-2">
        {Object.entries(typeLabels).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setMessageType(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              messageType === key
                ? 'bg-primary-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 写留言表单 */}
      {showForm && (
        <div className="card animate-fade-in">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                留言内容 *
              </label>
              <textarea
                required
                className="input-field"
                rows="4"
                value={newMessage.content}
                onChange={(e) => setNewMessage({...newMessage, content: e.target.value})}
                placeholder="写下你想对 TA 说的话..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                定时解锁 (可选)
              </label>
              <input
                type="datetime-local"
                className="input-field"
                value={newMessage.reveal_at}
                onChange={(e) => setNewMessage({...newMessage, reveal_at: e.target.value})}
              />
              <p className="text-xs text-gray-500 mt-1">
                设置后，留言将在指定时间才会对 TA 可见
              </p>
            </div>

            <button type="submit" className="btn-primary w-full">
              发送留言
            </button>
          </form>
        </div>
      )}

      {/* 留言列表 */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      ) : messages.length === 0 ? (
        <div className="card text-center py-12 text-gray-500">
          <p>还没有留言哦~</p>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((msg) => (
            <div 
              key={msg.id}
              className={`card relative overflow-hidden ${
                !msg.is_read ? 'bg-gradient-to-r from-primary-50 to-pink-50' : ''
              }`}
            >
              {!msg.is_read && (
                <span className="absolute top-2 right-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                  新
                </span>
              )}

              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">💕</span>
                  <div>
                    <p className="font-medium text-gray-800">
                      {messageType === 'received' ? msg.sender_name : 'TA'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(msg.created_at * 1000), 'PPpp', { locale: zhCN })}
                    </p>
                  </div>
                </div>

                {!msg.is_read && messageType === 'received' && (
                  <button
                    onClick={() => handleRead(msg.id)}
                    className="text-xs px-3 py-1 bg-primary-500 text-white rounded-full hover:bg-primary-600"
                  >
                    设为已读
                  </button>
                )}
              </div>

              <div className="bg-white/50 rounded-lg p-4 mb-3">
                <p className="text-gray-700 whitespace-pre-wrap">{msg.content}</p>
              </div>

              {msg.reveal_at && (
                <p className="text-xs text-gray-500">
                  ⏰ 解锁时间：{format(new Date(msg.reveal_at * 1000), 'PPpp', { locale: zhCN })}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
