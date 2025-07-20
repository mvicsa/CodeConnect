import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';

const PUBLIC_PATHS = [
  '/login',
  '/register',
  '/forgotpassword',
  '/auth',
];

export default function middleware(request: NextRequest) {
  // Next-intl i18n middleware
  const intlResponse = createMiddleware({
    locales: ['en', 'ar'],
    defaultLocale: 'en',
    localePrefix: 'always',
  })(request);

  // Get pathname without locale prefix
  const { pathname } = request.nextUrl.clone();
  const pathWithoutLocale = pathname.replace(/^\/(en|ar)(\/|$)/, '/');

  const token = request.cookies.get('token')?.value;
  const locale = pathname.match(/^\/(en|ar)(\/|$)/)?.[1] || 'en';

  // If authenticated and trying to access a public auth page, redirect to timeline
  if (token && PUBLIC_PATHS.some((p) => pathWithoutLocale.startsWith(p))) {
    const homeUrl = new URL(`/${locale}/`, request.url);
    return NextResponse.redirect(homeUrl);
  }

  // If not authenticated and trying to access a protected page, redirect to login
  if (!token && !PUBLIC_PATHS.some((p) => pathWithoutLocale.startsWith(p))) {
    const loginUrl = new URL(`/${locale}/login`, request.url);
    return NextResponse.redirect(loginUrl);
  }

  return intlResponse;
}

export const config = {
  matcher: ['/((?!_next|.*\\..*|api).*)'],
};
