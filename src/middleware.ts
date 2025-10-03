import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';

const PUBLIC_PATHS = [
  '/login',
  '/register',
  '/forgotpassword',
  '/reset-password',
  '/auth',
];

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl.clone();
  
  // Skip middleware for static files (files with extensions)
  if (pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|pdf|txt|json|xml|html|htm|map|avif)$/)) {
    return NextResponse.next();
  }

  // Next-intl i18n middleware
  const intlResponse = createMiddleware({
    locales: ['en', 'ar'],
    defaultLocale: 'en',
    localePrefix: 'always',
  })(request);
  const pathWithoutLocale = pathname.replace(/^\/(en|ar)(\/|$)/, '/');

  const token = request.cookies.get('token')?.value;
  const username = request.cookies.get('username')?.value;
  const locale = pathname.match(/^\/(en|ar)(\/|$)/)?.[1] || 'en';

  // If hitting /{locale}/profile directly and we have username, redirect early to user's profile
  if (token && username && pathWithoutLocale === '/profile') {
    const profileUrl = new URL(`/${locale}/profile/${username}`, request.url);
    return NextResponse.redirect(profileUrl);
  }

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
  matcher: [
    // Match all paths except _next and api
    // This will process /profile/reda.ahmed and redirect to /en/profile/reda.ahmed
    '/((?!_next|api).*)',
  ],
};
