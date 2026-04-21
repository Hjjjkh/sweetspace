import axios from 'axios';
import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

// API Configuration
// Direct Worker URL for production
const API_BASE = import.meta.env.PROD 
  ? 'https://sweetspace.248851185.workers.dev/api' 
  : '/api';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser();
  }, []);

  async function fetchUser() {
    try {
      const response = await axios.get(`${API_BASE}/auth/me`);
      if (response.data.success) {
        setUser(response.data.data);
      }
    } catch (error) {
      console.error('Fetch user error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function initializeUsers(userData) {
    console.log('调用 initializeUsers:', userData);
    const response = await axios.post(`${API_BASE}/auth/init`, userData);
    console.log('API 响应:', response.data);
    if (response.data.success) {
      console.log('注册成功，刷新用户状态...');
      await fetchUser();
      console.log('用户状态已刷新:', user);
      return response.data;
    }
    return response.data;
  }

  const value = {
    user,
    loading,
    initializeUsers,
    refetch: fetchUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

// Export configured axios instance
export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});
