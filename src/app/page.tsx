"use client";

import { useEffect } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';
import { useRouter } from 'next/navigation';
import RoleDashboard from '@/components/RoleDashboard';

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (!user) {
      router.push('/login');
    } else if (user.role === 'family') {
      router.push('/family');
    }
  }, [user, router]);
  
  if (!user || user.role === 'family') {
    return null;
  }
  
  return <RoleDashboard />;
}
