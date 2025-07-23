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
  
  // Clear cookies
  document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
}

/**
 * Check if session is valid
 */
export function isSessionValid(): boolean {
  const token = sessionStorage.getItem('access_token');
  const user = sessionStorage.getItem('user');
  const sessionStart = sessionStorage.getItem('session_start');
  
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
  const sessionStart = sessionStorage.getItem('session_start');
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
  sessionStorage.setItem('session_start', Date.now().toString());
}

/**
 * Initialize session with token and user data
 */
export function initializeSession(token: string, userData: any) {
  sessionStorage.setItem('access_token', token);
  sessionStorage.setItem('user', JSON.stringify(userData));
  sessionStorage.setItem('session_start', Date.now().toString());
  
  // Set cookie with expiration matching session timeout (2 hours)
  document.cookie = `access_token=${token}; path=/; max-age=7200; SameSite=Strict`;
} 