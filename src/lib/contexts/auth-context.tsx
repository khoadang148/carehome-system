"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { authAPI } from '@/lib/api';
import { 
  clearSessionData, 
  isSessionValid, 
  initializeSession, 
  SESSION_TIMEOUT 
} from '@/lib/utils/session';

// Define user role type
export type UserRole = 'admin' | 'staff' | 'family';

// Define user interface
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

// Define auth context interface
interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

// Create auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Check for stored user data and token on initial load
  useEffect(() => {
    const checkUserSession = () => {
      // Kiểm tra session validity
      if (!isSessionValid()) {
        clearSessionData();
        setUser(null);
        setLoading(false);
        return;
      }

      // Lấy user data từ sessionStorage
      const storedUser = sessionStorage.getItem('user');
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
    checkUserSession();
  }, []);

  // Login function: only allow family role
  const login = async (email: string, password: string) => {
    try {
      const response = await authAPI.login(email, password);
      console.log('API login response:', response); // Thêm log để kiểm tra dữ liệu trả về
      if (response.access_token) {
        const userProfile = response.user;
        const userRole = userProfile.role;
        // Cho phép family, staff, admin
        if (userRole === 'family' || userRole === 'staff' || userRole === 'admin') {
          const userObj = {
            id: userProfile.id,
            name: userProfile.fullName || userProfile.username || userProfile.email,
            email: userProfile.email,
            role: userRole,
          };
          
          // Initialize session with new data
          initializeSession(response.access_token, userObj);
          
          // Set user state ngay lập tức
          setUser(userObj);
          
          // Không redirect ở đây nữa!
          return true;
        } else {
          throw new Error('Chỉ tài khoản gia đình, nhân viên hoặc quản trị viên mới được đăng nhập!');
        }
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    clearSessionData();
    setUser(null);
    router.push('/login');
  };

  // Dummy refreshUser for compatibility
  const refreshUser = async () => {};

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, refreshUser }}>
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

// No useRequireAuth here, each role should have its own login page/component 
