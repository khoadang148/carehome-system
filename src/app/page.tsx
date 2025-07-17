"use client";

import { useEffect } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Nếu chưa đăng nhập, redirect đến trang đăng nhập
        router.replace('/login');
      } else {
        // Nếu đã đăng nhập, redirect dựa trên role
        if (user.role === 'family') {
          router.replace('/family');
        } else if (user.role === 'admin') {
          router.replace('/admin');
        } else if (user.role === 'staff') {
          router.replace('/staff');
        } else {
          // Fallback cho các role khác
          router.replace('/login');
        }
      }
    }
  }, [user, loading, router]);
  
  // Hiển thị loading hoặc null trong khi redirect
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }
  
  return null;
}
