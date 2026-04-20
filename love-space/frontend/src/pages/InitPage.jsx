import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

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
      const result = await initializeUsers(formData);
      if (result.success) {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || '初始化失败，请重试');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-100 via-pink-50 to-red-100 p-4">
      <div className="w-full max-w-md">
        <div className="card">
          <div className="text-center mb-8">
            <h1 className="text-4xl mb-2">💕</h1>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Love Space
            </h2>
            <p className="text-gray-600">
              只属于你们两个人的私密空间
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                你的邮箱 *
              </label>
              <input
                type="email"
                required
                className="input-field"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                你的昵称 *
              </label>
              <input
                type="text"
                required
                className="input-field"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="你的昵称"
              />
            </div>

            <div className="border-t pt-4 mt-4">
              <p className="text-sm text-gray-500 mb-4 text-center">
                邀请你的另一半加入
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  TA 的邮箱 *
                </label>
                <input
                  type="email"
                  required
                  className="input-field"
                  value={formData.partner_email}
                  onChange={(e) => setFormData({...formData, partner_email: e.target.value})}
                  placeholder="partner@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  TA 的昵称 *
                </label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={formData.partner_name}
                  onChange={(e) => setFormData({...formData, partner_name: e.target.value})}
                  placeholder="TA 的昵称"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`btn-primary w-full py-3 ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? '创建中...' : '开始我们的空间'}
            </button>
          </form>

          <p className="text-xs text-gray-500 text-center mt-4">
            系统将仅允许你们两人访问，完全私密安全
          </p>
        </div>
      </div>
    </div>
  );
}
