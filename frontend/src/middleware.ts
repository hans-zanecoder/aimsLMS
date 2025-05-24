import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token');
  const path = request.nextUrl.pathname;

  // Public paths that don't require authentication
  if (path === '/login') {
    // If user is already logged in, redirect to appropriate dashboard
    if (token) {
      // Get the role from the JWT token (you'll need to decode it)
      const tokenData = token.value ? JSON.parse(atob(token.value.split('.')[1])) : null;
      const role = tokenData?.role || 'student';
      
      // Redirect to the appropriate dashboard
      const dashboardPath = `/${role}/dashboard`;
      return NextResponse.redirect(new URL(dashboardPath, request.url));
    }
    return NextResponse.next();
  }

  // Protected paths that require authentication
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Get the role from the JWT token
  const tokenData = token.value ? JSON.parse(atob(token.value.split('.')[1])) : null;
  const role = tokenData?.role || 'student';

  // Role-based route protection
  if (path.startsWith('/admin') && role !== 'admin') {
    return NextResponse.redirect(new URL(`/${role}/dashboard`, request.url));
  }

  if (path.startsWith('/instructor') && role !== 'instructor') {
    return NextResponse.redirect(new URL(`/${role}/dashboard`, request.url));
  }

  if (path.startsWith('/student') && role !== 'student') {
    return NextResponse.redirect(new URL(`/${role}/dashboard`, request.url));
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