
export const PUBLIC_ROUTES = [
  '/login',
  '/api/auth/login',
  '/api/auth/refresh',
  '/_next',
  '/favicon.ico',
  '/images',
  '/assets',
  '/public'
] as const;


export const PROTECTED_ROUTES = [
  '/family',
  '/staff',
  '/admin',
  '/profile',
  '/settings',
  '/activities',
  '/residents',
  '/reports',
  '/finance',
  '/inventory',
  '/services',
  '/notifications',
  '/ai-recommendations',
  '/compliance',
  '/permissions'
] as const;


export const DEFAULT_REDIRECTS = {
  ADMIN: '/admin',
  STAFF: '/staff',
  FAMILY: '/family',
  MANAGER: '/admin',
  NURSE: '/staff',
  DOCTOR: '/staff',
} as const;


export const AUTH_ROUTES = {
  LOGIN: '/login',
  LOGOUT: '/logout',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
} as const;


export const API_ROUTES = {
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    REFRESH: '/api/auth/refresh',
    VERIFY: '/api/auth/verify',
  },
  RESIDENTS: '/api/residents',
  STAFF: '/api/staff',
  ACTIVITIES: '/api/activities',
  VITAL_SIGNS: '/api/vital-signs',
  FINANCE: '/api/finance',
  INVENTORY: '/api/inventory',
} as const;


export const COOKIE_NAMES = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_ROLE: 'user_role',
  USER_ID: 'user_id',
} as const;


export const RouteUtils = {
  
  isPublicRoute: (pathname: string): boolean => {
    return PUBLIC_ROUTES.some(route => pathname.startsWith(route));
  },

  
  isProtectedRoute: (pathname: string): boolean => {
    return PROTECTED_ROUTES.some(route => pathname.startsWith(route));
  },

  
  needsAuth: (pathname: string): boolean => {
    return RouteUtils.isProtectedRoute(pathname) && !RouteUtils.isPublicRoute(pathname);
  },

  
  getDefaultRedirect: (role?: string): string => {
    if (!role) return DEFAULT_REDIRECTS.FAMILY;
    return DEFAULT_REDIRECTS[role as keyof typeof DEFAULT_REDIRECTS] || DEFAULT_REDIRECTS.FAMILY;
  },

  
  isLoginPage: (pathname: string): boolean => {
    return pathname === AUTH_ROUTES.LOGIN;
  },


  isHomePage: (pathname: string): boolean => {
    return pathname === '/';
  },

  
  buildLoginUrl: (baseUrl: string, returnPath?: string): string => {
    const loginUrl = new URL(AUTH_ROUTES.LOGIN, baseUrl);
    if (returnPath) {
      loginUrl.searchParams.set('returnUrl', returnPath);
    }
    return loginUrl.toString();
  },

    
  buildRedirectUrl: (baseUrl: string, path: string): string => {
    return new URL(path, baseUrl).toString();
  }
}; 