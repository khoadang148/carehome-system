import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { clearSessionData } from './session';

export const optimizedLogout = async (router: AppRouterInstance, logoutCallback?: () => Promise<void>) => {
  try {
    // Gọi logout API
    if (logoutCallback) {
      await logoutCallback();
    }
  } catch (error) {
    console.warn('Logout API call failed, but continuing with local logout:', error);
  }
  
  // Clear session data sau khi gọi API
  clearSessionData();
}; 