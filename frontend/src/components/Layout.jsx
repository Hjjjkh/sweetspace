import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Home, Calendar, Mail, Smile, Sparkles, Image, Heart } from 'lucide-react';

const navItems = [
  { path: '/', label: '首页', icon: Home },
  { path: '/timeline', label: '时间线', icon: Calendar },
  { path: '/messages', label: '留言', icon: Mail },
  { path: '/moods', label: '心情', icon: Smile },
  { path: '/daily', label: '每日', icon: Sparkles },
  { path: '/gallery', label: '相册', icon: Image },
];

export default function Layout() {
  const location = useLocation();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-romantic-gradient">
      {/* 背景装饰 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float"></div>
        <div className="absolute top-40 -left-40 w-80 h-80 bg-accent-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute -bottom-40 left-1/2 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* 顶部导航栏 */}
      <header className="relative bg-white/70 backdrop-blur-glass border-b border-rose-border shadow-glass sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-floating transition-shadow duration-300">
                <Heart className="w-5 h-5 text-white" fill="currentColor" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent">
                Love Space
              </h1>
            </Link>
            
            {/* 用户信息 */}
            {user && (
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-700 hidden sm:block font-medium">
                  {user.name} <span className="text-primary-500">&</span> {user.partner?.name || 'TA'}
                </span>
                {user.avatar_url ? (
                  <img 
                    src={user.avatar_url} 
                    alt={user.name}
                    className="w-9 h-9 rounded-full border-2 border-primary-300 shadow-md"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-pink-400 flex items-center justify-center shadow-md">
                    <span className="text-white text-sm font-bold">{user.name[0]?.toUpperCase()}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 主要内容区 */}
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
        <Outlet />
      </main>

      {/* 底部导航栏 (移动端) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-glass border-t border-rose-border shadow-glass sm:hidden z-50 safe-area-bottom">
        <div className="flex justify-around items-center">
          {navItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center py-3 px-2 flex-1 transition-all duration-200 ${
                  isActive 
                    ? 'text-primary-600 scale-105' 
                    : 'text-gray-500 hover:text-primary-400'
                }`}
              >
                <div className={`p-2 rounded-xl transition-all duration-200 ${
                  isActive ? 'bg-primary-100' : ''
                }`}>
                  <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : ''}`} />
                </div>
                <span className="text-xs mt-1 font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* 侧边导航栏 (桌面端) */}
      <nav className="hidden sm:flex fixed left-4 top-1/2 -translate-y-1/2 bg-white/70 backdrop-blur-glass border border-rose-border rounded-2xl shadow-glass p-2 space-y-1 z-40">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-primary-100 text-primary-600 shadow-md'
                  : 'text-gray-600 hover:bg-white/50 hover:text-primary-500'
              }`}
            >
              <div className={`p-1.5 rounded-lg transition-all duration-200 ${
                isActive ? 'bg-primary-200' : ''
              }`}>
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : ''}`} />
              </div>
              <span className="font-medium text-sm whitespace-nowrap">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* 相册快捷入口 (桌面端右下角) */}
      <Link
        to="/gallery"
        className="hidden sm:flex fixed right-4 bottom-8 bg-white/70 backdrop-blur-glass border border-rose-border rounded-2xl shadow-glass p-3 hover:shadow-floating transition-all duration-300 cursor-pointer z-40 group"
        style={{ marginTop: '0' }}
      >
        <div className="w-12 h-12 bg-gradient-to-br from-accent-400 to-orange-400 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
          <Image className="w-6 h-6 text-white" />
        </div>
      </Link>
    </div>
  );
}
