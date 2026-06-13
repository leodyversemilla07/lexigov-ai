import { type NextRequest, NextResponse } from 'next/server';

const protectedRoutePrefixes = [
  '/account',
  '/ai',
  '/compare',
  '/compliance',
  '/dashboard',
  '/drafts',
  '/export',
  '/settings',
  '/templates',
];

const authRoutePrefixes = ['/sign-in', '/sign-up'];

function hasSessionCookie(request: NextRequest) {
  return Boolean(
    request.cookies.get('better-auth.session_token')?.value ||
      request.cookies.get('__Secure-better-auth.session_token')?.value,
  );
}

function matchesPrefix(pathname: string, prefixes: string[]) {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthenticated = hasSessionCookie(request);

  if (!isAuthenticated && matchesPrefix(pathname, protectedRoutePrefixes)) {
    const signInUrl = new URL('/sign-in', request.url);
    signInUrl.searchParams.set('callbackURL', `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(signInUrl);
  }

  if (isAuthenticated && matchesPrefix(pathname, authRoutePrefixes)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/account/:path*',
    '/ai/:path*',
    '/compare/:path*',
    '/compliance/:path*',
    '/dashboard/:path*',
    '/drafts/:path*',
    '/export/:path*',
    '/settings/:path*',
    '/templates/:path*',
    '/sign-in/:path*',
    '/sign-up/:path*',
  ],
};
