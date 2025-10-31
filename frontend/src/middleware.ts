import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get auth token and role from cookies
  const authToken = request.cookies.get('auth_token')?.value;
  const userRole = request.cookies.get('user_role')?.value;

  // Check if user is authenticated
  if (!authToken) {
    // Redirect to login with the original URL as redirect parameter
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check role-based access
  if (pathname.startsWith('/institution')) {
    // Institution routes: accessible by INSTITUTION and TEACHER roles
    if (userRole !== 'institution' && userRole !== 'teacher') {
      const homeUrl = new URL('/', request.url);
      homeUrl.searchParams.set('error', 'unauthorized');
      return NextResponse.redirect(homeUrl);
    }
  } else if (pathname.startsWith('/teacher')) {
    // Teacher routes: accessible by TEACHER role only
    if (userRole !== 'teacher') {
      const homeUrl = new URL('/', request.url);
      homeUrl.searchParams.set('error', 'unauthorized');
      return NextResponse.redirect(homeUrl);
    }
  } else if (pathname.startsWith('/student')) {
    // Student routes: accessible by STUDENT role only
    if (userRole !== 'student') {
      const homeUrl = new URL('/', request.url);
      homeUrl.searchParams.set('error', 'unauthorized');
      return NextResponse.redirect(homeUrl);
    }
  }

  // Allow the request to proceed
  return NextResponse.next();
}

// Configure which routes to protect
export const config = {
  matcher: [
    '/institution/:path*',
    '/teacher/:path*',
    '/student/:path*',
  ],
};

