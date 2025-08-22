import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';
import { clearSessionData } from '@/lib/utils/session';

export const useFastLogout = () => {
  const router = useRouter();
  const { logout: authLogout } = useAuth();

  const fastLogout = useCallback(() => {
    // Clear session data ngay lập tức
    clearSessionData();
    
    // Redirect ngay lập tức
    router.push('/login');
    
    // Force reload sau 50ms để đảm bảo tất cả state được reset
    setTimeout(() => {
      window.location.href = '/login';
    }, 50);
  }, [router]);

  const instantLogout = useCallback(() => {
    // Clear session data ngay lập tức
    clearSessionData();
    
    // Redirect ngay lập tức không chờ gì cả
    window.location.href = '/login';
  }, []);

  return {
    fastLogout,
    instantLogout,
    logout: authLogout // Giữ lại logout gốc nếu cần
  };
};
