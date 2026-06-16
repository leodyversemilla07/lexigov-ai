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

const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '0',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self' http://localhost:* https:",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
  ].join('; '),
};

function hasSessionCookie(request: NextRequest) {
  return Boolean(
    request.cookies.get('better-auth.session_token')?.value ||
      request.cookies.get('__Secure-better-auth.session_token')?.value,
  );
}

function matchesPrefix(pathname: string, prefixes: string[]) {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function addSecurityHeaders(response: NextResponse): void {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthenticated = hasSessionCookie(request);

  let response: NextResponse;

  if (!isAuthenticated && matchesPrefix(pathname, protectedRoutePrefixes)) {
    const signInUrl = new URL('/sign-in', request.url);
    signInUrl.searchParams.set('callbackURL', `${pathname}${request.nextUrl.search}`);
    response = NextResponse.redirect(signInUrl);
  } else if (isAuthenticated && matchesPrefix(pathname, authRoutePrefixes)) {
    response = NextResponse.redirect(new URL('/dashboard', request.url));
  } else {
    response = NextResponse.next();
  }

  addSecurityHeaders(response);
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/auth).*)'],
};
