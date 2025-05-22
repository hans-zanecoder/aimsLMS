import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token');
  const path = request.nextUrl.pathname;

  // Public paths that don't require authentication
  if (path === '/login') {
    // If user is already logged in, redirect to appropriate dashboard
    if (token) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    return NextResponse.next();
  }

  // Protected paths that require authentication
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Role-based route protection
  if (path.startsWith('/admin') || path.startsWith('/instructor') || path.startsWith('/student')) {
    // The actual role check will be done by the AuthProvider component
    // This is just a basic check to ensure the token exists
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/login',
    '/admin/:path*',
    '/instructor/:path*',
    '/student/:path*',
  ],
}; 