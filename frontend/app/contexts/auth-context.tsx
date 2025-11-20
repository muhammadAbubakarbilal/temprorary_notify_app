'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiRequest } from '@/app/lib/api-client';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  name: string;
  subscriptionPlan: string;
  subscriptionStatus: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refreshUser = async () => {
    try {
      const userData = await apiRequest('/api/auth/me');
      setUser(userData);
    } catch (error) {
      setUser(null);
    }
  };

  useEffect(() => {
    // Check if user is logged in on mount
    refreshUser().finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const response = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setUser(response.user);
    router.push('/dashboard');
  };

  const logout = async () => {
    try {
      await apiRequest('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      // Ignore errors on logout
    }
    setUser(null);
    router.push('/');
  };

  const register = async (email: string, password: string, name: string) => {
    const response = await apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
    setUser(response.user);
    router.push('/dashboard');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
