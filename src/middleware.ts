import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Các routes không cần auth
const publicRoutes = [
  '/login',
  '/api/auth/login',
  '/api/auth/refresh',
  '/_next',
  '/favicon.ico',
  '/images',
  '/assets'
]

// Các routes cần auth
const protectedRoutes = [
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
  '/compliance'
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Nếu đang ở trang login và đã có token hợp lệ -> redirect về home
  if (pathname === '/login') {
    const token = request.cookies.get('access_token')?.value
    if (token) {
      return NextResponse.redirect(new URL('/family', request.url))
    }
    return NextResponse.next()
  }

  // Kiểm tra xem route hiện tại có phải public route không
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))
  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Kiểm tra xem route hiện tại có cần auth không
  const needsAuth = protectedRoutes.some(route => pathname.startsWith(route))
  if (!needsAuth && pathname === '/') {
    // Redirect trang chủ về login nếu không có auth
    const token = request.cookies.get('access_token')?.value
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    // Nếu có token thì redirect về family dashboard
    return NextResponse.redirect(new URL('/family', request.url))
  }

  // Lấy token từ cookie
  const token = request.cookies.get('access_token')?.value

  // Nếu route cần auth mà không có token -> redirect về login
  if (needsAuth && !token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('returnUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Nếu có token thì cho phép truy cập
  return NextResponse.next()
}

// Chỉ định các routes cần apply middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (API routes for authentication)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
} 