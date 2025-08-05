import { clientStorage } from './clientStorage';

export const SESSION_TIMEOUT = 2 * 60 * 60 * 1000;
export const WARNING_TIME = 10 * 60 * 1000;

export function clearSessionData() {
  if (typeof window !== 'undefined') {
    sessionStorage.clear();
  }
  
  clientStorage.removeItem('access_token');
  clientStorage.removeItem('user');
  clientStorage.removeItem('session_start');
  clientStorage.removeItem('login_success');
  clientStorage.removeItem('login_error');
  clientStorage.removeItem('login_attempts');
  
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
  
  // Sử dụng Promise.all để lưu đồng thời tất cả dữ liệu
  const storageOperations = [
    clientStorage.setItem('access_token', token),
    clientStorage.setItem('user', JSON.stringify(userData)),
    clientStorage.setItem('session_start', currentTime)
  ];
  
  // Thực hiện tất cả operations đồng thời
  Promise.all(storageOperations).catch(error => {
    console.error('Error initializing session:', error);
  });
} 