import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow access to login page without authentication
  if (pathname === '/login' || pathname.startsWith('/login')) {
    return NextResponse.next();
  }

  // Get auth token and role from cookies
  const authToken = request.cookies.get('auth_token')?.value;
  const userRole = request.cookies.get('user_role')?.value;
  const isTemporaryPassword = request.cookies.get('is_temporary_password')?.value === 'true';

  // Check if user is authenticated
  if (!authToken) {
    // Redirect to login with the original URL as redirect parameter
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If user has temporary password, force them to change it
  // Allow access to change password pages and settings pages
  if (isTemporaryPassword) {
    const isChangePasswordPage = 
      pathname.includes('/change-password') || 
      pathname.includes('/settings');
    
    if (!isChangePasswordPage) {
      // Redirect to appropriate change password page based on role
      const changePasswordRedirect: Record<string, string> = {
        'student': '/student/settings',
        'teacher': '/teacher/change-password',
        'institution': '/institution/change-password'
      };
      const redirectPath = changePasswordRedirect[userRole || ''] || '/login';
      return NextResponse.redirect(new URL(redirectPath, request.url));
    }
  }

  // Check role-based access
  if (pathname.startsWith('/super-admin')) {
    // Super admin routes: accessible by superadmin role only
    if (userRole !== 'superadmin') {
      const homeUrl = new URL('/', request.url);
      homeUrl.searchParams.set('error', 'unauthorized');
      return NextResponse.redirect(homeUrl);
    }
  } else if (pathname.startsWith('/institution')) {
    // Institution routes: accessible by INSTITUTION and TEACHER roles only
    // Super admins should NOT access institution pages (they are separate)
    if (userRole === 'superadmin') {
      const homeUrl = new URL('/', request.url);
      homeUrl.searchParams.set('error', 'unauthorized');
      return NextResponse.redirect(homeUrl);
    }
    if (userRole !== 'institution' && userRole !== 'teacher') {
      const homeUrl = new URL('/', request.url);
      homeUrl.searchParams.set('error', 'unauthorized');
      return NextResponse.redirect(homeUrl);
    }
  } else if (pathname.startsWith('/teacher')) {
    // Teacher routes: accessible by TEACHER role only
    // Super admins should NOT access teacher pages
    if (userRole === 'superadmin') {
      const homeUrl = new URL('/', request.url);
      homeUrl.searchParams.set('error', 'unauthorized');
      return NextResponse.redirect(homeUrl);
    }
    // Teacher routes: accessible by TEACHER role only
    if (userRole !== 'teacher') {
      const homeUrl = new URL('/', request.url);
      homeUrl.searchParams.set('error', 'unauthorized');
      return NextResponse.redirect(homeUrl);
    }
  } else if (pathname.startsWith('/student')) {
    // Student routes: accessible by STUDENT role only
    // Super admins should NOT access student pages
    if (userRole === 'superadmin') {
      const homeUrl = new URL('/', request.url);
      homeUrl.searchParams.set('error', 'unauthorized');
      return NextResponse.redirect(homeUrl);
    }
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
    '/super-admin/:path*',
    '/institution/:path*',
    '/teacher/:path*',
    '/student/:path*',
  ],
};

