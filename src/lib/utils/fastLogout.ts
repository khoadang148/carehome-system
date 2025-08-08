/**
 * Fast logout utility for immediate session clearing
 * This function optimizes the logout process for better performance
 */

export const fastLogout = () => {
  // Clear user state immediately
  if (typeof window !== 'undefined') {
    // Clear all storage in one operation
    localStorage.clear();
    sessionStorage.clear();
    
    // Clear cookies
    document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    
    // Clear any remaining cookies
    const cookies = document.cookie.split(';');
    cookies.forEach(cookie => {
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    });
  }
};

/**
 * Optimized logout with immediate redirect
 */
export const optimizedLogout = (router: any, logoutAPI?: () => Promise<any>) => {
  // Clear storage immediately
  fastLogout();
  
  // Redirect immediately
  router.push('/login');
  
  // Call API in background if provided
  if (logoutAPI) {
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => {
        logoutAPI().catch(() => {
          // Silently fail - user is already logged out locally
        });
      });
    } else {
      setTimeout(() => {
        logoutAPI().catch(() => {
          // Silently fail - user is already logged out locally
        });
      }, 10);
    }
  }
}; 