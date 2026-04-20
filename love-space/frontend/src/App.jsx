import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';

// 页面组件
import HomePage from './pages/HomePage';
import TimelinePage from './pages/TimelinePage';
import MessagesPage from './pages/MessagesPage';
import MoodsPage from './pages/MoodsPage';
import DailyPage from './pages/DailyPage';
import GalleryPage from './pages/GalleryPage';
import Layout from './components/Layout';
import InitPage from './pages/InitPage';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  // 如果是新用户，显示初始化页面
  if (user?.needs_init) {
    return <InitPage />;
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="timeline" element={<TimelinePage />} />
          <Route path="messages" element={<MessagesPage />} />
          <Route path="moods" element={<MoodsPage />} />
          <Route path="daily" element={<DailyPage />} />
          <Route path="gallery" element={<GalleryPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
