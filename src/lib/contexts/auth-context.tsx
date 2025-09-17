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
import { isTokenValid } from '@/lib/utils/tokenUtils';
import { redirectByRole, preloadRolePages, navigateToLogin } from '@/lib/utils/navigation';
import { optimizedLogout, instantLogout } from '@/lib/utils/fastLogout';
import { fastLogin } from '@/lib/utils/fastLogin';
import { loadingOptimizer } from '@/lib/utils/loadingOptimizer';

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
    
    if (!isSessionValid() || !isTokenValid()) {
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
      // Fallback: nếu token hợp lệ mà chưa có user trong storage, lấy thông tin từ server
      try {
        if (isTokenValid()) {
          authAPI.me()
            .then((profile) => {
              if (!profile) return;
              const userRole = profile.role;
              if (userRole === 'family' || userRole === 'staff' || userRole === 'admin') {
                const userObj = {
                  id: profile.id || profile._id,
                  name: profile.full_name || profile.fullName || profile.username || profile.email,
                  email: profile.email,
                  role: userRole,
                } as any;
                try { clientStorage.setItem('user', JSON.stringify(userObj)); } catch {}
                setUser(userObj);
              } else {
                setUser(null);
              }
            })
            .catch(() => {
              setUser(null);
            });
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      }
    }
    setLoading(false);
  }, [isLoggingOut]);

  useEffect(() => {
    checkUserSession();
  }, [checkUserSession]);

  const login = useCallback(async (email: string, password: string) => {
    return loadingOptimizer.fastLoading(async () => {
      const response = await authAPI.login(email, password);
      
      // Kiểm tra nếu backend trả về success: false (tài khoản chưa kích hoạt hoặc bị khóa)
      if (response.success === false) {
        if (response.message?.includes('chưa được kích hoạt') || response.message?.includes('pending')) {
          // Delay một chút để user có thể đọc thông báo trước khi redirect
          setTimeout(() => {
            router.replace(`/pending-approval?email=${encodeURIComponent(email)}`);
          }, 3000);
          
          // Throw error với message cụ thể để hiển thị trên modal
          throw new Error('Tài khoản của bạn đang chờ phê duyệt từ quản trị viên. Vui lòng liên hệ admin để được kích hoạt tài khoản.');
        } else {
          // Các lỗi khác (tài khoản bị khóa, etc.)
          throw new Error(response.message || 'Tài khoản không thể đăng nhập');
        }
      }
      
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
          
          // Nếu tài khoản chưa được kích hoạt -> throw error để hiển thị thông báo
          if (userProfile.status && String(userProfile.status).toLowerCase() === 'pending') {
            // Delay một chút để user có thể đọc thông báo trước khi redirect
            setTimeout(() => {
              router.replace(`/pending-approval?email=${encodeURIComponent(userProfile.email || '')}`);
            }, 3000);
            
            // Throw error với message cụ thể để hiển thị trên modal
            throw new Error('Tài khoản của bạn đang chờ phê duyệt từ quản trị viên. Vui lòng liên hệ admin để được kích hoạt tài khoản.');
          }

          setUser(userObj);

          // Sử dụng fastLogin để tối ưu hóa
          fastLogin.handleLogin(router, response.access_token, userObj, userRole);
          
          return userObj;
        }
      }
      return null;
    }, setLoading);
  }, [router]);

  const loginWithOtp = useCallback(async (phone: string, otp: string) => {
    return loadingOptimizer.fastLoading(async () => {
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
          
          // Sử dụng fastLogin để tối ưu hóa
          fastLogin.handleLogin(router, response.access_token, userObj, userRole);
          
          return userObj;
        }
      }
      return null;
    }, setLoading);
  }, [router]);

  const logout = useCallback(() => {
    setIsLoggingOut(true);
    instantLogout(router);
    setUser(null);
    setIsLoggingOut(false);
    
    Promise.resolve(authAPI.logout()).catch(() => {
    });
  }, [router]);

  const refreshUser = useCallback(async () => {
    try {
      checkUserSession();
    } catch (error) {
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
