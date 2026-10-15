import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { authApi } from '../services/api';
import type { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; full_name?: string; role?: UserRole }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const mockUser: User = {
  id: 0,
  email: 'contractor@geotrace.local',
  full_name: 'Field Contractor',
  role: 'contractor' as UserRole,
  is_active: true,
  last_login: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(mockUser);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const response = await authApi.me();
        setUser(response.data);
      } catch {
        localStorage.removeItem('access_token');
        setUser(mockUser);
      }
    } else {
      // Auto-login with contractor credentials for demo
      try {
        const response = await authApi.login('contractor@geotrace.local', 'password123');
        const { access_token } = response.data;
        localStorage.setItem('access_token', access_token);
        const userResponse = await authApi.me();
        setUser(userResponse.data);
      } catch {
        setUser(mockUser);
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (email: string, password: string) => {
    const response = await authApi.login(email, password);
    const { access_token } = response.data;
    localStorage.setItem('access_token', access_token);
    const userResponse = await authApi.me();
    setUser(userResponse.data);
  };

  const register = async (data: { email: string; password: string; full_name?: string; role?: UserRole }) => {
    await authApi.register(data);
    await login(data.email, data.password);
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    setUser(mockUser);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};