'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '@/app/lib/api-client';
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
      const userData = await api.get<{ user: User }>('/api/auth/me');
      if (userData?.user) {
        setUser(userData.user);
      }
    } catch (error) {
      setUser(null);
    }
  };

  useEffect(() => {
    // Check if user is logged in on mount
    refreshUser().finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api.post<{ user: User }>('/api/auth/login', { email, password });
    if (response?.user) {
      setUser(response.user);
      router.push('/dashboard');
    }
  };

  const logout = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch (error) {
      // Ignore errors on logout
    }
    setUser(null);
    router.push('/');
  };

  const register = async (email: string, password: string, name: string) => {
    const response = await api.post<{ user: User }>('/api/auth/register', { email, password, name });
    if (response?.user) {
      setUser(response.user);
      router.push('/dashboard');
    }
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
