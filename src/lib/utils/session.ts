import { clientStorage } from './clientStorage';

export const SESSION_TIMEOUT = 2 * 60 * 60 * 1000;
export const WARNING_TIME = 10 * 60 * 1000;

export function clearSessionData() {
  if (typeof window !== 'undefined') {
    sessionStorage.clear();
  }
  
  // Sử dụng batch remove để tăng hiệu suất
  clientStorage.removeItems([
    'access_token',
    'user', 
    'session_start',
    'login_success',
    'login_error',
    'login_attempts'
  ]);
  
  if (typeof document !== 'undefined') {
    document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  }
}

export function isSessionValid(): boolean {
  const token = clientStorage.getItem('access_token');
  const user = clientStorage.getItem('user');
  const sessionStart = clientStorage.getItem('session_start');
  
  if (!token || !user || !sessionStart) {
    return false;
  }
  
  const startTime = parseInt(sessionStart);
  const currentTime = Date.now();
  const elapsed = currentTime - startTime;
  
  return elapsed < SESSION_TIMEOUT;
}

export function getRemainingSessionTime(): number {
  const sessionStart = clientStorage.getItem('session_start');
  if (!sessionStart) {
    return 0;
  }
  
  const startTime = parseInt(sessionStart);
  const currentTime = Date.now();
  const elapsed = currentTime - startTime;
  
  return Math.max(0, SESSION_TIMEOUT - elapsed);
}

export function extendSession() {
  const currentTime = Date.now().toString();
  clientStorage.setItem('session_start', currentTime);
}

export function initializeSession(token: string, userData: any) {
  const currentTime = Date.now().toString();
  
  // Tối ưu: Khởi tạo session ngay lập tức, không cần setTimeout
  if (typeof window !== 'undefined') {
    try {
      clientStorage.setItems({
        'access_token': token,
        'user': JSON.stringify(userData),
        'session_start': currentTime
      });
    } catch (error) {
      // console.error('Error initializing session:', error);
    }
  }
  
  return Promise.resolve();
} 