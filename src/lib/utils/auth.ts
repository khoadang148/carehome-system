import { NextRequest, NextResponse } from 'next/server';
import { 
  RouteUtils, 
  AUTH_ROUTES, 
  COOKIE_NAMES, 
  DEFAULT_REDIRECTS 
} from '@/lib/constants/routes';


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


export class AuthUtils {
  
  
  static getTokenFromRequest(request: NextRequest): string | undefined {
    return request.cookies.get(COOKIE_NAMES.ACCESS_TOKEN)?.value;
  }

  
  static getUserRoleFromRequest(request: NextRequest): string | undefined {
    return request.cookies.get(COOKIE_NAMES.USER_ROLE)?.value;
  }

  
  static getUserIdFromRequest(request: NextRequest): string | undefined {
    return request.cookies.get(COOKIE_NAMES.USER_ID)?.value;
  }

  
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

  
  static isAuthenticated(request: NextRequest): boolean {
    return Boolean(this.getTokenFromRequest(request));
  }

  
  static isValidTokenFormat(token: string): boolean {
    
    return Boolean(token && token.length > 10 && typeof token === 'string');
  }


  static isTokenExpired(token: string): boolean {
    try {
      
      return false;
    } catch (error) {
      return true;
    }
  }

  
  static getDefaultRedirectForRole(role?: string): string {
    return RouteUtils.getDefaultRedirect(role);
  }

  
  static createRedirectResponse(request: NextRequest, path: string): NextResponse {
    const redirectUrl = RouteUtils.buildRedirectUrl(request.url, path);
    return NextResponse.redirect(redirectUrl);
  }

  
  static createLoginRedirect(request: NextRequest, returnPath?: string): NextResponse {
    const loginUrl = RouteUtils.buildLoginUrl(request.url, returnPath);
    return NextResponse.redirect(loginUrl);
  }

  
  static handleLoginPage(request: NextRequest): AuthRedirectResult {
    const session = this.getSessionFromRequest(request);
    
    if (session.isAuthenticated && this.isValidTokenFormat(session.token!)) {
      
      const redirectPath = this.getDefaultRedirectForRole(session.role);
      return {
        shouldRedirect: true,
        redirectUrl: redirectPath,
        response: this.createRedirectResponse(request, redirectPath)
      };
    }

    
    return { shouldRedirect: false };
  }

  
  static handleHomePage(request: NextRequest): AuthRedirectResult {
    const session = this.getSessionFromRequest(request);
    
    if (session.isAuthenticated && this.isValidTokenFormat(session.token!)) {
      
      const redirectPath = this.getDefaultRedirectForRole(session.role);
      return {
        shouldRedirect: true,
        redirectUrl: redirectPath,
        response: this.createRedirectResponse(request, redirectPath)
      };
    }

    
    return {
      shouldRedirect: true,
      redirectUrl: AUTH_ROUTES.LOGIN,
      response: this.createLoginRedirect(request)
    };
  }

  
  static handleProtectedRoute(request: NextRequest): AuthRedirectResult {
    const session = this.getSessionFromRequest(request);
    const { pathname } = request.nextUrl;
    
    if (!session.isAuthenticated) {
      
      return {
        shouldRedirect: true,
        redirectUrl: AUTH_ROUTES.LOGIN,
        response: this.createLoginRedirect(request, pathname)
      };
    }

    if (!this.isValidTokenFormat(session.token!)) {

      return {
        shouldRedirect: true,
        redirectUrl: AUTH_ROUTES.LOGIN,
        response: this.createLoginRedirect(request, pathname)
      };
    }

    if (this.isTokenExpired(session.token!)) {
      
      return {
        shouldRedirect: true,
        redirectUrl: AUTH_ROUTES.LOGIN,
        response: this.createLoginRedirect(request, pathname)
      };
    }

    
    return { shouldRedirect: false };
  }

  
  static handleRequest(request: NextRequest): NextResponse {
    const { pathname } = request.nextUrl;

    
    if (RouteUtils.isPublicRoute(pathname)) {
      return NextResponse.next();
    }

    
    if (RouteUtils.isLoginPage(pathname)) {
      const result = this.handleLoginPage(request);
      return result.response || NextResponse.next();
    }

    
    if (RouteUtils.isHomePage(pathname)) {
      const result = this.handleHomePage(request);
      return result.response || NextResponse.next();
    }

    
    if (RouteUtils.needsAuth(pathname)) {
      const result = this.handleProtectedRoute(request);
      return result.response || NextResponse.next();
    }

    
    return NextResponse.next();
  }

  
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


export const createMiddlewareConfig = () => ({
  matcher: [
    
    '/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)',
  ],
});

    
export const {
  isAuthenticated,
  getSessionFromRequest,
  handleRequest,
  createLoginRedirect,
  createRedirectResponse,
  logAuthEvent
} = AuthUtils; 