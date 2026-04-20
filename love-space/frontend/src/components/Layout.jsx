import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const navItems = [
  { path: '/', label: '首页', icon: '🏠' },
  { path: '/timeline', label: '时间线', icon: '📅' },
  { path: '/messages', label: '留言', icon: '💌' },
  { path: '/moods', label: '心情', icon: '😊' },
  { path: '/daily', label: '每日', icon: '✨' },
  { path: '/gallery', label: '相册', icon: '📸' },
];

export default function Layout() {
  const location = useLocation();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-love-200">
      {/* 顶部导航栏 */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-3xl">💕</span>
            <h1 className="text-xl font-bold text-primary-600">Love Space</h1>
          </Link>
          
          {user && (
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-600 hidden sm:block">
                {user.name} & {user.partner?.name || 'TA'}
              </span>
              {user.avatar_url && (
                <img 
                  src={user.avatar_url} 
                  alt={user.name}
                  className="w-8 h-8 rounded-full"
                />
              )}
            </div>
          )}
        </div>
      </header>

      {/* 主要内容区 */}
      <main className="max-w-6xl mx-auto px-4 py-6 pb-24">
        <Outlet />
      </main>

      {/* 底部导航栏 (移动端) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-gray-200 sm:hidden z-50">
        <div className="flex justify-around">
          {navItems.slice(0, 5).map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center py-3 px-2 flex-1 ${
                location.pathname === item.path
                  ? 'text-primary-600'
                  : 'text-gray-500'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* 侧边导航栏 (桌面端) */}
      <nav className="hidden sm:flex fixed left-0 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm rounded-r-2xl shadow-lg p-2 space-y-2 z-40">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
              location.pathname === item.path
                ? 'bg-primary-100 text-primary-600'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
