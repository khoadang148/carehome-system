"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/lib/api';
import { 
  initializeSession, 
  clearSessionData, 
  isSessionValid
} from '@/lib/utils/session';
import { clientStorage } from '@/lib/utils/clientStorage';
import { redirectByRole, preloadRolePages, navigateToLogin } from '@/lib/utils/navigation';
import { optimizedLogout } from '@/lib/utils/fastLogout';

export type UserRole = 'admin' | 'staff' | 'family';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  department?: string;
  position?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<User | null>;
  logout: () => void;
  loading: boolean;
  isLoggingOut: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();

  // Memoize session check function
  const checkUserSession = useCallback(() => {
    // Skip session check if logging out
    if (isLoggingOut) {
      return;
    }
    
    if (!isSessionValid()) {
      clearSessionData();
      setUser(null);
      setLoading(false);
      return;
    }

    const storedUser = clientStorage.getItem('user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
      } catch (e) {
        clearSessionData();
        setUser(null);
      }
    } else {
      setUser(null);
    }
    setLoading(false);
  }, [isLoggingOut]);

  useEffect(() => {
    // Immediate session check for faster loading
    checkUserSession();
  }, [checkUserSession]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      // Gọi API login
      const response = await authAPI.login(email, password);
      
      if (response.access_token) {
        const userProfile = response.user;
        const userRole = userProfile.role;
        
        if (userRole === 'family' || userRole === 'staff' || userRole === 'admin') {
          const userObj = {
            id: userProfile.id,
            name: userProfile.full_name || userProfile.fullName || userProfile.username || userProfile.email,
            email: userProfile.email,
            role: userRole,
          };
          
          // Xử lý song song: session init và set user state
          const sessionPromise = initializeSession(response.access_token, userObj);
          setUser(userObj);
          setLoading(false);
          
          // Preload pages based on role
          preloadRolePages(router, userRole);
          
          // Redirect based on role
          await sessionPromise;
          redirectByRole(router, userRole);
          
          return userObj;
        }
      }
      return null;
    } catch (error) {
      console.error('Login error:', error);
      setLoading(false);
      return null;
    }
  }, [router]);

  const logout = useCallback(() => {
    setIsLoggingOut(true);
    optimizedLogout(router, async () => {
      await authAPI.logout();
    }).then(() => {
      setUser(null);
      setIsLoggingOut(false);
      navigateToLogin(router);
    });
  }, [router]);

  const refreshUser = useCallback(async () => {
    try {
      // Implement user refresh logic here if needed
      checkUserSession();
    } catch (error) {
      console.error('Refresh user error:', error);
    }
  }, [checkUserSession]);

  // Memoize context value để tránh re-render không cần thiết
  const contextValue = useMemo(() => ({
    user,
    login,
    logout,
    loading,
    isLoggingOut,
    refreshUser,
  }), [user, login, logout, loading, isLoggingOut, refreshUser]);

  return (
    <AuthContext.Provider value={contextValue}>
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
