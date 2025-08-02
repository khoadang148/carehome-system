// Session timeout in milliseconds (2 hours)
export const SESSION_TIMEOUT = 2 * 60 * 60 * 1000;

// Warning time before session expires (10 minutes)
export const WARNING_TIME = 10 * 60 * 1000;

/**
 * Clear all session data
 */
export function clearSessionData() {
  // Clear sessionStorage
  sessionStorage.clear();
  
  // Clear localStorage (in case there's any old data)
  localStorage.removeItem('access_token');
  localStorage.removeItem('user');
  localStorage.removeItem('session_start');
  
  // Clear login-related data
  localStorage.removeItem('login_success');
  localStorage.removeItem('login_error');
  localStorage.removeItem('login_attempts');
  
  // Clear cookies
  document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
}

/**
 * Check if session is valid
 */
export function isSessionValid(): boolean {
  // Chỉ sử dụng localStorage để nhất quán với interceptor
  const token = localStorage.getItem('access_token');
  const user = localStorage.getItem('user');
  const sessionStart = localStorage.getItem('session_start');
  
  if (!token || !user || !sessionStart) {
    return false;
  }
  
  const startTime = parseInt(sessionStart);
  const currentTime = Date.now();
  const elapsed = currentTime - startTime;
  
  return elapsed < SESSION_TIMEOUT;
}

/**
 * Get remaining session time in milliseconds
 */
export function getRemainingSessionTime(): number {
  // Chỉ sử dụng localStorage để nhất quán
  const sessionStart = localStorage.getItem('session_start');
  if (!sessionStart) {
    return 0;
  }
  
  const startTime = parseInt(sessionStart);
  const currentTime = Date.now();
  const elapsed = currentTime - startTime;
  
  return Math.max(0, SESSION_TIMEOUT - elapsed);
}

/**
 * Extend session by updating session start time
 */
export function extendSession() {
  const currentTime = Date.now().toString();
  // Chỉ cập nhật localStorage để nhất quán
  localStorage.setItem('session_start', currentTime);
}

/**
 * Initialize session with token and user data
 */
export function initializeSession(token: string, userData: any) {
  const currentTime = Date.now().toString();
  
  // Chỉ lưu vào localStorage để nhất quán với interceptor
  localStorage.setItem('access_token', token);
  localStorage.setItem('user', JSON.stringify(userData));
  localStorage.setItem('session_start', currentTime);
} 