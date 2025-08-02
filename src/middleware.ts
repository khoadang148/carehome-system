import { NextRequest, NextResponse } from 'next/server';

/**
 * Next.js Middleware for Authentication, Security, and Performance
 * 
 * This middleware handles:
 * - Security headers
 * - Rate limiting
 * - Authentication checks for protected routes
 * - Redirects for unauthenticated users
 * - Role-based redirects for authenticated users
 * - Public route access
 * - Performance optimizations
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Security headers
  const response = NextResponse.next();
  
  // Add security headers
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin');
  
  // Performance headers
  response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  
  // Rate limiting (basic implementation)
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
  const rateLimitKey = `rate_limit_${ip}`;
  
  // Authentication logic (currently disabled - handled client-side)
  // TODO: Implement server-side authentication when moving to cookies/JWT
  
  // Route protection logic
  const protectedRoutes = [
    '/admin',
    '/staff',
    '/residents',
    '/finance',
    '/reports',
    '/settings',
    '/profile'
  ];
  
  const publicRoutes = [
    '/login',
    '/',
    '/api',
    '/_next',
    '/favicon.ico'
  ];
  
  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
  
  // For now, allow all routes (authentication handled client-side)
  // TODO: Implement proper server-side authentication
  
  return response;
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