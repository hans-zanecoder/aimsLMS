'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authApi, ApiError } from '@/utils/api';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  isRedirecting: boolean;
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
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [authOperationInProgress, setAuthOperationInProgress] = useState(false);
  const router = useRouter();

  // Function to safely perform navigation
  const safeNavigate = async (url: string, maxAttempts = 3) => {
    console.log('Attempting safe navigation to:', url);
    setIsRedirecting(true);

    try {
      // Try Next.js router first
      try {
        router.push(url);
        // Wait a bit to see if the navigation was successful
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Check if we're still on the same page
        if (window.location.pathname === url) {
          console.log('Next.js navigation successful');
          return;
        }
      } catch (e) {
        console.warn('Next.js navigation failed, falling back to window.location:', e);
      }

      // Fallback to window.location
      let attempts = 0;
      while (attempts < maxAttempts) {
        try {
          window.location.href = url;
          // Wait to see if navigation starts
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // If we're still here, navigation might have failed
          if (window.location.pathname === url) {
            console.log('Window location navigation successful');
            return;
          }
          
          attempts++;
          console.warn(`Navigation attempt ${attempts} failed, retrying...`);
        } catch (e) {
          console.error('Navigation error:', e);
          attempts++;
        }
      }

      throw new Error('Navigation failed after multiple attempts');
    } catch (error) {
      console.error('Final navigation error:', error);
      throw error;
    } finally {
      setIsRedirecting(false);
    }
  };

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
      
      console.log('Attempting login for:', email);
      const { user } = await authApi.login(email, password);
      
      console.log('Login API call successful, setting user state...');
      setUser(user);
      
      console.log('Login successful, user role:', user.role);
      
      // Ensure the user state is set before redirecting
      await new Promise(resolve => setTimeout(resolve, 100));

      // Get the base URL without any query parameters
      const baseUrl = window.location.origin;
      console.log('Base URL:', baseUrl);

      // Determine the dashboard path based on role
      const dashboardPath = `/${user.role}/dashboard`;
      console.log('Dashboard path:', dashboardPath);

      // Construct the full URL
      const redirectUrl = `${baseUrl}${dashboardPath}`;
      console.log('Starting navigation to:', redirectUrl);

      // Attempt safe navigation
      await safeNavigate(dashboardPath);
    } catch (error) {
      console.error('Login error:', error);
      let errorMessage = 'Login failed. Please try again.';
      
      if (error instanceof ApiError) {
        errorMessage = error.message;
      } else if (error instanceof Error) {
        if (error.message.includes('Navigation failed')) {
          errorMessage = 'Failed to redirect after login. Please try refreshing the page.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
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
      console.log('Logging out...');
      
      // Call logout endpoint
      await authApi.logout().catch(error => {
        console.error('Logout API call failed:', error);
        // Continue with local logout even if API call fails
      });

      // Clear user state
      setUser(null);
      setError(null);

      // Attempt safe navigation to login page
      await safeNavigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Force navigation to login page if everything else fails
      window.location.href = '/login';
    } finally {
      setLoading(false);
      setAuthOperationInProgress(false);
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
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      error, 
      isRedirecting,
      login, 
      logout, 
      clearError, 
      updateProfile 
    }}>
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