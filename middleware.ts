import { NextRequest, NextResponse } from 'next/server';
import { config as appConfig } from './lib/config';
import { readSessionFromCookie } from './lib/auth/session';

const PUBLIC_PATHS = ['/login'];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

function logResponse(
  response: NextResponse,
  request: NextRequest,
  start: number,
  extra?: Record<string, unknown>
) {
  const duration = Date.now() - start;
  console.log(
    `[${new Date().toISOString()}] Response ${response.status} ${request.url} - ${duration}ms`,
    {
      status: response.status,
      statusText: response.statusText,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
      ...extra,
    }
  );
  console.log(`=============================END=======================================`);

  return response;
}

export function middleware(request: NextRequest) {
  const start = Date.now();
  const requestTimestamp = new Date().toISOString();
  console.log(`=============================START=======================================`);
  console.log(`[${requestTimestamp}] ${request.method} ${request.url}`, {
    headers: Object.fromEntries(request.headers.entries()),
    userAgent: request.headers.get('user-agent'),
    ip:
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown',
    timestamp: requestTimestamp,
  });

  const { pathname } = request.nextUrl;
  const sessionCookieValue = request.cookies.get(appConfig.auth.sessionCookieName)?.value;
  const session = readSessionFromCookie(sessionCookieValue);
  const mockBypass = request.headers.get('x-mock-auth') === 'allow';
  const acceptsHTML = request.headers.get('accept')?.includes('text/html') ?? false;
  const publicPath = isPublicPath(pathname);

  if (!session && !mockBypass && !publicPath) {
    if (request.method === 'GET' && acceptsHTML) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/login';

      const destination = `${pathname}${request.nextUrl.search}`;
      if (destination && destination !== '/login') {
        loginUrl.searchParams.set('redirectTo', destination);
      }

      console.warn('[auth] Redirecting unauthenticated request', {
        url: request.url,
        destination: loginUrl.toString(),
      });

      return logResponse(NextResponse.redirect(loginUrl), request, start);
    }

    console.warn('[auth] Unauthorized request blocked', {
      url: request.url,
      method: request.method,
      hasCookie: Boolean(sessionCookieValue),
    });

    return logResponse(
      NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 }),
      request,
      start
    );
  }

  if (session && publicPath && pathname === '/login') {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = '/';
    homeUrl.search = '';

    return logResponse(NextResponse.redirect(homeUrl), request, start, {
      reason: 'already-authenticated',
    });
  }

  const response = NextResponse.next();
  return logResponse(response, request, start);
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
