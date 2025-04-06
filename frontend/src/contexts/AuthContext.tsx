import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/router';
import { authApi } from '@/lib/api';

interface User {
  id: number;
  name: string;
  email: string;
  is_provider: boolean;
  is_admin: boolean;
}

interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  is_provider: boolean;
}

interface LoginData {
  username: string;
  password: string;
}

interface AuthResponse {
  token: string;
  user: User;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    is_provider: boolean;
  }) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await authApi.getCurrentUser();
      const userData = response.data as User;
      setUser(userData);
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      const response = await authApi.login({ email, password });
      const authData = response.data as AuthResponse;
      localStorage.setItem('token', authData.token);
      setUser(authData.user);
      router.push('/');
    } catch (error: any) {
      console.error('Login failed:', error);
      setError(error.response?.data?.detail || 'Login failed');
      throw error;
    }
  };

  const register = async (data: {
    name: string;
    email: string;
    password: string;
    is_provider: boolean;
  }) => {
    try {
      setError(null);
      const response = await authApi.register(data);
      const authData = response.data as AuthResponse;
      localStorage.setItem('token', authData.token);
      setUser(authData.user);
      await login(data.email, data.password);
    } catch (error: any) {
      console.error('Registration failed:', error);
      setError(error.response?.data?.detail || 'Registration failed');
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    router.push('/login');
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 