"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/lib/api';
import { 
  clearSessionData, 
  isSessionValid, 
  initializeSession 
} from '@/lib/utils/session';
import { clientStorage } from '@/lib/utils/clientStorage';

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

  useEffect(() => {
    const checkUserSession = () => {
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
    };
    
    // Tối ưu: Kiểm tra session ngay lập tức thay vì setTimeout
    checkUserSession();
  }, [isLoggingOut]);

  const login = async (email: string, password: string) => {
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
          
          initializeSession(response.access_token, userObj);
          setUser(userObj);
          return userObj;
        } else {
          throw new Error('Chỉ tài khoản gia đình, nhân viên hoặc quản trị viên mới được đăng nhập!');
        }
      }
      return null;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    // Set logout flag to prevent unnecessary operations
    setIsLoggingOut(true);
    
    // Clear session data immediately
    clearSessionData();
    setUser(null);
    
    // Clear additional storage items
    clientStorage.setItem('has_logged_out', 'true');
    clientStorage.removeItem('login_success');
    clientStorage.removeItem('login_error');
    clientStorage.removeItem('login_attempts');
    
    // Redirect immediately
    router.push('/login');
    
    // Call logout API in background (don't block the redirect)
    setTimeout(() => {
      authAPI.logout().catch(error => {
        console.warn('Logout API call failed:', error);
      }).finally(() => {
        setIsLoggingOut(false);
      });
    }, 100);
  };

  const refreshUser = async () => {};

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, isLoggingOut, refreshUser }}>
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
