import { NextRequest, NextResponse } from 'next/server';
import { 
  RouteUtils, 
  AUTH_ROUTES, 
  COOKIE_NAMES, 
  DEFAULT_REDIRECTS 
} from '@/lib/constants/routes';

// Types for authentication
export interface AuthToken {
  value: string;
  expires?: Date;
}

export interface UserSession {
  token?: string;
  role?: string;
  userId?: string;
  isAuthenticated: boolean;
}

export interface AuthRedirectResult {
  shouldRedirect: boolean;
  redirectUrl?: string;
  response?: NextResponse;
}

// Authentication utilities
export class AuthUtils {
  
  /**
   * Extract token from request cookies
   */
  static getTokenFromRequest(request: NextRequest): string | undefined {
    return request.cookies.get(COOKIE_NAMES.ACCESS_TOKEN)?.value;
  }

  /**
   * Extract user role from request cookies
   */
  static getUserRoleFromRequest(request: NextRequest): string | undefined {
    return request.cookies.get(COOKIE_NAMES.USER_ROLE)?.value;
  }

  /**
   * Extract user ID from request cookies
   */
  static getUserIdFromRequest(request: NextRequest): string | undefined {
    return request.cookies.get(COOKIE_NAMES.USER_ID)?.value;
  }

  /**
   * Get complete user session from request
   */
  static getSessionFromRequest(request: NextRequest): UserSession {
    const token = this.getTokenFromRequest(request);
    const role = this.getUserRoleFromRequest(request);
    const userId = this.getUserIdFromRequest(request);

    return {
      token,
      role,
      userId,
      isAuthenticated: Boolean(token)
    };
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(request: NextRequest): boolean {
    return Boolean(this.getTokenFromRequest(request));
  }

  /**
   * Validate token format (basic validation)
   */
  static isValidTokenFormat(token: string): boolean {
    // Basic token validation - can be enhanced based on token format
    return Boolean(token && token.length > 10 && typeof token === 'string');
  }

  /**
   * Check if token is expired (if token contains expiry info)
   */
  static isTokenExpired(token: string): boolean {
    try {
      // This is a placeholder - implement based on your token format
      // For JWT tokens, you would decode and check exp claim
      // For now, assuming token is valid if it exists
      return false;
    } catch (error) {
      return true;
    }
  }

  /**
   * Get appropriate redirect URL based on user role
   */
  static getDefaultRedirectForRole(role?: string): string {
    return RouteUtils.getDefaultRedirect(role);
  }

  /**
   * Create redirect response
   */
  static createRedirectResponse(request: NextRequest, path: string): NextResponse {
    const redirectUrl = RouteUtils.buildRedirectUrl(request.url, path);
    return NextResponse.redirect(redirectUrl);
  }

  /**
   * Create login redirect with return URL
   */
  static createLoginRedirect(request: NextRequest, returnPath?: string): NextResponse {
    const loginUrl = RouteUtils.buildLoginUrl(request.url, returnPath);
    return NextResponse.redirect(loginUrl);
  }

  /**
   * Handle login page logic
   */
  static handleLoginPage(request: NextRequest): AuthRedirectResult {
    const session = this.getSessionFromRequest(request);
    
    if (session.isAuthenticated && this.isValidTokenFormat(session.token!)) {
      // User is already authenticated, redirect to appropriate dashboard
      const redirectPath = this.getDefaultRedirectForRole(session.role);
      return {
        shouldRedirect: true,
        redirectUrl: redirectPath,
        response: this.createRedirectResponse(request, redirectPath)
      };
    }

    // User not authenticated, allow access to login page
    return { shouldRedirect: false };
  }

  /**
   * Handle home page logic
   */
  static handleHomePage(request: NextRequest): AuthRedirectResult {
    const session = this.getSessionFromRequest(request);
    
    if (session.isAuthenticated && this.isValidTokenFormat(session.token!)) {
      // User is authenticated, redirect to dashboard
      const redirectPath = this.getDefaultRedirectForRole(session.role);
      return {
        shouldRedirect: true,
        redirectUrl: redirectPath,
        response: this.createRedirectResponse(request, redirectPath)
      };
    }

    // User not authenticated, redirect to login
    return {
      shouldRedirect: true,
      redirectUrl: AUTH_ROUTES.LOGIN,
      response: this.createLoginRedirect(request)
    };
  }

  /**
   * Handle protected route access
   */
  static handleProtectedRoute(request: NextRequest): AuthRedirectResult {
    const session = this.getSessionFromRequest(request);
    const { pathname } = request.nextUrl;
    
    if (!session.isAuthenticated) {
      // No token, redirect to login with return URL
      return {
        shouldRedirect: true,
        redirectUrl: AUTH_ROUTES.LOGIN,
        response: this.createLoginRedirect(request, pathname)
      };
    }

    if (!this.isValidTokenFormat(session.token!)) {
      // Invalid token format, redirect to login
      return {
        shouldRedirect: true,
        redirectUrl: AUTH_ROUTES.LOGIN,
        response: this.createLoginRedirect(request, pathname)
      };
    }

    if (this.isTokenExpired(session.token!)) {
      // Token expired, redirect to login
      return {
        shouldRedirect: true,
        redirectUrl: AUTH_ROUTES.LOGIN,
        response: this.createLoginRedirect(request, pathname)
      };
    }

    // All checks passed, allow access
    return { shouldRedirect: false };
  }

  /**
   * Main middleware logic handler
   */
  static handleRequest(request: NextRequest): NextResponse {
    const { pathname } = request.nextUrl;

    // Handle public routes
    if (RouteUtils.isPublicRoute(pathname)) {
      return NextResponse.next();
    }

    // Handle login page
    if (RouteUtils.isLoginPage(pathname)) {
      const result = this.handleLoginPage(request);
      return result.response || NextResponse.next();
    }

    // Handle home page
    if (RouteUtils.isHomePage(pathname)) {
      const result = this.handleHomePage(request);
      return result.response || NextResponse.next();
    }

    // Handle protected routes
    if (RouteUtils.needsAuth(pathname)) {
      const result = this.handleProtectedRoute(request);
      return result.response || NextResponse.next();
    }

    // Default: allow access
    return NextResponse.next();
  }

  /**
   * Log authentication events (for debugging)
   */
  static logAuthEvent(
    event: 'login' | 'logout' | 'access_denied' | 'token_expired' | 'invalid_token',
    request: NextRequest,
    details?: any
  ): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔐 Auth Event: ${event}`, {
        pathname: request.nextUrl.pathname,
        userAgent: request.headers.get('user-agent'),
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        timestamp: new Date().toISOString(),
        details
      });
    }
  }
}

// Middleware configuration helper
export const createMiddlewareConfig = () => ({
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (API routes for authentication)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)',
  ],
});

// Export commonly used functions
export const {
  isAuthenticated,
  getSessionFromRequest,
  handleRequest,
  createLoginRedirect,
  createRedirectResponse,
  logAuthEvent
} = AuthUtils; 