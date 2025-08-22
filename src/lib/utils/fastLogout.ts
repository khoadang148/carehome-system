import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { clearSessionData } from './session';

export const optimizedLogout = async (router: AppRouterInstance, logoutCallback?: () => Promise<void>) => {

  clearSessionData();

  router.push('/login');
  
  if (logoutCallback) {
    Promise.resolve(logoutCallback()).catch(() => {

      console.warn('Logout API call failed, but user already redirected');
    });
  }
};

export const instantLogout = (router: AppRouterInstance) => {
  // Clear session data ngay lập tức
  clearSessionData();
  
  // Redirect ngay lập tức
  router.push('/login');
  
  // Force reload để đảm bảo tất cả state được reset
  setTimeout(() => {
    window.location.href = '/login';
  }, 100);
}; 