"use client";

import { useEffect } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';
import { useRouter, usePathname } from 'next/navigation';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  useEffect(() => {
    if (!loading) {
      if (!user) {
        if (pathname !== '/login') {
          router.push('/login');
        }
      } else {
        if (user.role === 'family') {
          router.push('/family');
        } else if (user.role === 'admin') {
          router.push('/admin');
        } else if (user.role === 'staff') {
          router.push('/staff');
        } else {
          router.push('/login');
        }
      }
    }
  }, [user, router, pathname]);
  
  
  
  return null;
}
