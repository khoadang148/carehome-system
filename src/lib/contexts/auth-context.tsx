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
import { optimizedLogout, instantLogout } from '@/lib/utils/fastLogout';

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

  
  const checkUserSession = useCallback(() => {
    
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

    checkUserSession();
  }, [checkUserSession]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      
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
          
          
          setUser(userObj);
          setLoading(false);
          
          
          Promise.all([
            initializeSession(response.access_token, userObj),
            preloadRolePages(router, userRole)
          ]).then(() => {
            redirectByRole(router, userRole);
          }).catch((error) => {
            
          });
          
          return userObj;
        }
      }
      return null;
    } catch (error) {
      
      setLoading(false);
      
      throw error;
    }
  }, [router]);

  const loginWithOtp = useCallback(async (phone: string, otp: string) => {
    try {
      
      const response = await authAPI.verifyOtp(phone, otp);
      
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
          
          
          setUser(userObj);
          setLoading(false);
          
          
          Promise.all([
            initializeSession(response.access_token, userObj),
            preloadRolePages(router, userRole)
          ]).then(() => {
            redirectByRole(router, userRole);
          }).catch((error) => {
            
          });
          
          return userObj;
        }
      }
      return null;
    } catch (error) {
            
      setLoading(false);
      
      throw error;
    }
  }, [router]);

  const logout = useCallback(() => {
    setIsLoggingOut(true);
    
    
    instantLogout(router);
    
    
    setUser(null);
    setIsLoggingOut(false);
    
    
    Promise.resolve(authAPI.logout()).catch(() => {
      console.warn('Logout API call failed, but user already logged out');
    });
  }, [router]);

  const refreshUser = useCallback(async () => {
    try {

      checkUserSession();
    } catch (error) {
      console.error('Refresh user error:', error);
    }
  }, [checkUserSession]);

  
  const contextValue = useMemo(() => ({
    user,
    login,
    loginWithOtp,
    logout,
    loading,
    isLoggingOut,
    refreshUser,
  }), [user, login, loginWithOtp, logout, loading, isLoggingOut, refreshUser]);

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
