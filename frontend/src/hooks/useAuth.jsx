import axios from 'axios';
import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

// API Configuration
// Use relative path - Cloudflare Pages will proxy to Worker via _redirects
const API_BASE = '/api';

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
    const response = await axios.post(`${API_BASE}/auth/init`, userData);
    if (response.data.success) {
      await fetchUser();
      return response.data;
    }
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
