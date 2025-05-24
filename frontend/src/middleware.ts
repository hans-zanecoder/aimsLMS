import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

type UserRole = 'admin' | 'instructor' | 'student';

interface JwtPayload {
  role: UserRole;
  userId: string;
  iat: number;
  exp: number;
}

export function middleware(request: NextRequest) {
  // Get the pathname
  const path = request.nextUrl.pathname;
  
  // Get token from cookie
  const token = request.cookies.get('token');
  
  // Function to decode JWT without verification
  const decodeJwt = (token: string): JwtPayload | null => {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
      return null;
    }
  };

  // Function to create response with preserved headers
  const createResponse = (url: URL | string) => {
    const response = NextResponse.redirect(url);
    // Preserve the CORS and cookie headers
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Origin', process.env.NEXT_PUBLIC_FRONTEND_URL || request.headers.get('origin') || '');
    return response;
  };

  // Handle login page
  if (path === '/login') {
    if (token?.value) {
      const decoded = decodeJwt(token.value);
      if (decoded?.role) {
        const dashboardPath = `/${decoded.role}/dashboard`;
        return createResponse(new URL(dashboardPath, request.url));
      }
    }
    return NextResponse.next();
  }

  // Protected routes check
  if (!token?.value) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', request.nextUrl.pathname);
    return createResponse(loginUrl);
  }

  // Role-based access control
  const decoded = decodeJwt(token.value);
  const role = decoded?.role || 'student';

  // Define allowed paths for each role
  const allowedPaths: Record<UserRole, string[]> = {
    admin: ['/admin'],
    instructor: ['/instructor'],
    student: ['/student']
  };

  // Check if user has access to the current path
  const hasAccess = allowedPaths[role as UserRole]?.some((allowedPath: string) => path.startsWith(allowedPath));
  
  if (!hasAccess) {
    // Redirect to appropriate dashboard
    const dashboardPath = `/${role}/dashboard`;
    return createResponse(new URL(dashboardPath, request.url));
  }

  const response = NextResponse.next();
  // Add CORS headers to all responses
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Allow-Origin', process.env.NEXT_PUBLIC_FRONTEND_URL || request.headers.get('origin') || '');
  return response;
}

export const config = {
  matcher: [
    '/login',
    '/admin/:path*',
    '/instructor/:path*',
    '/student/:path*',
  ],
}; 