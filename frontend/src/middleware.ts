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
  console.log('\n=== Middleware Execution ===');
  console.log('Path:', request.nextUrl.pathname);
  console.log('Full URL:', request.url);
  console.log('Method:', request.method);
  console.log('Headers:', Object.fromEntries(request.headers));
  
  // Get the pathname
  const path = request.nextUrl.pathname;
  
  // Get token from cookie
  const token = request.cookies.get('token');
  console.log('Cookie token present:', !!token);
  if (token) {
    console.log('Cookie token value length:', token.value.length);
    // Log what we can access from the cookie
    console.log('Cookie details:', {
      name: token.name,
      value: token.value ? `${token.value.substring(0, 10)}...` : undefined,
      path: token.path,
      expires: token.expires,
    });
  }

  // Function to create response with preserved headers
  const createResponse = (url: string) => {
    console.log('Creating redirect response to:', url);
    const response = NextResponse.redirect(new URL(url, request.url));
    // Preserve the CORS and cookie headers
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    const origin = process.env.NEXT_PUBLIC_FRONTEND_URL || request.headers.get('origin') || '';
    response.headers.set('Access-Control-Allow-Origin', origin);
    console.log('Response headers:', Object.fromEntries(response.headers));
    return response;
  };
  
  // Function to decode JWT without verification
  const decodeJwt = (token: string): JwtPayload | null => {
    try {
      const decoded = JSON.parse(atob(token.split('.')[1]));
      console.log('Decoded JWT payload:', decoded);
      return decoded;
    } catch (e) {
      console.error('Failed to decode JWT:', e);
      return null;
    }
  };

  // Handle login page
  if (path === '/login') {
    console.log('Processing login page request');
    if (token?.value) {
      console.log('Token found on login page, attempting to decode');
      const decoded = decodeJwt(token.value);
      if (decoded?.role) {
        console.log('Valid role found in token, redirecting to dashboard');
        const dashboardPath = `/${decoded.role}/dashboard`;
        return createResponse(dashboardPath);
      }
    }
    console.log('No valid token found, allowing access to login page');
    return NextResponse.next();
  }

  // Protected routes check
  if (!token?.value) {
    console.log('No token found for protected route, redirecting to login');
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', request.nextUrl.pathname);
    console.log('Redirect URL with from parameter:', loginUrl.toString());
    return createResponse(loginUrl.toString());
  }

  // Role-based access control
  const decoded = decodeJwt(token.value);
  const role = decoded?.role;
  console.log('User role from token:', role);

  // Define allowed paths for each role
  const allowedPaths: Record<UserRole, string[]> = {
    admin: ['/admin'],
    instructor: ['/instructor'],
    student: ['/student']
  };

  // Check if user has access to the current path
  const hasAccess = role && allowedPaths[role]?.some(allowedPath => path.startsWith(allowedPath));
  console.log('Access check:', { role, path, hasAccess });

  if (!hasAccess) {
    console.log('Access denied, redirecting to appropriate dashboard');
    if (role) {
      const dashboardPath = `/${role}/dashboard`;
      return createResponse(dashboardPath);
    }
    return createResponse('/login');
  }

  console.log('Access granted, proceeding with request');
  const response = NextResponse.next();
  // Add CORS headers to all responses
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Allow-Origin', process.env.NEXT_PUBLIC_FRONTEND_URL || request.headers.get('origin') || '');
  console.log('Final response headers:', Object.fromEntries(response.headers));
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