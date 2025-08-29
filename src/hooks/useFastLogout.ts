import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';
import { clearSessionData } from '@/lib/utils/session';

export const useFastLogout = () => {
  const router = useRouter();
  const { logout: authLogout } = useAuth();

  const fastLogout = useCallback(() => {
    clearSessionData();
    
    router.push('/login');
    
    setTimeout(() => {
      window.location.href = '/login';
    }, 50);
  }, [router]);

  const instantLogout = useCallback(() => {
    clearSessionData();
    
    window.location.href = '/login';
  }, []);

  return {
    fastLogout,
    instantLogout,
    logout: authLogout 
  };
};
