import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const AUTH_TOKEN_KEY = 'auth_token';
const AUTH_ROLE_KEY = 'auth_role';

const publicRoutes = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/verify',
  '/auth/login/desktop',
  '/',
  '/home',
  '/test-select',
];

const protectedRoutes: Record<string, string[]> = {
  '/admin': ['admin'],
  '/company': ['manager'],
  '/member': ['user'],
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublicRoute = publicRoutes.some(route =>
    pathname === route || pathname.startsWith(route + '/')
  );

  if (isPublicRoute) {
    return NextResponse.next();
  }

  const matchedProtectedRoute = Object.entries(protectedRoutes).find(([prefix]) =>
    pathname === prefix || pathname.startsWith(prefix + '/')
  );

  if (matchedProtectedRoute) {
    const [prefix, allowedRoles] = matchedProtectedRoute;
    const token = request.cookies.get(AUTH_TOKEN_KEY)?.value;
    const role = request.cookies.get(AUTH_ROLE_KEY)?.value;

    if (!token) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (!role || !allowedRoles.includes(role)) {
      const dashboardMap: Record<string, string> = {
        admin: '/admin/dashboard',
        manager: '/company/dashboard',
        user: '/member/dashboard',
      };
      const dashboard = dashboardMap[role || ''] || '/auth/login';
      return NextResponse.redirect(new URL(dashboard, request.url));
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.svg|manifest\\.json|\\.sw$|workbox-|images/|icons/).*)',
  ],
};
