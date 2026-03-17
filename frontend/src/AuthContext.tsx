import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, authApi } from './api';

interface AuthCtx {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  canAnalyze: boolean;
  remainingAnalyses: number;
  planName: string;
}

const AuthContext = createContext<AuthCtx>({} as AuthCtx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const r = await authApi.profile();
      setUser(r.data);
    } catch { }
  };

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      authApi.profile()
        .then(r => setUser(r.data))
        .catch(() => { localStorage.removeItem('access_token'); localStorage.removeItem('refresh_token'); })
        .finally(() => setLoading(false));
    } else { setLoading(false); }
  }, []);

  const login = async (username: string, password: string) => {
    const res = await authApi.login(username, password);
    localStorage.setItem('access_token',  res.data.access);
    localStorage.setItem('refresh_token', res.data.refresh);
    setUser(res.data.user);
  };

  const register = async (data: any) => {
    const res = await authApi.register(data);
    localStorage.setItem('access_token',  res.data.access);
    localStorage.setItem('refresh_token', res.data.refresh);
    setUser(res.data.user);
  };

  const logout = () => {
    const refresh = localStorage.getItem('refresh_token');
    if (refresh) authApi.logout(refresh).catch(() => {});
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
  };

  const profile = user?.profile;
  const canAnalyze = profile?.can_analyze ?? true;
  const remainingAnalyses = profile?.remaining_analyses ?? 3;
  const planName = profile?.plan?.name ?? 'free';
  const isAdmin = profile?.is_admin ?? false;

  return (
    <AuthContext.Provider value={{
      user, loading, login, register, logout, refreshUser,
      isAuthenticated: !!user,
      isAdmin, canAnalyze, remainingAnalyses, planName,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
