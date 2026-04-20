import React, { useState, useEffect } from 'react';
import { api } from '../hooks/useAuth';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useAuth } from '../hooks/useAuth';

export default function DailyPage() {
  const { user } = useAuth();
  const [dailyData, setDailyData] = useState(null);
  const [answer, setAnswer] = useState('');
  const [isVisible, setIsVisible] = useState(true);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    fetchDailyQuestion();
  }, []);

  async function fetchDailyQuestion() {
    try {
      const response = await api.get('/daily/current');
      if (response.data.success) {
        setDailyData(response.data.data);
      }
    } catch (error) {
      console.error('Fetch daily question error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    
    if (!dailyData?.question || !answer.trim()) {
      alert('请先回答问题');
      return;
    }

    try {
      const response = await api.post('/daily/answer', {
        question_id: dailyData.question.id,
        answer: answer.trim(),
        is_visible_to_partner: isVisible
      });

      if (response.data.success) {
        await fetchDailyQuestion();
        setAnswer('');
        alert('回答成功！💕');
      }
    } catch (error) {
      if (error.response?.status === 409) {
        alert('你已经回答过今天的问题了');
      } else {
        alert('提交失败，请重试');
      }
    }
  }

  async function loadHistory() {
    try {
      const response = await api.get('/daily/history');
      if (response.data.success) {
        setHistory(response.data.data.history);
        setShowHistory(true);
      }
    } catch (error) {
      console.error('Fetch history error:', error);
    }
  }

  const categories = {
    general: '日常',
    deep: '深入',
    fun: '趣味',
    memory: '回忆',
    future: '未来'
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="section-title">✨ 每日互动</h2>
        <button
          onClick={loadHistory}
          className="text-sm text-primary-600 hover:underline"
        >
          查看历史
        </button>
      </div>

      {/* 今日问题卡片 */}
      <div className="card bg-gradient-to-br from-pink-500 to-red-500 text-white">
        <div className="flex items-center space-x-2 mb-4">
          <span className="text-2xl">🌟</span>
          <span className="font-medium opacity-90">
            {dailyData?.question ? '今日问题' : '问题生成中'}
          </span>
          {dailyData?.question && (
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
              {categories[dailyData.question.category]}
            </span>
          )}
        </div>

        {dailyData?.question ? (
          <>
            <p className="text-xl font-bold mb-2 leading-relaxed">
              {dailyData.question.question}
            </p>
            <p className="text-sm opacity-90 mb-4">
              {format(new Date(dailyData.question.date), 'yyyy 年 MM 月 dd 日', { locale: zhCN })}
            </p>

            {!dailyData.my_answer ? (
              <form onSubmit={handleSubmit} className="space-y-4 bg-white/10 rounded-lg p-4">
                <textarea
                  className="w-full px-3 py-2 rounded-lg text-gray-800 outline-none resize-none"
                  rows="3"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="写下你的答案..."
                />

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={isVisible}
                    onChange={(e) => setIsVisible(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">让 TA 看到我的答案</span>
                </label>

                <button type="submit" className="btn-primary bg-white text-pink-600 hover:bg-white/90 w-full">
                  提交答案
                </button>
              </form>
            ) : (
              <div className="bg-white/10 rounded-lg p-4 space-y-4">
                <div>
                  <p className="text-sm opacity-90 mb-1">你的回答：</p>
                  <p className="font-medium">{dailyData.my_answer.answer}</p>
                </div>

                {dailyData.partner_answer && (
                  <div className="border-t border-white/20 pt-4">
                    <p className="text-sm opacity-90 mb-1">TA 的回答：</p>
                    <p className="font-medium">{dailyData.partner_answer.answer}</p>
                  </div>
                )}

                {!dailyData.partner_answer && (
                  <p className="text-sm opacity-75">你的 TA 还没有回答哦~</p>
                )}
              </div>
            )}
          </>
        ) : (
          <p className="text-center py-8 opacity-90">
            今目的问题正在来的路上...<br/>
            请明天再来看吧
          </p>
        )}
      </div>

      {/* 历史记录 */}
      {showHistory && (
        <div className="card animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800">历史问答</h3>
            <button
              onClick={() => setShowHistory(false)}
              className="text-sm text-gray-500"
            >
              收起
            </button>
          </div>

          {history.length === 0 ? (
            <p className="text-gray-500 text-center py-4">还没有历史回答</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {history.map((item, idx) => (
                <div 
                  key={idx}
                  className="p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-xs px-2 py-1 bg-primary-100 text-primary-700 rounded-full">
                      {categories[item.category]}
                    </span>
                    <span className="text-xs text-gray-500">
                      {format(new Date(item.date), 'PP', { locale: zhCN })}
                    </span>
                  </div>
                  <p className="font-medium text-gray-800 mb-2">{item.question}</p>
                  {item.my_answer && (
                    <p className="text-sm text-gray-600">
                      💭 {item.my_answer}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
