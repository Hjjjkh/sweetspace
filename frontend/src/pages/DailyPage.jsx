import React, { useState, useEffect } from 'react';
import { api, useAuth } from '../hooks/useAuth';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Sparkles, BookOpen, Calendar, Check, X } from 'lucide-react';

const categories = {
  general: { label: '日常', color: 'from-blue-400 to-cyan-400' },
  deep: { label: '深入', color: 'from-purple-400 to-pink-400' },
  fun: { label: '趣味', color: 'from-yellow-400 to-orange-400' },
  memory: { label: '回忆', color: 'from-pink-400 to-rose-400' },
  future: { label: '未来', color: 'from-green-400 to-emerald-400' }
};

export default function DailyPage() {
  const { user } = useAuth();
  const [dailyData, setDailyData] = useState(null);
  const [answer, setAnswer] = useState('');
  const [isVisible, setIsVisible] = useState(true);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [generatingTopic, setGeneratingTopic] = useState(false);
  const [generatedTopics, setGeneratedTopics] = useState([]);

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
      }
    } catch (error) {
      console.error('Submit answer error:', error);
      if (error.response?.status === 409) {
        alert('你已经回答过今天的问题了');
      } else {
        alert('提交失败，请重试');
      }
    }
  }

  async function handleGenerateAITopics(category = 'general') {
    console.log('[DailyPage] Starting AI topic generation, category:', category);
    setGeneratingTopic(true);
    try {
      console.log('[DailyPage] Sending API request to /ai/generate-topic');
      const response = await api.post('/ai/generate-topic', {
        category,
        relationshipStage: 'stable'
      });
      console.log('[DailyPage] API response:', response.data);
      if (response.data.success) {
        console.log('[DailyPage] Topics generated:', response.data.data.topics);
        setGeneratedTopics(response.data.data.topics);
      } else {
        console.error('[DailyPage] API returned success=false:', response.data);
        alert(response.data.error || 'AI 话题生成失败');
      }
    } catch (error) {
      console.error('[DailyPage] Generate AI topics error:', error);
      console.error('[DailyPage] Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
      if (error.response?.status === 503) {
        alert('AI 服务未配置，请联系管理员设置 OPENROUTER_API_KEY');
      } else if (error.response?.status === 429) {
        alert('AI 调用频率过高，请稍后再试');
      } else {
        alert('AI 话题生成失败：' + (error.response?.data?.error || error.message || '请稍后再试'));
      }
    } finally {
      setGeneratingTopic(false);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 font-display flex items-center">
          <Sparkles className="w-7 h-7 mr-3 text-primary-500" />
          每日互动
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={loadHistory}
            className="flex items-center space-x-2 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors cursor-pointer"
          >
            <BookOpen className="w-4 h-4" />
            <span>查看历史</span>
          </button>
          <button
            onClick={() => handleGenerateAITopics('general')}
            disabled={generatingTopic}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm
              bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg
              hover:from-purple-600 hover:to-pink-600
              disabled:from-gray-400 disabled:to-gray-500
              transition-all cursor-pointer shadow-md hover:shadow-lg
            "
          >
            {generatingTopic ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span>AI 生成话题</span>
          </button>
        </div>
      </div>

      {/* 今日问题卡片 */}
      {dailyData?.question ? (
        <div className="relative overflow-hidden bg-gradient-to-br from-primary-500 via-pink-500 to-rose-500 rounded-3xl p-6 sm:p-8 text-white shadow-floating">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/3 -translate-x-1/4"></div>
          
          <div className="relative z-10">
            <div className="flex items-center space-x-3 mb-5">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6" fill="currentColor" />
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-medium">今日问题</span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${categories[dailyData.question.category]?.color || 'from-gray-400 to-gray-500'}`}>
                  {categories[dailyData.question.category]?.label || '日常'}
                </span>
              </div>
            </div>

            <p className="text-2xl sm:text-3xl font-bold mb-3 leading-relaxed font-display">
              {dailyData.question.question}
            </p>
            <p className="text-sm sm:text-base opacity-90 mb-6 flex items-center">
              <Calendar className="w-4 h-4 mr-1.5" />
              {format(new Date(dailyData.question.date), 'yyyy 年 MM 月 dd 日', { locale: zhCN })}
            </p>

            {!dailyData.my_answer ? (
              <form onSubmit={handleSubmit} className="bg-white/15 backdrop-blur-sm rounded-2xl p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 opacity-90">
                    你的回答
                  </label>
                  <textarea
                    className="w-full px-4 py-3 rounded-xl text-gray-800 bg-white/90 backdrop-blur-sm outline-none resize-none border-2 border-transparent focus:border-white/50 transition-all duration-200"
                    rows="4"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="写下你的答案..."
                  />
                </div>

                <label className="flex items-center space-x-2 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={isVisible}
                      onChange={(e) => setIsVisible(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-5 h-5 bg-white/20 rounded border border-white/30 peer-checked:bg-white peer-checked:border-white transition-all duration-200 flex items-center justify-center">
                      {isVisible && <Check className="w-3.5 h-3.5 text-pink-500" strokeWidth={3} />}
                    </div>
                  </div>
                  <span className="text-sm font-medium group-hover:opacity-100 opacity-90 transition-opacity">
                    让 TA 看到我的答案
                  </span>
                </label>

                <button 
                  type="submit" 
                  className="w-full bg-white text-pink-600 font-bold py-3.5 rounded-xl hover:bg-white/90 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl hover:-translate-y-0.5 font-medium"
                >
                  提交答案
                </button>
              </form>
            ) : (
              <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-5 space-y-4">
                <div>
                  <p className="text-sm font-medium opacity-80 mb-2">你的回答：</p>
                  <p className="font-medium bg-white/20 rounded-xl p-4">{dailyData.my_answer.answer}</p>
                </div>

                {dailyData.partner_answer ? (
                  <div className="border-t border-white/20 pt-4">
                    <p className="text-sm font-medium opacity-80 mb-2">TA 的回答：</p>
                    <p className="font-medium bg-white/20 rounded-xl p-4">{dailyData.partner_answer.answer}</p>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 text-sm opacity-75 bg-white/10 rounded-xl p-3">
                    <Sparkles className="w-4 h-4" />
                    <span>你的 TA 还没有回答哦~</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white/70 backdrop-blur-glass border border-rose-border rounded-2xl p-12 text-center shadow-glass">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md animate-float">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-lg font-bold text-gray-800 font-display mb-2">问题生成中</h3>
          <p className="text-gray-600">
            每日问题正在来的路上...<br/>
            请明天再来看吧
          </p>
        </div>
      )}

      {/* AI 生成话题 */}
      {generatedTopics.length > 0 && (
        <div className="bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 rounded-2xl p-6 shadow-floating">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-white" />
              <h3 className="font-bold text-white text-lg">AI 生成的话题</h3>
            </div>
            <button
              onClick={() => setGeneratedTopics([])}
              className="text-white/70 hover:text-white cursor-pointer p-1 rounded hover:bg-white/10 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-2">
            {generatedTopics.map((topic, idx) => (
              <div
                key={idx}
                className="bg-white/20 rounded-lg p-3 hover:bg-white/30 transition-all cursor-pointer"
                onClick={() => {
                  navigator.clipboard.writeText(topic);
                  alert('已复制话题');
                }}
              >
                <p className="text-white text-sm">{topic}</p>
              </div>
            ))}
          </div>
        </div>
      )}


      {/* 历史记录 */}
      {showHistory && (
        <div className="bg-white/70 backdrop-blur-glass border border-rose-border rounded-2xl p-6 shadow-glass animate-slide-up">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-bold text-gray-800 font-display flex items-center">
              <BookOpen className="w-5 h-5 mr-2 text-primary-500" />
              历史回答
            </h3>
            <button
              onClick={() => setShowHistory(false)}
              className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
            >
              收起
            </button>
          </div>

          {history.length === 0 ? (
            <p className="text-gray-500 text-center py-8">还没有历史回答</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {history.map((item, idx) => {
                const cat = categories[item.category] || categories.general;
                return (
                  <div 
                    key={idx}
                    className="p-4 bg-white/50 rounded-xl hover:bg-white/70 transition-all duration-200 cursor-pointer"
                  >
                    <div className="flex items-center flex-wrap gap-2 mb-3">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold bg-gradient-to-r ${cat.color} text-white`}>
                        {cat.label}
                      </span>
                      <span className="text-xs text-gray-500 flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {format(new Date(item.date), 'yyyy-MM-dd', { locale: zhCN })}
                      </span>
                    </div>
                    <p className="font-bold text-gray-800 font-display mb-2">{item.question}</p>
                    {item.my_answer && (
                      <p className="text-sm text-gray-600 bg-white/60 rounded-lg p-3">
                        💭 {item.my_answer}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
