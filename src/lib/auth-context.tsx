"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';

// Define user roles
export type UserRole = 'staff' | 'family' | 'admin' | null;

// Define user interface
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

// Define auth context interface
interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

// Create auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for demonstration
const MOCK_USERS = [
  { id: '1', name: 'Quản trị viên', email: 'admin@example.com', password: 'admin', role: 'admin' },
  { id: '2', name: 'Nhân viên', email: 'staff@example.com', password: 'staff', role: 'staff' },
  { id: '3', name: 'Thành viên gia đình', email: 'family@example.com', password: 'family', role: 'family' },
];

// Create auth provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Check for stored user data on initial load
  useEffect(() => {
    const checkUserSession = () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          setUser(userData);
        } catch (e) {
          localStorage.removeItem('user');
        }
      }
      setLoading(false);
    };
    
    // Run check immediately
    checkUserSession();
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    try {
      // In a real app, this would be an API call
      const foundUser = MOCK_USERS.find(
        (u) => u.email === email && u.password === password
      );

      if (foundUser) {
        const { password, ...userWithoutPassword } = foundUser;
        
        // Update state and localStorage synchronously
        localStorage.setItem('user', JSON.stringify(userWithoutPassword));
        setUser(userWithoutPassword as User);
        
        // Redirect based on role - do this immediately
        if (userWithoutPassword.role === 'family') {
          router.push('/family');
        } else {
          router.push('/');
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Hook to protect routes based on required roles
export function useRequireAuth(allowedRoles?: UserRole[]) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Only run the effect if loading is complete
    if (!loading) {
      // If no user is logged in, redirect to login
      if (!user) {
        const url = `/login?returnUrl=${encodeURIComponent(pathname)}`;
        router.replace(url); // Use replace instead of push for faster navigation
        return;
      }
      
      // If roles are specified and user's role is not allowed
      if (allowedRoles && !allowedRoles.includes(user.role)) {
        // Redirect based on role immediately
        if (user.role === 'family') {
          router.replace('/family');
        } else {
          router.replace('/');
        }
      }
    }
  }, [user, loading, router, pathname, allowedRoles]);

  return { user, loading };
} 
