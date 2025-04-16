import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { authApi } from '@/lib/api';

interface User {
  user_id: number;
  email: string;
  role: 'customer' | 'provider' | 'admin';
  first_name: string;
  last_name: string;
  created_at: string;
  last_login: string | null;
  is_active: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    role: 'customer' | 'provider' | 'admin';
    first_name: string;
    last_name: string;
  }) => Promise<void>;
  redirectToLogin: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (token && storedUser) {
      try {
        authApi.setAuthToken(token);
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser as User);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        authApi.setAuthToken(null);
      }
    }
    setLoading(false);
  }, []);

  const redirectToLogin = () => {
    router.push('/auth/login');
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login({ email, password });
      
      // Store the token
      const token = response.access_token;
      localStorage.setItem('token', token);
      
      // Update axios instance with the new token
      authApi.setAuthToken(token);
      
      // Fetch user details using the token
      const userResponse = await authApi.getCurrentUser();
      setUser(userResponse as User);
      localStorage.setItem('user', JSON.stringify(userResponse));
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
      setUser(null);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      authApi.setAuthToken(null);
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, clear local state and redirect
      setUser(null);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      authApi.setAuthToken(null);
      router.push('/');
      throw error;
    }
  };

  const register = async (data: {
    email: string;
    password: string;
    role: 'customer' | 'provider' | 'admin';
    first_name: string;
    last_name: string;
  }) => {
    try {
      const response = await authApi.register(data);
      setUser(response);
      localStorage.setItem('user', JSON.stringify(response));
      router.push('/auth/login');
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register, redirectToLogin }}>
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