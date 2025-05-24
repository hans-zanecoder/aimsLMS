'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authApi, ApiError } from '@/utils/api';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authOperationInProgress, setAuthOperationInProgress] = useState(false);
  const router = useRouter();

  // Token refresh timer
  const setupTokenRefresh = useCallback(() => {
    // Refresh token every 23 hours to be safe (token lives for 24 hours)
    const refreshInterval = 23 * 60 * 60 * 1000;
    const intervalId = setInterval(async () => {
      try {
        if (user) {
          console.log('Refreshing auth token...');
          await authApi.refreshToken();
        }
      } catch (error) {
        console.error('Token refresh failed:', error);
        // If token refresh fails, user should re-login
        await logout();
      }
    }, refreshInterval);

    return () => clearInterval(intervalId);
  }, [user]);

  const checkUser = useCallback(async () => {
    if (authOperationInProgress) return;
    
    try {
      setAuthOperationInProgress(true);
      setLoading(true);
      const userData = await authApi.me();
      setUser(userData);
      return userData;
    } catch (error) {
      console.error('Error checking user session:', error);
      // Don't set an error here as this is a normal state during initial load
      setUser(null);
      return null;
    } finally {
      setLoading(false);
      setAuthOperationInProgress(false);
    }
  }, []);

  useEffect(() => {
    checkUser();
  }, [checkUser]);

  useEffect(() => {
    const cleanupFn = setupTokenRefresh();
    return cleanupFn;
  }, [setupTokenRefresh]);

  const login = async (email: string, password: string) => {
    if (authOperationInProgress) {
      throw new Error('Authentication operation already in progress');
    }
    
    try {
      setAuthOperationInProgress(true);
      setLoading(true);
      setError(null);
      
      const { user } = await authApi.login(email, password);
      setUser(user);
      
      console.log('Login successful, user role:', user.role);
      
      // Ensure the user state is set before redirecting
      await new Promise(resolve => setTimeout(resolve, 100));

      // Redirect based on role
      const isDevelopment = process.env.NODE_ENV === 'development';
      const basePath = window.location.origin;
      
      switch (user.role) {
        case 'admin':
          console.log('Redirecting to admin dashboard...');
          if (isDevelopment) {
            router.push('/admin/dashboard');
          } else {
            window.location.href = `${basePath}/admin/dashboard`;
          }
          break;
        case 'instructor':
          console.log('Redirecting to instructor dashboard...');
          if (isDevelopment) {
            router.push('/instructor/dashboard');
          } else {
            window.location.href = `${basePath}/instructor/dashboard`;
          }
          break;
        case 'student':
          console.log('Redirecting to student dashboard...');
          if (isDevelopment) {
            router.push('/student/dashboard');
          } else {
            window.location.href = `${basePath}/student/dashboard`;
          }
          break;
        default:
          console.log('Unknown role, redirecting to login...');
          if (isDevelopment) {
            router.push('/login');
          } else {
            window.location.href = `${basePath}/login`;
          }
      }
    } catch (error) {
      console.error('Login error:', error);
      if (error instanceof ApiError) {
        setError(error.message);
      } else {
        setError(error instanceof Error ? error.message : 'Login failed. Please try again.');
      }
      throw error;
    } finally {
      setLoading(false);
      setAuthOperationInProgress(false);
    }
  };

  const logout = async () => {
    if (authOperationInProgress) {
      throw new Error('Authentication operation already in progress');
    }
    
    try {
      setAuthOperationInProgress(true);
      setLoading(true);
      // Call logout endpoint
      await authApi.logout().catch(console.error); // Don't throw if the request fails
    } finally {
      // Always clear the local state, even if the request fails
      setUser(null);
      setError(null);
      setLoading(false);
      setAuthOperationInProgress(false);
      router.push('/login');
    }
  };

  const clearError = () => setError(null);

  const updateProfile = async (data: Partial<User>) => {
    if (authOperationInProgress) {
      throw new Error('Authentication operation already in progress');
    }
    
    try {
      setAuthOperationInProgress(true);
      setLoading(true);
      setError(null);
      
      const updatedUser = await authApi.updateProfile(data);
      setUser(updatedUser);
    } catch (error) {
      console.error('Profile update error:', error);
      if (error instanceof ApiError) {
        setError(error.message);
      } else {
        setError(error instanceof Error ? error.message : 'Failed to update profile. Please try again.');
      }
      throw error;
    } finally {
      setLoading(false);
      setAuthOperationInProgress(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout, clearError, updateProfile }}>
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