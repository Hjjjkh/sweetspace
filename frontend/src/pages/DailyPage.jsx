import React, { useState, useEffect } from 'react';
import { api, useAuth } from '../hooks/useAuth';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Sparkles, BookOpen, Calendar, Check, X, Heart, Send, MessageCircle } from 'lucide-react';

// 优雅阴影定义
const softShadow = 'shadow-[0_4px_20px_-2px_rgba(219,39,119,0.12)]';
const hoverShadow = 'hover:shadow-[0_8px_30px_-4px_rgba(219,39,119,0.20)]';
const floatingShadow = 'shadow-[0_10px_40px_-10px_rgba(219,39,119,0.25)]';

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
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [showTopicReply, setShowTopicReply] = useState(false);
  const [replyAnswer, setReplyAnswer] = useState('');

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
    setGeneratingTopic(true);
    try {
      const response = await api.post('/ai/generate-topic', {
        category,
        relationshipStage: 'stable'
      });
      if (response.data.success) {
        setGeneratedTopics(response.data.data.topics);
        await fetchDailyQuestion();
      } else {
        alert(response.data.error || 'AI 话题生成失败');
      }
    } catch (error) {
      console.error('Generate AI topics error:', error);
      if (error.response?.status === 503) {
        alert('AI 服务未配置');
      } else {
        alert('AI 话题生成失败，请稍后再试');
      }
    } finally {
      setGeneratingTopic(false);
    }
  }

  async function handleTopicSelect(topic) {
    setSelectedTopic(topic);
    setShowTopicReply(true);
    setReplyAnswer('');
  }

  async function handleTopicReplySubmit(e) {
    e.preventDefault();
    
    if (!replyAnswer.trim()) {
      alert('请先写下你的想法');
      return;
    }

    try {
      if (dailyData?.question) {
        const response = await api.post('/daily/answer', {
          question_id: dailyData.question.id,
          answer: `[话题讨论] ${selectedTopic}\n\n${replyAnswer.trim()}`,
          is_visible_to_partner: true
        });
        
        if (response.data.success) {
          alert('已分享给 TA！💕');
          setShowTopicReply(false);
          setSelectedTopic(null);
          setReplyAnswer('');
          await fetchDailyQuestion();
        }
      } else {
        const response = await api.post('/messages', {
          content: `💭 话题讨论：${selectedTopic}\n\n${replyAnswer.trim()}`,
          unlock_at: new Date().toISOString(),
          is_visible_to_partner: true
        });
        
        if (response.data.success) {
          alert('已分享给 TA！💕');
          setShowTopicReply(false);
          setSelectedTopic(null);
          setReplyAnswer('');
        }
      }
    } catch (error) {
      console.error('Submit topic reply error:', error);
      alert('提交失败，请重试');
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-display font-bold text-pink-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            每日互动
          </h2>
          <p className="text-sm text-pink-600 mt-2 ml-13">每天一个小问题，增进彼此了解</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={loadHistory}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-pink-700 bg-white rounded-xl ${softShadow} hoverShadow transition-all cursor-pointer border border-pink-100`}
          >
            <BookOpen className="w-4 h-4" />
            <span>历史</span>
          </button>
          <button
            onClick={handleGenerateAITopics}
            disabled={generatingTopic}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-pink-500 to-pink-600 rounded-xl ${softShadow} hover:shadow-[0_8px_25px_-4px_rgba(219,39,119,0.4)] transition-all cursor-pointer disabled:from-gray-400 disabled:to-gray-500`}
          >
            {generatingTopic ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span>AI 话题</span>
          </button>
        </div>
      </div>

      {/* 今日问题卡片 */}
      {dailyData?.question ? (
        <div className="relative overflow-hidden bg-gradient-to-br from-pink-500 via-pink-400 to-rose-400 rounded-3xl p-8 text-white floatingShadow">
          {/* 装饰背景 */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/3 -translate-x-1/4 blur-3xl"></div>
          
          <div className="relative z-10">
            {/* 问题标签 */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <span className="text-sm font-medium text-pink-100">今日问题</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="px-3 py-1 bg-white/25 backdrop-blur-sm rounded-full text-xs font-semibold">
                    {format(new Date(dailyData.question.date), 'MM 月 dd 日', { locale: zhCN })}
                  </span>
                </div>
              </div>
            </div>

            {/* 问题内容 */}
            <p className="text-2xl sm:text-3xl font-display font-bold mb-8 leading-relaxed">
              {dailyData.question.question}
            </p>

            {/* 回答表单 */}
            {!dailyData.my_answer ? (
              <form onSubmit={handleSubmit} className="bg-white/15 backdrop-blur-md rounded-2xl p-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-pink-100 mb-2.5">
                    你的回答
                  </label>
                  <textarea
                    className="w-full px-5 py-4 rounded-xl text-gray-800 bg-white/95 backdrop-blur-sm outline-none resize-none border-2 border-transparent focus:border-white/50 transition-all duration-200 placeholder:text-gray-400"
                    rows="4"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="写下你最真实的想法和感受..."
                  />
                </div>

                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={isVisible}
                      onChange={(e) => setIsVisible(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-6 h-6 bg-white/20 rounded-lg border-2 border-white/30 peer-checked:bg-white peer-checked:border-white transition-all duration-200 flex items-center justify-center">
                      {isVisible && <Check className="w-4 h-4 text-pink-500" strokeWidth={3} />}
                    </div>
                  </div>
                  <span className="text-sm font-medium text-pink-50 group-hover:text-white transition-colors">
                    让 TA 看到我的答案
                  </span>
                </label>

                <button 
                  type="submit" 
                  className="w-full bg-white text-pink-600 font-bold py-4 rounded-xl hover:bg-pink-50 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl cursor-pointer"
                >
                  提交答案
                </button>
              </form>
            ) : (
              <div className="bg-white/15 backdrop-blur-md rounded-2xl p-6 space-y-5">
                <div>
                  <p className="text-sm font-medium text-pink-100 mb-3">你的回答：</p>
                  <div className="bg-white/20 rounded-xl p-5 backdrop-blur-sm">
                    <p className="font-medium leading-relaxed">{dailyData.my_answer.answer}</p>
                  </div>
                </div>

                {dailyData.partner_answer ? (
                  <div className="border-t border-white/20 pt-5">
                    <p className="text-sm font-medium text-pink-100 mb-3 flex items-center gap-2">
                      <Heart className="w-4 h-4" fill="currentColor" />
                      TA 的回答：
                    </p>
                    <div className="bg-white/20 rounded-xl p-5 backdrop-blur-sm">
                      <p className="font-medium leading-relaxed">{dailyData.partner_answer.answer}</p>
                    </div>
                  </div>
                ) : (
                  <div className={`flex items-center gap-3 text-sm bg-white/10 rounded-xl p-4 ${softShadow}`}>
                    <Sparkles className="w-5 h-5 text-pink-200" />
                    <span className="text-pink-100">你的 TA 还没有回答哦~</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white/80 backdrop-blur-md border border-pink-100 rounded-3xl p-16 text-center shadow-xl">
          <div className="w-20 h-20 bg-gradient-to-br from-pink-400 to-rose-400 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg animate-float">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 font-display mb-3">问题生成中</h3>
          <p className="text-gray-600 leading-relaxed">
            每日问题正在来的路上...<br/>
            请明天再来看吧
          </p>
        </div>
      )}

      {/* AI 生成话题 */}
      {generatedTopics.length > 0 && (
        <div className={`bg-white rounded-3xl p-8 border border-pink-100 ${floatingShadow}`}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl flex items-center justify-center shadow-md">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 font-display">AI 生成的话题</h3>
            </div>
            <button
              onClick={() => setGeneratedTopics([])}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all cursor-pointer cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="grid gap-4">
            {generatedTopics.map((topic, idx) => (
              <div
                key={idx}
                className={`group bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl p-5 hover:from-pink-100 hover:to-rose-100 transition-all duration-300 cursor-pointer border border-pink-100 ${hoverShadow}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <p className="text-gray-700 leading-relaxed flex-1">{topic}</p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTopicSelect(topic);
                    }}
                    className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-pink-500 text-pink-600 hover:text-white text-sm font-medium rounded-xl transition-all cursor-pointer shadow-sm hover:shadow-md border border-pink-100 hover:border-pink-500"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>分享</span>
                  </button>
                </div>
                <div className="flex items-center gap-4 mt-3.5">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(topic);
                      alert('已复制话题');
                    }}
                    className="text-pink-500 hover:text-pink-700 text-xs font-medium cursor-pointer flex items-center gap-1.5 transition-colors"
                  >
                    📋 复制
                  </button>
                  <span className="text-pink-300">·</span>
                  <span className="text-gray-500 text-xs">点击"分享"写下想法并发送给 TA</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 话题回复弹窗 */}
      {showTopicReply && selectedTopic && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800 font-display flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-rose-400 rounded-xl flex items-center justify-center">
                  <Send className="w-5 h-5 text-white" />
                </div>
                分享话题给 TA
              </h3>
              <button
                onClick={() => setShowTopicReply(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all cursor-pointer cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* 话题展示 */}
            <div className="mb-6 p-5 bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl border border-pink-100">
              <p className="text-gray-700 leading-relaxed font-medium">
                {selectedTopic}
              </p>
            </div>

            <form onSubmit={handleTopicReplySubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2.5">
                  你的想法
                </label>
                <textarea
                  className="w-full px-5 py-4 rounded-xl border border-gray-200 focus:border-pink-300 focus:ring-4 focus:ring-pink-100 outline-none resize-none transition-all placeholder:text-gray-400"
                  rows="5"
                  value={replyAnswer}
                  onChange={(e) => setReplyAnswer(e.target.value)}
                  placeholder="写下你的想法和感受，然后点击"分享给 TA"...
                  autoFocus
                />
                <div className="flex items-center justify-between mt-2.5">
                  <span className="text-xs text-gray-500">
                    {replyAnswer.length} 字
                  </span>
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <MessageCircle className="w-3.5 h-3.5" />
                    分享给 TA 后可在留言板查看
                  </span>
                </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={true}
                    disabled
                    className="sr-only peer"
                  />
                  <div className="w-6 h-6 bg-pink-100 rounded-lg border-2 border-pink-300 peer-checked:bg-pink-500 peer-checked:border-pink-500 transition-all duration-200 flex items-center justify-center">
                    <Check className="w-4 h-4 text-pink-500 peer-checked:text-white" strokeWidth={3} />
                  </div>
                </div>
                <span className="text-sm text-gray-600 font-medium">
                  让 TA 看到我的分享
                </span>
              </label>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowTopicReply(false)}
                  className="flex-1 px-6 py-3.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold transition-all cursor-pointer cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={!replyAnswer.trim()}
                  className="flex-1 px-6 py-3.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-bold hover:from-pink-600 hover:to-rose-600 disabled:from-gray-300 disabled:to-gray-400 transition-all cursor-pointer shadow-lg hover:shadow-xl cursor-pointer"
                >
                  💕 分享给 TA
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 历史记录 */}
      {showHistory && (
        <div className={`bg-white rounded-3xl p-6 border border-pink-100 ${floatingShadow} animate-slide-up`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-800 font-display flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-rose-400 rounded-xl flex items-center justify-center shadow-md">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              历史回答
            </h3>
            <button
              onClick={() => setShowHistory(false)}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-all cursor-pointer cursor-pointer"
            >
              收起
            </button>
          </div>

          {history.length === 0 ? (
            <p className="text-gray-500 text-center py-12">还没有历史回答</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {history.map((item, idx) => (
                <div 
                  key={idx}
                  className={`p-5 bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl hover:from-pink-100 hover:to-rose-100 transition-all duration-200 cursor-pointer border border-pink-100`}
                >
                  <div className="flex items-center flex-wrap gap-2.5 mb-3">
                    <span className="px-3 py-1.5 bg-gradient-to-r from-pink-400 to-rose-400 text-white text-xs font-bold rounded-xl shadow-sm">
                      {item.category || '日常'}
                    </span>
                    <span className="text-xs text-gray-500 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {format(new Date(item.date), 'yyyy 年 MM 月 dd 日', { locale: zhCN })}
                    </span>
                  </div>
                  <p className="font-bold text-gray-800 font-display mb-3 leading-relaxed">{item.question}</p>
                  {item.my_answer && (
                    <p className="text-sm text-gray-600 bg-white/70 rounded-xl p-4 leading-relaxed">
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
