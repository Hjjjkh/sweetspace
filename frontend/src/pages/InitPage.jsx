import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Heart, Mail, User, Sparkles } from 'lucide-react';

export default function InitPage() {
  const navigate = useNavigate();
  const { initializeUsers } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    partner_email: '',
    partner_name: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('提交注册数据:', formData);
      const result = await initializeUsers(formData);
      console.log('注册结果:', result);
      
      if (result.success) {
        console.log('注册成功，准备跳转...');
        // 直接硬刷新，不使用 navigate
        window.location.href = '/';
        return;
      } else {
        setError('注册失败：' + (result.message || '未知错误'));
      }
    } catch (err) {
      console.error('注册错误:', err);
      const errorMsg = err.response?.data?.message || err.message || '初始化失败，请重试';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-romantic-gradient p-4 relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float"></div>
        <div className="absolute top-40 -left-40 w-80 h-80 bg-accent-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute -bottom-40 left-1/2 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white/70 backdrop-blur-glass border border-rose-border rounded-3xl shadow-glass p-8">
          {/* Logo 和标题 */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg animate-float">
              <Heart className="w-8 h-8 text-white" fill="currentColor" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent font-display mb-2">
              Love Space
            </h1>
            <p className="text-gray-600 text-sm">
              只属于你们两个人的私密空间
            </p>
          </div>

          {/* 功能亮点 */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-white/50 rounded-xl p-3 text-center">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Heart className="w-4 h-4 text-white" />
              </div>
              <p className="text-xs font-medium text-gray-600">记录回忆</p>
            </div>
            <div className="bg-white/50 rounded-xl p-3 text-center">
              <div className="w-8 h-8 bg-gradient-to-br from-pink-400 to-rose-400 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Mail className="w-4 h-4 text-white" />
              </div>
              <p className="text-xs font-medium text-gray-600">留言传情</p>
            </div>
            <div className="bg-white/50 rounded-xl p-3 text-center">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <p className="text-xs font-medium text-gray-600">每日互动</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 你的信息 */}
            <div className="border-b border-rose-border pb-4">
              <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center">
                <User className="w-4 h-4 mr-1.5 text-primary-500" />
                你的信息
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    邮箱 *
                  </label>
                  <input
                    type="email"
                    required
                    className="input-glass"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    昵称 *
                  </label>
                  <input
                    type="text"
                    required
                    className="input-glass"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="你的昵称"
                  />
                </div>
              </div>
            </div>

            {/* TA 的信息 */}
            <div>
              <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center">
                <Heart className="w-4 h-4 mr-1.5 text-pink-500" />
                TA 的信息
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    TA 的邮箱 *
                  </label>
                  <input
                    type="email"
                    required
                    className="input-glass"
                    value={formData.partner_email}
                    onChange={(e) => setFormData({...formData, partner_email: e.target.value})}
                    placeholder="partner@email.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    TA 的昵称 *
                  </label>
                  <input
                    type="text"
                    required
                    className="input-glass"
                    value={formData.partner_name}
                    onChange={(e) => setFormData({...formData, partner_name: e.target.value})}
                    placeholder="TA 的昵称"
                  />
                </div>
              </div>
            </div>

            {/* 错误提示 */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-xl flex items-center">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2"></div>
                {error}
              </div>
            )}

            {/* 提交按钮 */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full font-medium py-3.5 rounded-xl shadow-lg transition-all duration-300 cursor-pointer flex items-center justify-center space-x-2 ${
                loading
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-primary-500 to-pink-500 text-white hover:shadow-floating hover:-translate-y-0.5'
              }`}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  <span>创建中...</span>
                </>
              ) : (
                <>
                  <Heart className="w-5 h-5" fill="currentColor" />
                  <span>开始我们的空间</span>
                </>
              )}
            </button>
          </form>

          {/* 安全提示 */}
          <div className="mt-6 pt-4 border-t border-rose-border">
            <p className="text-xs text-gray-500 text-center flex items-center justify-center">
              <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              基于 Cloudflare，仅允许你们两人访问，完全私密安全
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
