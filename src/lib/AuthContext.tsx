/**
 * Smart AI Travel Planner 3.0
 * Authentication React Context & Provider
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthContextType } from '../types/auth';
import { loginUser, registerUser, fetchCurrentUser, logoutUser, getStoredAuthToken } from './api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('aetheris_user_v3');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return null;
  });

  const [token, setToken] = useState<string | null>(() => getStoredAuthToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Validate session with server on initial boot
  useEffect(() => {
    let isMounted = true;
    const verifySession = async () => {
      const storedToken = getStoredAuthToken();
      if (!storedToken) {
        if (isMounted) {
          setUser(null);
          setIsLoading(false);
        }
        return;
      }

      try {
        const currentUser = await fetchCurrentUser();
        if (isMounted) {
          if (currentUser) {
            setUser(currentUser);
            localStorage.setItem('aetheris_user_v3', JSON.stringify(currentUser));
          } else {
            setUser(null);
            localStorage.removeItem('aetheris_user_v3');
          }
        }
      } catch (err) {
        console.warn('[Auth] Session validation failed:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    verifySession();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await loginUser(email, password);
      if (res.success && res.user && res.token) {
        setUser(res.user);
        setToken(res.token);
        localStorage.setItem('aetheris_user_v3', JSON.stringify(res.user));
        return { success: true };
      }
      return { success: false, error: res.error || 'Invalid credentials' };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await registerUser(name, email, password);
      if (res.success && res.user && res.token) {
        setUser(res.user);
        setToken(res.token);
        localStorage.setItem('aetheris_user_v3', JSON.stringify(res.user));
        return { success: true };
      }
      return { success: false, error: res.error || 'Registration failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await logoutUser();
      setUser(null);
      setToken(null);
      localStorage.removeItem('aetheris_user_v3');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
