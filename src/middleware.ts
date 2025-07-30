import { NextRequest, NextResponse } from 'next/server';
// import { AuthUtils, createMiddlewareConfig } from '@/lib/utils/auth';

/**
 * Next.js Middleware for Authentication and Route Protection
 * 
 * This middleware handles:
 * - Authentication checks for protected routes
 * - Redirects for unauthenticated users
 * - Role-based redirects for authenticated users
 * - Public route access
 * 
 * NOTE: Currently disabled because authentication uses localStorage/sessionStorage
 * instead of cookies. Middleware runs on server-side and cannot access browser storage.
 */
export function middleware(request: NextRequest) {
  // Temporarily disabled - authentication is handled client-side
  return NextResponse.next();
}

// Export middleware configuration
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}; 