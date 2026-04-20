import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Home, Calendar, Mail, Smile, Sparkles, Image, Heart, Menu, X } from 'lucide-react';

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
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-romantic-gradient flex">
      {/* 背景装饰 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float"></div>
        <div className="absolute top-40 -left-40 w-80 h-80 bg-accent-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute -bottom-40 left-1/2 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* 桌面端侧边导航栏 - 固定在左侧 */}
      <aside className="hidden lg:flex flex-col w-20 fixed left-0 top-0 bottom-0 bg-white/70 backdrop-blur-glass border-r border-rose-border shadow-glass z-40">
        <div className="flex-1 flex flex-col items-center py-6 space-y-4">
          {/* Logo */}
          <Link to="/" className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-primary-500 to-pink-500 rounded-xl shadow-lg mb-4 cursor-pointer">
            <Heart className="w-6 h-6 text-white" fill="currentColor" />
          </Link>
          
          {/* 导航项目 */}
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-primary-100 text-primary-600 shadow-md'
                    : 'text-gray-600 hover:bg-white/50 hover:text-primary-500'
                }`}
                title={item.label}
              >
                <Icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5px]' : ''}`} />
              </Link>
            );
          })}
        </div>
      </aside>

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col lg:ml-20 min-h-screen">
        {/* 顶部导航栏 */}
        <header className="sticky top-0 z-30 bg-white/70 backdrop-blur-glass border-b border-rose-border shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* 移动端 Logo */}
              <div className="flex items-center space-x-3 lg:hidden">
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="p-2 rounded-xl text-gray-600 hover:bg-white/50 cursor-pointer"
                >
                  {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-pink-500 rounded-lg flex items-center justify-center shadow-md">
                    <Heart className="w-5 h-5 text-white" fill="currentColor" />
                  </div>
                  <h1 className="text-lg font-bold bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent">
                    Love Space
                  </h1>
                </div>
              </div>

              {/* 桌面端标题 */}
              <div className="hidden lg:block">
                <h2 className="text-xl font-bold text-gray-800 font-display">
                  {navItems.find(item => item.path === location.pathname)?.label || 'Love Space'}
                </h2>
              </div>
              
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
                      className="w-9 h-9 rounded-full border-2 border-primary-300 shadow-md cursor-pointer"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-pink-400 flex items-center justify-center shadow-md cursor-pointer">
                      <span className="text-white text-sm font-bold">{user.name[0]?.toUpperCase()}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* 移动端导航菜单 */}
        <div className={`lg:hidden fixed inset-0 z-50 transition-all duration-300 ${
          mobileMenuOpen 
            ? 'visible opacity-100' 
            : 'invisible opacity-0 pointer-events-none'
        }`}>
          {/* 遮罩层 */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          
          {/* 菜单面板 */}
          <div className={`absolute top-0 left-0 bottom-0 w-64 bg-white shadow-2xl transform transition-transform duration-300 ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}>
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-pink-500 rounded-xl flex items-center justify-center shadow-md">
                  <Heart className="w-6 h-6 text-white" fill="currentColor" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">Love Space</h3>
                  <p className="text-xs text-gray-500">
                    {user?.name} & {user?.partner?.name || 'TA'}
                  </p>
                </div>
              </div>
            </div>
            
            <nav className="p-4 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-r from-primary-100 to-pink-100 text-primary-600 shadow-md'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : ''}`} />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* 页面内容 */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>

        {/* 移动端底部导航栏 */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-glass border-t border-rose-border shadow-glass z-30 safe-area-bottom">
          <div className="flex justify-around items-center">
            {navItems.slice(0, 5).map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex flex-col items-center py-3 px-2 flex-1 transition-all duration-200 cursor-pointer ${
                    isActive 
                      ? 'text-primary-600' 
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
      </div>
    </div>
  );
}
